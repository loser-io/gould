const validate = require("./validity")
const router = require("express").Router()
const {composers, opuses} = require("./mongo")


router.post("/opus", async (req, res, next) => {
    try {
        composer = await composers()
            .findOne({ apiKey: req.headers.authorization.split(" ")[1] })

        if (composer === undefined) {
            res.status(403)
            res.end()
        }

        if (validate("opus", req.body)) {

            let newOpus = {
                events: req.body.events,
                submitted: new Date(),
                composerId: composer._id.toString(),
                status: "AVAILABLE",
            }

            let confirm = await opuses().insertOne(newOpus)
            res.json({
                id: confirm.insertedId,
                submitted: newOpus.submitted,
                events: {
                    count: req.body.events.length
                }
            })
        }

    } catch (err) {
        next(err)
    }
})


module.exports = router
