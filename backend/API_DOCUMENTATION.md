# Ibis Physics Portal - Enterprise API Documentation

## 1. Overview
This documentation describes the modernized Express backend API for the Ibis Physics Portal. It is generated directly from the implementation state (`backend/src`) and represents the verified, strict API contracts.

### Global Contracts
**Response Envelope**:
All endpoints (except where explicitly noted) wrap successful and failed responses in a standardized envelope:
```json
{
  "success": true,
  "data": { ... payload ... },
  "meta": {
    "requestId": "req-171836...",
    "timestamp": "2026-06-29T12:00:00.000Z"
  }
}
```

**Standard Error Responses**:
Handled centrally by `errorHandler.js`.
* `400 Bad Request`: Zod validation failure (`VALIDATION_ERROR`). Occurs post-authorization.
* `401 Unauthorized`: Missing, invalid, expired, or revoked JWT (`UNAUTHORIZED` or `TOKEN_EXPIRED`).
* `403 Forbidden`: RBAC role violation (`FORBIDDEN`).
* `405 Method Not Allowed`: HTTP method blocked by route configuration.
* `429 Too Many Requests`: IP-based or User-based rate limit exceeded (`RATE_LIMITED` or `TOTP_LOCKED`).
* `500 Internal Server Error`: Unhandled server exception (`INTERNAL_ERROR`). Stack traces suppressed in production.

---

## 2. API Endpoints

### 2.1 Health Check
* **Purpose**: Infrastructure availability verification.
* **HTTP Method**: `GET`
* **URL**: `/api/health`
* **Namespace**: Core
* **Route File**: `backend/src/routes/index.js`
* **Controller**: Inline
* **Authentication Required**: No
* **Authorization Required**: No
* **Rate Limit**: None
* **Request Body**: None
* **Response Body**:
```json
{
  "status": "ok",
  "message": "API is running"
}
```
* **Success Status**: `200 OK`
* **Dependencies**: Express Route → Response

---

### 2.2 Login
* **Purpose**: Authenticate user and issue JWTs.
* **HTTP Method**: `POST`
* **URL**: `/api/auth/login`
* **Namespace**: Auth
* **Route File**: `backend/src/routes/auth.routes.js`
* **Controller**: `loginController`
* **Service**: `AuthService.login`
* **Authentication Required**: No
* **Authorization Required**: No
* **Rate Limit**: 10 requests / 60 seconds (IP-based)
* **Request Body** (Strict Mode):
  * `email` (String): Required. Sanitized, lowercase, trimmed, max 255 chars.
  * `password` (String): Required. Min length 1.
* **Response Body**:
```json
{
  "access_token": "eyJhbG..."
}
```
* **Response Headers**: `Set-Cookie: refresh_token=...; HttpOnly; SameSite=Strict`
* **Success Status**: `200 OK`
* **Dependencies**: Route → Zod → Rate Limit → Controller → AuthService → UserRepository / PaymentRepository → Supabase
* **Legacy Mapping**: Replaces direct frontend-to-Supabase authentication flow.

---

### 2.3 Refresh Token
* **Purpose**: Issue new access token using HttpOnly refresh cookie.
* **HTTP Method**: `POST`
* **URL**: `/api/auth/refresh`
* **Namespace**: Auth
* **Route File**: `backend/src/routes/auth.routes.js`
* **Controller**: `refreshController`
* **Service**: `AuthService.refresh`
* **Authentication Required**: No (Evaluates `refresh_token` cookie internally)
* **Authorization Required**: No
* **Rate Limit**: 20 requests / 60 seconds (IP-based)
* **Request Headers**: `Cookie: refresh_token=...`
* **Response Body**:
```json
{
  "access_token": "eyJhbG..."
}
```
* **Response Headers**: `Set-Cookie: refresh_token=...; HttpOnly; SameSite=Strict`
* **Success Status**: `200 OK`
* **Dependencies**: Route → Rate Limit → Controller → AuthService → Redis (Revocation) → UserRepository → Supabase

