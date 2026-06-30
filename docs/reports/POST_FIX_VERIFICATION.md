# POST-FIX VERIFICATION AUDIT
**Target:** Ibis Physics Portal
**Auditor:** Senior Security Engineer
**Date:** 2026-06-29

---

### FIX 1 — Atomic Payment (RPC)
**Verification Status:** PARTIAL
**Regression Risk:** LOW

#### Implementation Checks:
- [x] Check 1: `SECURITY DEFINER` is set on the `process_payment` stored procedure.
- [ ] Check 2: The procedure is missing an explicit `REVOKE EXECUTE ON FUNCTION process_payment FROM PUBLIC`. In Postgres, functions are executable by `PUBLIC` by default. It must be explicitly revoked and granted only to `service_role`.
- [x] Check 3: `supabase.rpc()` is called using `getServiceSupabase()`, ensuring the `service_role` key is used.
- [x] Check 4: The webhook handler reads the raw body via `express.raw({ type: 'application/json' })` in `server.js` before `express.json()` processes it.
- [x] Check 5: The webhook returns a serialized HTTP 200 via the `status: 'duplicate'` mapping, preventing Razorpay retries.
- [x] Check 6: Idempotency `INSERT ... ON CONFLICT DO NOTHING` is executed securely inside the `BEGIN ... COMMIT` block.

#### Second-Order Risks:
- Without `REVOKE EXECUTE FROM PUBLIC`, if an attacker somehow gains execution context via PostgREST (even authenticated), they might attempt to execute this RPC and force an idempotency collision or upgrade themselves. 

#### Verdict: NEEDS ADJUSTMENT

---

### FIX 2 — IDOR (Redis Key Binding)
**Verification Status:** PARTIAL
**Regression Risk:** HIGH

#### Implementation Checks:
- [x] Check 1: Redis key is perfectly namespaced as `shuffle:${userId}:${attemptId}` in both write (`startAttempt`) and read (`submitAttempt`).
- [x] Check 2: `redis.del` is successfully called post-grading to prevent memory leaks.
- [x] Check 3: The 403 error on key-not-found uses a uniform message: "Attempt not found or does not belong to you", preventing enumeration.
- [x] Check 4: `userId` is supplied by the controller extracting `req.user.sub` from the verified JWT, neutralizing client payload manipulation.
- [ ] Check 5: There is no DB-level re-submission guard checking `attempt.submitted_at IS NOT NULL`. It relies purely on the Redis key deletion. If a user submits concurrently (race condition), both requests might read the Redis key before it's deleted. 

#### Second-Order Risks:
- Race conditions on `submitAttempt`. An attacker firing 5 concurrent requests might grade the same attempt 5 times before the `redis.del` propagates, potentially manipulating `payment_history` or metrics if not clamped.

#### Verdict: NEEDS ADJUSTMENT

---

### FIX 3a — Sentry PII (beforeSend)
**Verification Status:** PARTIAL
**Regression Risk:** LOW

#### Implementation Checks:
- [x] Check 1: `sendDefaultPii: false` is set in `Sentry.init()`.
- [ ] Check 2: The `beforeSend` hook does not currently scrub `event.request.cookies`.
- [ ] Check 3: `tracesSampleRate` was left at `1.0` (100%), capturing entirely too much surface area. It must be dropped to `0.2` or lower.
- [ ] Check 4: Server-side Data Scrubbing must be verified via the Sentry Dashboard (Manual Check).
- [x] Check 5: Sentry DSN is safely injected via `VITE_SENTRY_DSN`.

#### Second-Order Risks:
- High sampling rate combined with un-scrubbed cookies creates a severe DPDP non-compliance risk if session tokens leak into Sentry.

#### Verdict: NEEDS ADJUSTMENT

---

### FIX 3b — DPDP Deletion Route
**Verification Status:** CONFIRMED
**Regression Risk:** NONE

