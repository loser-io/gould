const router = require("express").Router()
const { composers, performers } = require("./mongo")
const validate = require("./validity")
const SHA256 = require("crypto-js/sha256")
const { v4: uuidv4 } = require("uuid")

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
        let composerRecord = {
            ...req.body,
            password: SHA256(req.body.password).toString(),
            joined: new Date(),
            apiKey: newApiKey("loserkey"),
        }
        try {
            await composers().insertOne(composerRecord)
            res.status(200).send("OK")
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
