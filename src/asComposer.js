const validate = require("./validity")
const router = require("express").Router()
const {composers, opuses} = require("./mongo")
const _ = require("lodash")

router.use(async (req, res, next) => {
    let apiKey = _.get(req.headers.authorization.split(" "),  1, "")
    composer = await composers().findOne({ apiKey })
    if (composer) {
        res.locals.composer = composer
        res.locals.composerId = composer._id.toString()
    } else {
        res.status(403)
        res.end()
    }

    next()
})

router.post("/opus", async (req, res, next) => {
    try {
        if (validate("opus", req.body)) {
            let newOpus = {
                events: req.body.events,
                submitted: new Date(),
                composerId: res.locals.composerId,
                status: "AVAILABLE",
            }

            let confirm = await opuses().insertOne(newOpus)
            res.json({
                id: confirm.insertedId.toString(),
                submitted: newOpus.submitted,
                events: {
                    count: req.body.events.length
                }
            })

        } else {
            throw "Opus not valid"
        }
    } catch (err) {
        next(err)
    }
})


module.exports = router