---

### 2.4 Logout
* **Purpose**: Invalidate current session.
* **HTTP Method**: `POST`
* **URL**: `/api/auth/logout`
* **Namespace**: Auth
* **Route File**: `backend/src/routes/auth.routes.js`
* **Controller**: `logoutController`
* **Service**: `AuthService.logout`
* **Authentication Required**: Yes (Bearer Token)
* **Authorization Required**: No
* **Rate Limit**: None
* **Request Headers**: `Authorization: Bearer <token>`
* **Response Body**:
```json
{
  "message": "Logged out successfully"
}
```
* **Response Headers**: Clears `refresh_token` cookie.
* **Success Status**: `200 OK`
* **Dependencies**: Route → Auth (JWT) → Controller → AuthService → Redis (Blacklist JTI)

---

### 2.5 Delete User Account
* **Purpose**: Permanently delete user data and revoke sessions.
* **HTTP Method**: `DELETE`
* **URL**: `/api/user/delete`
* **Namespace**: User
* **Route File**: `backend/src/routes/user.routes.js`
* **Controller**: `deleteUserAccount`
* **Validation Schema**: `userDeleteSchema`
* **Authentication Required**: Yes
* **Authorization Required**: Yes (Roles: `['student', 'admin']`)
* **Rate Limit**: 3 requests / 60 seconds (User-based & IP-based upstream)
* **Request Body** (Strict Mode):
  * `confirmPhrase` (String): Required. Must exactly equal `"DELETE MY ACCOUNT"`.
* **Response Body**:
```json
{
  "status": "deleted"
}
```
* **Success Status**: `200 OK`
* **Dependencies**: Route → IP Rate Limit → Auth (JWT) → User Rate Limit → RBAC → Zod → Controller → Redis → Supabase Admin API

---

### 2.6 Fetch Media Link
* **Purpose**: Retrieve signed URL for secure media access.
* **HTTP Method**: `ALL` (Accepts GET, POST, etc., to preserve legacy behavior)
* **URL**: `/api/content/media`
* **Namespace**: Content
* **Route File**: `backend/src/routes/content.routes.js`
* **Controller**: `getMedia`
* **Service**: `MediaService.getSecureMediaLink`
* **Validation Schema**: `mediaRequestSchema`
* **Authentication Required**: Yes
* **Authorization Required**: Yes (Verified programmatically in `SubscriptionService`)
* **Rate Limit**: 30 requests / 60 seconds (User-based & IP-based upstream)
* **Request Body/Query** (Strict Mode):
  * `media_id` (UUID): Required.
* **Response Body**: Dynamic payload containing signed URL metadata.
* **Success Status**: `200 OK`
* **Dependencies**: Route → IP Rate Limit → Auth (JWT) → User Rate Limit → Zod → Controller → MediaService / SubscriptionService → Supabase Storage
* **Legacy Mapping**: Migrated from Vercel Serverless `/api/content/media.js`.

---

### 2.7 Fetch Video Metadata
* **Purpose**: Retrieve video details for a specific topic.
* **HTTP Method**: `ALL`
* **URL**: `/api/content/video`
* **Namespace**: Content
* **Route File**: `backend/src/routes/content.routes.js`
* **Controller**: `getVideo`
* **Service**: `VideoService.getVideoMetadata`
* **Validation Schema**: `videoRequestSchema`
* **Authentication Required**: Yes
* **Authorization Required**: Yes (Verified programmatically in `SubscriptionService`)
* **Rate Limit**: 45 requests / 60 seconds (User-based & IP-based upstream)
* **Request Body/Query** (Strict Mode):
  * `topic_id` (UUID): Required.
* **Response Body**: Dynamic payload containing video metadata.
* **Success Status**: `200 OK`
* **Dependencies**: Route → IP Rate Limit → Auth (JWT) → User Rate Limit → Zod → Controller → VideoService / SubscriptionService → ContentRepository → Supabase
* **Legacy Mapping**: Migrated from Vercel Serverless `/api/content/video.js`.
