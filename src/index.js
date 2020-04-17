require('dotenv').config()
require("./mongo").initMc()

const express = require("express")
const cors = require("cors")
const app = express()
const bodyParser = require("body-parser")
const rateLimit = require("express-rate-limit")

app.use(rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW,
    max: process.env.RATE_LIMIT_MAX,
}))
app.use(bodyParser.json())
app.use((err, req, res, next) => {
  if (error !== null) {
    return response.json({ 'invalid': 'json' });
  }
  return next();
});
app.use(cors())
app.use("/api/as/maintainer/", require("./asMaintainer"))
app.use("/api/as/composer/", require("./asComposer"))
app.use("/api/as/performer", require("./asPerformer"))

const server = app.listen(8081, () => {
    const {address, port} = server.address()
    console.log(`http://${address}:${port}`)
})
