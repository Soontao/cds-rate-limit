const cds = require('@sap/cds')
const { applyRateLimit } = require("../../../src")

applyRateLimit(cds, { impl: "memory" })

module.exports = cds.server
