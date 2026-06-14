# CloudCart Production Checklist

## Environment
- [ ] All `.env` files contain strong, unique secrets (min 64 chars for JWT)
- [ ] `NODE_ENV=production` on all services
- [ ] `BCRYPT_ROUNDS=12` (increase to 14 for extra security, slower)
- [ ] `PAYMENT_SUCCESS_RATE` removed (real gateway used)

## Security
- [ ] `secure: true` on cookies (HTTPS enforced)
- [ ] `sameSite: 'strict'` on cookies (CSRF protection)
- [ ] Helmet CSP headers tightened for production domain
- [ ] CORS_ORIGIN set to exact production frontend URL
- [ ] MongoDB connection uses TLS (`mongodb+srv://`)
- [ ] Redis connection uses TLS (`rediss://`)
- [ ] Services only reachable from gateway's internal network
- [ ] Rate limit store uses Redis (not memory)

## MongoDB
- [ ] All indexes created (run `db.collection.getIndexes()` to verify)
- [ ] Backups configured (MongoDB Atlas or mongodump cron)
- [ ] Connection pool size tuned (`maxPoolSize: 10`)
- [ ] Slow query logging enabled

## Redis
- [ ] `maxmemory-policy allkeys-lru` configured
- [ ] Persistence configured (RDB or AOF)
- [ ] TTLs verified on all cache keys

## Frontend
- [ ] `pnpm build` produces optimised bundle
- [ ] Environment variables set for production API URL
- [ ] Source maps disabled or secured
- [ ] CDN configured for static assets
