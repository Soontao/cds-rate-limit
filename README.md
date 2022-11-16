# CDS Rate Limit

> apply `rate limit` pattern to CAP nodejs application

[![npm](https://img.shields.io/npm/v/cds-rate-limit)](https://www.npmjs.com/package/cds-rate-limit)
[![node-test](https://github.com/Soontao/cds-rate-limit/actions/workflows/nodejs.yml/badge.svg)](https://github.com/Soontao/cds-rate-limit/actions/workflows/nodejs.yml)
[![codecov](https://codecov.io/gh/Soontao/cds-rate-limit/branch/main/graph/badge.svg?token=xzBkWloYNR)](https://codecov.io/gh/Soontao/cds-rate-limit)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Soontao_cds-rate-limit&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Soontao_cds-rate-limit)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=Soontao_cds-rate-limit&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=Soontao_cds-rate-limit)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=Soontao_cds-rate-limit&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=Soontao_cds-rate-limit)

## Get Started

`package.json`

```json
{
  "cds": {
    "plugins": ["cds-rate-limit"]
  }
}
```

`cds definition`

```groovy
using {cuid, managed} from '@sap/cds/common';
@path : '/sample3'
service Sample3Service {

  // define rate limit for entity CRUD events and actions
  // accepts 1000 requests in 120 seconds
  // other requests will be rejected by HTTP 429 status
  @cds.rate.limit : {
    duration : 120,
    points   : 1000,
  }
  entity People : cuid, managed {
    Name : String(255);
    Age  : Integer;
  }

  // share global quota
  entity Other: cuid, managed {
    Name : String(255);
  }
}
```

## Headers

- `Retry-After` - reset after seconds later
- `X-RateLimit-Reset` - reset timestamp (unix timestamp)
- `X-RateLimit-Limit` - total quota for each window
- `X-RateLimit-Remaining` - remaining quota for current window

## RateLimiter Hierarchy

> the `RateLimiter` configuration will apply restriction by order, if you do not annotate `@cds.rate.limit` on entity/action/function level, it will share the quota of the global `RateLimiter`

1. Event/Action/Function
2. Entity
3. Service
4. Global

## Options

- `keyParts`: use to generated the key
  - `remote_ip` - req.\_.req.ip - please ref [express document](http://expressjs.com/en/guide/behind-proxies.html) to setup `trust proxy`
  - `user_id` - ctx.user.id
  - `tenant` - ctx.tenant
- `points`: quota for each key (user, ip, tenant or combined)
- `duration`: quota for each key in duration (reset duration for quota)

### Default Global Options

**if there is no annotation on CDS Service/Entity/Action/Function, it will use the global configuration**

```js
{
  impl: "memory", // use in-memory
  keyParts: ["tenant"], // generate key from tenant
  keyPrefix: GLOBAL_RATE_LIMITER_PREFIX, // default prefix
  duration: 60, // 60 seconds
  points: 200 * 60, // 200 requests per seconds

  // for anonymous requests (without authorization header)
  anonymous: {
    // per seconds per remote ip allow 1000 requests
    keyPrefix: GLOBAL_ANONYMOUS_RATE_LIMITER_PREFIX,
    duration: 10,
    points: 10 * 100,
  },
}
```

### Example - Memory

> configuration global default configuration, each user could call API 6000 times in 1 minute duration

```json
{
  "cds": {
    "plugins": ["cds-rate-limit"],
    "config": {
      "rateLimit": {
        "impl": "memory",
        "duration": 60,
        "points": 6000,
        "keyParts": ["user_id"]
      }
    }
  }
}
```

### Example - Redis


> each user in each tenant could use the API 300 times in 5 seconds duration


```json
{
  "cds": {
    "plugins": [
      "cds-rate-limit"
    ],
    "config": {
      "rateLimit": {
        "impl": "redis",
        "duration": 5,
        "points": 300,
        "keyParts": ["tenant", "user_id"],
        "redisOptions": {
          "enableOfflineQueue": false
        }
      }
    }
  }
}
```

## Features

- [x] Global Rate Limit
- [x] Event Rate Limit
  - [x] Inner event ignore
- [x] Anonymous Request Rate Limit
- [x] Custom key
- [ ] Global Env Configuration
- [x] Redis store
- [ ] Dynamic quota configuration
- [ ] Sampling store to reduce remote store network consumption

## ToDo

- [x] How to process anonymous requests
- [ ] Documents for microservice
- [ ] Performance

## [CHANGELOG](./CHANGELOG.md)

## [LICENSE](./LICENSE)