#### Implementation Checks:
- [x] Check 1: Requires `confirmPhrase: 'DELETE MY ACCOUNT'` via strict Zod validation.
- [x] Check 2: Route is guarded by `requireAuth: true`.
- [x] Check 3: `ON DELETE CASCADE` is properly configured on `profiles` (linked to `auth.users`), destroying all nested data seamlessly.
- [x] Check 4: `deletion_log` receives a one-way SHA-256 hash of the `userId`.
- [x] Check 5: Redis keys (revocations and attempt shuffles) are cleared prior to DB deletion.
- [x] Check 6: The active JWT `jti` is pushed to the `revoked:${user.jti}` denylist, destroying the session instantly.

#### Second-Order Risks:
- None identified. Highly compliant DPDP Right to Erasure implementation.

#### Verdict: SOLID

---

### FIX 4 — TOTP Lockout
**Verification Status:** PARTIAL
**Regression Risk:** MEDIUM

#### Implementation Checks:
- [ ] Check 1: Denylist TTL is hardcoded to `3600` instead of calculating remaining token expiry (`decoded.exp - Date.now()`). This could waste Redis memory if the token naturally expires sooner.
- [x] Check 2: JWT verification denylist check happens flawlessly at Step 3 of the `withHandler` pipeline.
- [x] Check 3: The key pattern `revoked:${jti}` matches perfectly between the lockout logic and the JWT validator.
- [ ] Check 4: Event is logged via `console.error` rather than a persistent security datastore.
- [ ] Check 5: No automated email notification is dispatched to the admin upon lockout, creating a silent DoS vector.

#### Second-Order Risks:
- An attacker knowing an admin's identifier can intentionally spam the TOTP endpoint with invalid codes, triggering the lockout and silently locking the legitimate admin out of the system.

#### Verdict: NEEDS ADJUSTMENT

---

### FIX 5 — Bcrypt Cost Factor
**Verification Status:** FAILED
**Regression Risk:** NONE

#### Implementation Checks:
- [ ] Check 1: Dashboard change to Cost 12 (Manual Verification Required).
- [ ] Check 2: The codebase lacks a mechanism to automatically re-hash existing users from cost 10 to cost 12 upon their next successful login.

#### Verdict: REVERT AND REDO

---

### FIX 6 — Webhook Rate Limit Bypass
**Verification Status:** FAILED
**Regression Risk:** HIGH

#### Implementation Checks:
- [x] Check 1: `INTERNAL_WEBHOOK_SECRET` is safely isolated as a backend-only environment variable.
- [x] Check 2: Secret length constraint (`>= 32`) is enforced.
- [ ] Check 3: The bypass is injected globally inside `withHandler`. Anyone discovering the secret can bypass rate limits on *any* route, not just the webhook.
- [ ] Check 4: The secret is compared using standard string equality (`===`) instead of `crypto.timingSafeEqual()`, opening the bypass to timing attacks.

#### Second-Order Risks:
- Standard string comparison on a secret bypass mechanism completely undermines the API's DoS protection.

#### Verdict: REVERT AND REDO

---

## POST-FIX AUDIT SUMMARY

### Regression Check
- **Vulnerabilities Introduced:** Yes. The Webhook Rate Limit Bypass (Fix 6) introduced a timing attack vector and a global rate limit bypass.
- **Breakages:** None detected. 

### Remaining Gaps
- `REVOKE EXECUTE ON FUNCTION` missing from the payment RPC.
- DB-level test submission locking missing (race condition).
- Sentry trace sampling rate is too high and cookies are not scrubbed.
- Admin DoS via TOTP lockout requires alerting.
- Bcrypt re-hashing logic missing.
- Rate limit bypass uses `===` and is applied globally.

### Production Readiness Verdict
**NOT READY** — Critical timing attacks and race conditions remain.

### Ordered Action List:
1. Re-implement Fix 6 using `crypto.timingSafeEqual()` and restrict it explicitly to the webhook route.
2. Add a `BEGIN...FOR UPDATE` lock or a `submitted_at` check in `TestEngineService` to prevent concurrent grading race conditions.
3. Update the SQL migration for Fix 1 to include `REVOKE EXECUTE ON FUNCTION process_payment FROM PUBLIC`.
4. Lower Sentry `tracesSampleRate` to `0.2` and scrub cookies in `main.jsx`.
5. Implement email notifications for the TOTP lockout logic to mitigate DoS vectors.
