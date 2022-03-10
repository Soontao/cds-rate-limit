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

```groovy
using {cuid, managed} from '@sap/cds/common';
@path : '/sample3'
service Sample3Service {
  // accepts 1000 requests in 120 seconds
  // other request will be rejected by HTTP 429 status
  @cds.rate.limit : { 
    duration : 120,
    points   : 1000,
  }
  entity People : cuid, managed {
    Name : String(255);
    Age  : Integer;
  }
}
```

## Options Hierarchy

> the `RateLimiter` configuration will use configuration in this order 

1. Event/Action/Function
2. Entity
3. Service
4. Global

## Default Global Options

```js
{
  keyParts: ["tenant"],
  duration: 60, // 60 seconds
  points: 200 * 60, // 12000 requests per minutes per tenant
}
```

## Features

- [x] Global Rate Limit
- [x] Event Rate Limit
  - [ ] Inner event ignore
- [ ] Custom key
- [ ] Redis store

## [LICENSE](./LICENSE)
