# CDS Rate Limit

> apply `rate limit` pattern to CAP nodejs application

[![node-test](https://github.com/Soontao/cds-rate-limit/actions/workflows/nodejs.yml/badge.svg)](https://github.com/Soontao/cds-rate-limit/actions/workflows/nodejs.yml)

## Get Started

```js
const cds = require('@sap/cds')
const { applyRateLimit } = require("../../../src")

applyRateLimit(cds) // global limitation

module.exports = cds.server
```

```groovy
using {cuid, managed} from '@sap/cds/common';
@path : '/sample3'
service Sample3Service {
  @cds.rate.limit : { // accepts 1000 requests in 120 seconds, other request will be rejected by 429 status
    duration : 120,
    points   : 1000,
  }
  entity People : cuid, managed {
    Name : String(255);
    Age  : Integer;
  }
}
```

## Features

- [x] Global Rate Limit
- [x] Event Rate Limit
  - [ ] Inner event ignore
- [ ] Custom key
- [ ] Redis store

## [LICENSE](./LICENSE)
