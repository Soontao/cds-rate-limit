# CDS Rate Limit

> apply `rate limit` pattern to CAP nodejs application

[![node-test](https://github.com/Soontao/cds-rate-limit/actions/workflows/nodejs.yml/badge.svg)](https://github.com/Soontao/cds-rate-limit/actions/workflows/nodejs.yml)

## Get Started

```js
const cds = require('@sap/cds')
const { applyRateLimit } = require("cds-rate-limit")

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

## RateLimiter Hierarchy

> the `RateLimiter` configuration will apply restriction by order, if you do not annotate `@cds.rate.limit` on entity/action/function level, it will share the quota of the global `RateLimiter`

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
- [ ] Dynamic quota for tenants

## [LICENSE](./LICENSE)
