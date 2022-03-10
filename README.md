# CDS Rate Limit

> apply `rate limit` pattern to CAP nodejs application

[![node-test](https://github.com/Soontao/cds-rate-limit/actions/workflows/nodejs.yml/badge.svg)](https://github.com/Soontao/cds-rate-limit/actions/workflows/nodejs.yml)

## Get Started

```js
const cds = require('@sap/cds')
const { applyRateLimit } = require("../../../src")

applyRateLimit(cds)

module.exports = cds.server
```

## Features

- [x] Global Rate Limit
- [x] Event Rate Limit
  - [ ] Inner event ignore
- [ ] Custom key
- [ ] Redis store

## [LICENSE](./LICENSE)
