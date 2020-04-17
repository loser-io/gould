const Ajv = require("ajv")

const schemas = {
    performer: {
        path: "./schemas/performer.json",
        id: "performer.json"
    },
    opus: {
        path: "./schemas/opus.json",
        id: "opus.json"
    },
    status: {
        path: "./schemas/status.json",
        id: "status.json"
    },
    composer: {
        path: "./schemas/composer.json",
        id: "composer.json"
    },
}

const ajv = new Ajv({
    allErrors: true,
    schemas: Object.values(schemas).map(sch => require(sch.path))
 })
module.exports = (type, obj) => ajv.getSchema(schemas[type].id)(obj)