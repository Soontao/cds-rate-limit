const cds = require('@sap/cds')
const { applyRateLimit } = require("../../../src")
const Redis = require("ioredis")

const client = new Redis({ enableOfflineQueue: false });

applyRateLimit(cds, { impl: "redis", storeClient: client })

module.exports = cds.server
