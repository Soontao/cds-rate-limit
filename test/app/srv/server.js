const cds = require('@sap/cds')

cds.on("bootstrap", app => app.set('trust proxy', 'loopback, linklocal, uniquelocal'))

module.exports = cds.server
