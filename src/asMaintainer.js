const router = require("express").Router()
const { composers, performers } = require("./mongo")
const validate = require("./validity")
const SHA256 = require("crypto-js/sha256")
const { v4: uuidv4 } = require("uuid")
const sgMail = require("@sendgrid/mail")

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const newApiKey = (prefix) => prefix + Buffer.from(uuidv4()).toString("base64")

const isAuthentic = (authHeader) =>
    SHA256(authHeader.split(" ")[1]).toString() ===
    process.env.MAINTAINER_SECRET

router.get("/", async (req, res, next) => {
    res.send("OK")
})

router.post("/composer/", async (req, res, next) => {
    if (!isAuthentic(req.headers.authorization)) {
        res.status(403)
        res.end()
    } else if (!validate("composer", req.body)) {
        res.status(400).send("request body invalid Composer")
    } else {
        let apiKey = newApiKey("loserkey")
        let composerRecord = {
            ...req.body,
            password: SHA256(req.body.password).toString(),
            joined: new Date(),
            apiKey,
        }
        try {
            await composers().insertOne(composerRecord)
            res.status(200).send("OK")

            sgMail.send({
                to: composer.email,
                from: "gould@loserio.cloud",
                subject: `Your loser.io API Key`,
                text: `Thank you for registering for the beta of loser.io. \n\nYour API key is: ${apiKey}.To get started as quickly as possible, check out our tutorial https://gist.github.com/lh00000000/2611d78df4b8bd39221914224c8a3047, our documentation https://app.swaggerhub.com/apis-docs/loserio/loser/1.0.0, and our engineering blog https://medium.com/loser-io-engineering-blog .`,
                html: `Thank you for registering for the beta of loser.io. <br> <br> <br> Your API key is: ${apiKey}<br> <br> To get started as quickly as possible, <a href="https://gist.github.com/lh00000000/2611d78df4b8bd39221914224c8a3047" target="_blank"> check out our tutorial</a>, <a target="_blank" href="https://app.swaggerhub.com/apis-docs/loserio/loser/1.0.0"> our documentation</a>, and <a target="_blank"href="https://medium.com/loser-io-engineering-blog"> our engineering blog </a>.`,
            })

        } catch (err) {
            if (err.name === "MongoError" && err.code === 11000) {
                res.status(422).send("composer already exists")
            } else {
                next(err)
            }
        }


    }
})

router.post("/performer/", async (req, res, next) => {
    if (!isAuthentic(req.headers.authorization)) {
        res.status(403)
        res.end()
    } else if (!validate("performer", req.body)) {
        res.status(400).send("request body invalid performer")
    } else {
        let performer = {
            name: req.body.name,
            apiKey: newApiKey("performerkey"),
        }
        try {
            await performers().insertOne(performer)
            res.status(200).send("OK")
        } catch (err) {
            if (err.name === "MongoError" && err.code === 11000) {
                res.status(422).send("performer already exists")
            } else {
                next(err)
            }
        }
    }
})

module.exports = router
