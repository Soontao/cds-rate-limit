# CDS Rate Limit

> apply `rate limit` pattern to CAP nodejs application

[![npm](https://img.shields.io/npm/v/cds-rate-limit)](https://www.npmjs.com/package/cds-rate-limit)
[![node-test](https://github.com/Soontao/cds-rate-limit/actions/workflows/nodejs.yml/badge.svg)](https://github.com/Soontao/cds-rate-limit/actions/workflows/nodejs.yml)
[![codecov](https://codecov.io/gh/Soontao/cds-rate-limit/branch/main/graph/badge.svg?token=xzBkWloYNR)](https://codecov.io/gh/Soontao/cds-rate-limit)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Soontao_cds-rate-limit&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Soontao_cds-rate-limit)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=Soontao_cds-rate-limit&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=Soontao_cds-rate-limit)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=Soontao_cds-rate-limit&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=Soontao_cds-rate-limit)

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
  - remote_ip
  - user_id
  - tenant
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

### Example - Memory

```js
// configuration global default configuration
// each user could call API 6000 times in 1 minute duration
applyRateLimit(cds, { 
  impl: "memory", 
  duration: 60, 
  points: 6000, 
  keyParts: ['user_id'] 
})
```

### Example - Redis

```js
const Redis = require("ioredis")
const storeClient = new Redis({ enableOfflineQueue: false });
// configuration global default configuration with redis
// each user in each tenant could use the API 300 times in 5 seconds duration
applyRateLimit(cds, { 
  impl: "redis", 
  storeClient, 
  duration: 5, 
  points: 300, 
  keyParts: ['tenant', 'user_id'] 
})
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

- [ ] How to process anonymous requests
- [ ] Documents for microservice
- [ ] Performance

## [CHANGELOG](./CHANGELOG.md)

## [LICENSE](./LICENSE)
