# CDS Rate Limit

> apply `rate limit` pattern to CAP nodejs application

[![node-test](https://github.com/Soontao/cds-rate-limit/actions/workflows/nodejs.yml/badge.svg)](https://github.com/Soontao/cds-rate-limit/actions/workflows/nodejs.yml)
[![codecov](https://codecov.io/gh/Soontao/cds-rate-limit/branch/main/graph/badge.svg?token=xzBkWloYNR)](https://codecov.io/gh/Soontao/cds-rate-limit)


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

## Options

- `keyParts`: use to generated the key
- `points`: quota for each key
- `duration`: quota for each key in duration

### Default Global Options

**if there is no annotation on CDS Service/Entity/Action/Function, it will use the global configuration**

```js
{
  keyParts: ["tenant"], // generate key from tenant
  duration: 60, // 60 seconds
  points: 200 * 60, // 12000 requests per minutes per tenant
}
```

### Options - Memory

```js
const Redis = require("ioredis")
const storeClient = new Redis({ enableOfflineQueue: false });
// configuration global default configuration
// each user could call API 6000 times in 1 minute duration
applyRateLimit(cds, { impl: "memory", storeClient, duration: 60, points: 6000, keyParts: ['user_id'] })
```

### Options - Redis

```js
// configuration global default configuration with redis
// each user in each tenant could use the API 300 times in 5 seconds duration
applyRateLimit(cds, { impl: "redis", duration: 5, points: 300, keyParts: ['tenant', 'user_id'] })
```

## Features

- [x] Global Rate Limit
- [x] Event Rate Limit
  - [ ] Inner event ignore
- [ ] Custom key
- [x] Redis store
- [ ] Dynamic quota for tenants
- [ ] Sampling store to reduce remote store network consumption

## ToDo

- [ ] Documents for microservice
- [ ] Performance

## [LICENSE](./LICENSE)
