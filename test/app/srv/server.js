const cds = require('@sap/cds')
const { applyRateLimit } = require("../../../src")

cds.on("bootstrap", app => app.set('trust proxy', 'loopback, linklocal, uniquelocal'))

applyRateLimit(cds, {
  impl: "memory",
  anonymous: {
    points: 1000,
    duration: 36
  }
})

module.exports = cds.server
