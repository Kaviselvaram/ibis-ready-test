# Environment Variables Audit & Readiness

All sensitive secrets have been audited and moved out of the frontend bundle. No `VITE_` prefix is used for sensitive logic. The frontend relies exclusively on the backend for entitlement and state via HttpOnly cookies and short-lived JWTs.

## Backend (.env.local)
- `PORT` (e.g. 3000)
- `NODE_ENV` (development/production)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `JWT_SECRET` (Must be strictly 32+ chars)
- `TOTP_MASTER_KEY` (Must be exactly 32 chars)
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `RAZORPAY_WEBHOOK_SECRET`

## Frontend (.env)
- `VITE_SENTRY_DSN` (Safe for client-side injection)
- `VITE_API_URL` (Points to the Node.js backend)
