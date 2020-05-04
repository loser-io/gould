const ObjectId = require("mongodb").ObjectId
const { opuses, performers, composers } = require("./mongo")
const router = require("express").Router()
const _ = require("lodash")
const AWS = require("aws-sdk")
const sgMail = require("@sendgrid/mail")

sgMail.setApiKey(process.env.GOULD_SENDGRID_API_KEY)

const spacesEndpoint = new AWS.Endpoint("nyc3.digitaloceanspaces.com")
let s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.GOULD_S3_KEY_ID,
    secretAccessKey: process.env.GOULD_S3_SECRET_ACCESS_KEY,
})

const getAssignedI = async (performerId) => {
    let findNext = async (query) => {
        let results = await opuses()
            .find(query)
            .sort({
                submitted: 1,
            })
            .limit(1)
            .toArray()
        if (results.length) {
            return results[0]
        } else {
            return undefined
        }
    }
    let alreadyAssigned = await findNext({
        status: "RECORDING",
        performerId: performerId,
    })

    if (!_.isUndefined(alreadyAssigned)) {
        return alreadyAssigned
    } else {
        let nextAvailable = await findNext({ status: "AVAILABLE" })
        if (!_.isUndefined(nextAvailable)) {
            let query = { _id: nextAvailable._id }
            let ops = {
                $set: { performerId, status: "RECORDING" },
            }
            let update = await opuses().updateOne(query, ops)
            return {...nextAvailable, status: "RECORDING"}
        } else {
            return undefined
        }
    }
}

router.use(async (req, res, next) => {
    let performer = await performers().findOne({
        apiKey: req.headers.authorization.split(" ")[1],
    })

    if (_.isUndefined(performer)) {
        res.status(403)
        res.end()
    } else {
        res.locals.performer = performer
        res.locals.assigned = await getAssignedI(performer._id.toString())
        next()
    }
})

const rejectIfNoAssignment = async (req, res, next) => {
    if (_.isUndefined(res.locals.assigned)) {
        res.status(422).send("noassignment")
        return
    } else {
        next()
    }
}
router.get("/assigned", rejectIfNoAssignment, async (req, res, next) =>
    res.json(res.locals.assigned)
)

router.get("/destination", rejectIfNoAssignment, async (req, res, next) => {
    let assignedId = res.locals.assigned._id.toString()

    const url = s3.getSignedUrl("putObject", {
        Bucket: process.env.GOULD_BUCKET_NAME,
        Key: `${assignedId}.wav`,
        ContentType: "audio/wav",
        Expires: 3600,
    })

    res.send(url)
})

router.post("/confirmation", rejectIfNoAssignment, async (req, res, next) => {
    let opusId = res.locals.assigned._id.toString()
    let exists = await (async () => {
        let s3Params = { Bucket: process.env.GOULD_BUCKET_NAME, Key: `${opusId}.wav` }
        return new Promise((resolve) => {
            s3.headObject(s3Params, (err, data) => {
                resolve(!err)
            })
        })
    })()

    if (!exists) {
        res.send("NO")
    } else {
        let ops = {
            $set: {
                completed: new Date(),
                recordingKey: `${opusId}.wav`,
                status: "COMPLETED",
            },
        }
        let update = await opuses().updateOne({ _id: ObjectId(opusId) }, ops) // to prevent multiple emails

        // make the file public then
        let confirm = await new Promise((resolve) =>
            s3.putObjectAcl(
                {
                    Bucket: process.env.GOULD_BUCKET_NAME,
                    Key: `${opusId}.wav`,
                    ACL: "public-read",
                },
                (err, data) => resolve(data)
            )
        )

        let composer = await composers().findOne({
            _id: ObjectId(res.locals.assigned.composerId),
        })

        sgMail.send({
            to: composer.email,
            from: "gould@loserio.cloud",
            subject: `Op. ${opusId} Has Been Performed`,
            text: `Thank you for using our service. Please download the recording of your Opus at: https://losersounds.nyc3.digitaloceanspaces.com/${opusId}.wav`,
            html: `Thank you for using our service. Please download the recording of your Opus at: <a href="https://losersounds.nyc3.digitaloceanspaces.com/${opusId}.wav">https://losersounds.nyc3.digitaloceanspaces.com/${opusId}.wav</a>`,
        })

        res.send("OK")
    }
})

module.exports = router
