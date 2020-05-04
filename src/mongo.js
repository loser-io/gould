const MongoClient = require("mongodb").MongoClient
const ObjectId = require("mongodb").ObjectId

const MONGO_CONN_STR = `mongodb+srv://${process.env.GOULD_MONGO_USER}:${
    process.env.GOULD_MONGO_PW
}@${process.env.GOULD_MONGO_HOST}/test?retryWrites=true&w=majority`

const MONGO_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}

let _mc
let _composers
let _opuses
let _performers
const initMc = async () => {
    if (!_mc) {
        _mc = await MongoClient.connect(MONGO_CONN_STR, MONGO_OPTIONS)
        _composers = _mc.db("loser").collection("composers")
        _opuses = _mc.db("loser").collection("opuses")
        _performers = _mc.db("loser").collection("performers")
    }
}

module.exports = {
    initMc,
    composers: () => _composers,
    opuses: () => _opuses,
    performers: () => _performers,
}