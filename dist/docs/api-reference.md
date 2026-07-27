# nxClip API Reference

> **Generated from implemented codebase.** Use the **production** gateway URL for deployed GCP testing, or **local** ports when running services on your machine.
>
> | Environment | API Gateway (public entry point) |
> |-------------|----------------------------------|
> | **Production (GCP Cloud Run)** | `https://api-gateway-216098834386.us-central1.run.app` |
> | **Local development** | `http://localhost:5000` |
>
> Via the API Gateway, prepend the base URL above for public routes listed in the [Gateway routing](#api-gateway) section. On GCP, call **only** through the gateway URL — do not use backend `*.run.app` URLs from a browser or SPA.

**Production example (register):**

```bash
curl -s -X POST 'https://api-gateway-216098834386.us-central1.run.app/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","username":"johndoe","displayName":"John Doe","password":"Password123!"}'
```
### Port Netstat
netstat -ano | findstr ":5000 :5002 :5004"
taskkill /PID 19248 /F

### Authentication legend

| Symbol | Meaning |
|--------|---------|
| **Public** | No authentication |
| **JWT** | `Authorization: Bearer <token>` or cookie `nx_access_token` |
| **Internal** | Header `X-Internal-API-Key: <secret>` |

### Common error shapes

**NestJS services** (validation failure):

```json
{
  "statusCode": 400,
  "message": ["field error messages"],
  "error": "Bad Request"
}
```

**API Gateway** (`GatewayExceptionFilter`):

```json
{
  "statusCode": 401,
  "message": "Authentication required",
  "correlationId": "uuid",
  "path": "/content/generate",
  "timestamp": "2026-06-11T12:00:00.000Z"
}
```

**Identity / Analytics** (domain errors):

```json
{
  "statusCode": 409,
  "message": "Email already registered",
  "code": "EMAIL_EXISTS"
}
```

---

## API Gateway

| Environment | Base URL | Swagger / docs |
|-------------|----------|----------------|
| **Production (GCP)** | `https://api-gateway-216098834386.us-central1.run.app` | `https://api-gateway-216098834386.us-central1.run.app/docs` |
| **Local** | `http://localhost:5000` | `http://localhost:5000/docs` |

The gateway proxies public traffic; it does not implement business APIs except health.

### Gateway routing

| Prefix | Upstream service |
|--------|------------------|
| `/auth`, `/users`, `/billing` | identity-service (`5001`) |
| `/content` | content-service (`5002`) |
| `/feed` | feed-service (`5003`) |
| `/coach` | ai-service (`5004`) |
| `/analytics` | analytics-service (`5005`) |
| `/notifications` | notification-service (`5006`) |

**Blocked at gateway:** `/internal/*` → `403`, `/docs/*` on gateway (service Swagger is on each service port).

### `GET /health`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Public |
| **Response** | `{ "status": "ok", "service": "api-gateway" }` |

**Production:** `GET https://api-gateway-216098834386.us-central1.run.app/health`

### `GET /health/live`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Public |
| **Response** | `{ "status": "live" }` |

### `GET /health/ready`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Public |
| **Response** | `{ "status": "ready" }` |

### Gateway-only errors

| Code | Condition |
|------|-----------|
| `401` | Missing or invalid JWT on protected route |
| `403` | Path starts with `/internal` |
| `404` | No matching route prefix |
| `429` | Throttler limit exceeded (100 req/min default) |
| `502` | Upstream unavailable |

**JWT public routes (no token):** `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/verify-email`; `GET /auth/check-email`, `/auth/check-username`; `GET /auth/dev/verification-token` (Development only); `POST /billing/webhook`.

---

## Identity Service

**Base URL (local direct):** `http://localhost:5001`  
**Production (via gateway):** `https://api-gateway-216098834386.us-central1.run.app` — prefixes `/auth`, `/users`

Frontends should call auth and user APIs through the gateway URLs above. Identity Swagger (`http://localhost:5001/docs`) is useful for direct **local** testing only. `/internal/*` routes are **not** proxied by the gateway; call them on the service port with `X-Internal-API-Key` (env `INTERNAL_API_KEY`, default `dev-internal-api-key-change-me`).

---

### `POST /auth/register`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Public |
| **Response** | `201` — `AuthResponseDto` |

**Request body:**

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "displayName": "John Doe",
  "password": "securepass"
}
```

**Response body:**

```json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "username": "string",
    "displayName": "string",
    "plan": "FREE",
    "emailVerified": false,
    "roles": ["string"],
    "createdAt": "datetime"
  },
  "accessToken": "jwt",
  "refreshToken": "string"
}
```

**Validation (FluentValidation):**

| Field | Rules |
|-------|-------|
| `email` | Required, valid email, max 255 |
| `username` | Required, 3–64 chars, `^[a-zA-Z0-9_]+$` |
| `displayName` | Required, max 100 |
| `password` | Required, 8–128 chars |

**Error codes:**

| Code | HTTP | `code` field |
|------|------|--------------|
| Validation failure | `400` | — |
| Email taken | `409` | `EMAIL_EXISTS` |
| Username taken | `409` | `USERNAME_EXISTS` |

Sets HTTP-only auth cookies in development/production per `CookieAuthService`.

**Side effect:** Creates an email verification token. When SMTP is enabled, sends a verification link to `{FRONTEND_URL}/verify-email?token=...`. When SMTP is disabled, stores the token in memory for the [dev fallback endpoint](#get-authdevverification-token). New users have `emailVerified: false` until verification succeeds.

---

### `POST /auth/login`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Public |
| **Response** | `200` — `AuthResponseDto` |

**Request body:**

```json
{
  "email": "user@example.com",
  "password": "string"
}
```

**Validation:**

| Field | Rules |
|-------|-------|
| `email` | Required, valid email |
| `password` | Required |

**Error codes:**

| Code | HTTP | `code` |
|------|------|--------|
| Validation failure | `400` | — |
| Bad credentials | `401` | `INVALID_CREDENTIALS` |
| Account disabled | `403` | `ACCOUNT_DISABLED` |

---

### `POST /auth/refresh`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Public |
| **Response** | `200` — `TokenResponseDto` |

**Request body:**

```json
{
  "refreshToken": "string"
}
```

Refresh token may be omitted if sent via `nx_refresh_token` cookie.

**Validation:** `refreshToken` required (from body or cookie).

**Response:**

```json
{
  "accessToken": "jwt",
  "refreshToken": "string"
}
```

**Error codes:**

| Code | HTTP | `code` |
|------|------|--------|
| Invalid refresh token | `401` | `INVALID_REFRESH_TOKEN` |

---

### `POST /auth/logout`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | JWT |
| **Response** | `204` No content |

Revokes refresh token and clears auth cookies.

---

### `GET /auth/me`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | JWT |
| **Response** | `200` — `UserDto` |

Returns the authenticated profile, including onboarding state after Creator Coach completes.

**Example response:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "creator1",
  "displayName": "Creator One",
  "plan": "FREE",
  "emailVerified": true,
  "roles": ["Creator"],
  "createdAt": "2026-07-10T12:00:00.000Z",
  "onboardingCompleted": true,
  "onboardingPlan": {
    "introMessage": "Your first week is ready!",
    "days": [],
    "recommendedHashtags": ["#nxclip"]
  }
}
```

| Field | Notes |
|-------|------|
| `onboardingCompleted` | `false` until Coach `generate-plan` persists; use to gate onboarding vs dashboard |
| `onboardingPlan` | JSON object saved to `users.onboarding_plan`, or `null` if not completed |

Same shape from `GET /users/me`. Written by Coach via internal `PATCH /internal/users/{id}/coach-plan`.

**Error codes:** `401` if unauthenticated.

---

### `GET /auth/check-email`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Public |
| **Query** | `email` (string, required) |
| **Response** | `200` — `{ "available": boolean }` |

**Semantics:** `available: true` means the email is **not** registered and can be used for signup. `available: false` means the email is already taken (expected after a successful register).

**Example:** `GET /auth/check-email?email=user@example.com`

---

### `GET /auth/check-username`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Public |
| **Query** | `username` (string, required) |
| **Response** | `200` — `{ "available": boolean }` |

**Semantics:** `available: true` means the username is **not** taken. `available: false` means the username is already registered.

**Example:** `GET /auth/check-username?username=johndoe`

---

### `POST /auth/verify-email`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | Public |
| **Response** | `204 No Content` |

Confirms the user's email using the token from the verification email (or dev fallback). On success, sets `emailVerified: true` on the user account.

**Request body:**

```json
{
  "token": "verification-token"
}
```

**Validation:** `token` required.

**Typical flow:**

1. `POST /auth/register` — user created with `emailVerified: false`; token issued.
2. User opens link from email (`{FRONTEND_URL}/verify-email?token=...`) or obtains token via [`GET /auth/dev/verification-token`](#get-authdevverification-token) in Development.
3. Frontend calls `POST /auth/verify-email` with the token.
4. Subsequent `GET /users/me` or `GET /auth/me` returns `emailVerified: true`.

**Error codes:**

| Code | HTTP | `code` |
|------|------|--------|
| Validation failure | `400` | — |
| Invalid or expired token | `401` | `INVALID_VERIFICATION_TOKEN` |

---

### `GET /auth/dev/verification-token`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Public |
| **Query** | `email` (string, required) |
| **Response** | `200` — `DevVerificationTokenDto` |
| **Availability** | **Development only** (`ASPNETCORE_ENVIRONMENT=Development`). Returns `404` in other environments. |

Development helper when SMTP is disabled or you need the token without checking an inbox. Returns the most recent verification token stored for the given email after register.

**Example:** `GET /auth/dev/verification-token?email=user@example.com`

**Response body:**

```json
{
  "email": "user@example.com",
  "token": "verification-token",
  "expiresAt": "2026-06-18T12:00:00.000Z",
  "verifyUrl": "http://localhost:3000/verify-email?token=verification-token"
}
```

**Error codes:**

| Code | HTTP | Condition |
|------|------|-----------|
| `400` | Missing or empty `email` query parameter |
| `404` | Non-Development environment, or no active token for this email (register again) |

Proxied by the gateway only in Development (same `404` behavior upstream).

---

### Email verification configuration

Configured in `apps/identity-service/.env` (see also root `.env`):

| Variable | Purpose |
|----------|---------|
| `SMTP_ENABLED` | `true` to send real email; `false` to skip SMTP and rely on dev token store |
| `SMTP_HOST` | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | e.g. `587` |
| `SMTP_USE_TLS` | `true` for STARTTLS |
| `SMTP_USERNAME` | SMTP account |
| `SMTP_PASSWORD` | SMTP password (Gmail: [App Password](https://myaccount.google.com/apppasswords)) |
| `SMTP_FROM_EMAIL` | From address |
| `SMTP_FROM_NAME` | Display name (default `nxClip`) |
| `FRONTEND_URL` | Base URL for verification links in email (default `http://localhost:3000`) |

When `SMTP_ENABLED=false`, register still creates a token; use `GET /auth/dev/verification-token` locally to complete the flow.

---

### `GET /users/me`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | JWT |
| **Response** | `200` — `UserDto` (same shape as [`GET /auth/me`](#get-authme), including `onboardingCompleted` / `onboardingPlan`) |

---

### `PATCH /users/me`

| | |
|---|---|
| **Method** | `PATCH` |
| **Auth** | JWT |
| **Response** | `200` — `UserDto` |

**Request body** (all optional):

```json
{
  "displayName": "string",
  "bio": "string",
  "avatarUrl": "string"
}
```

**Validation:**

| Field | Rules |
|-------|-------|
| `displayName` | Max 100 when provided |
| `bio` | Max 200 when provided |
| `avatarUrl` | Max 500 when provided |

---

### `GET /users/{id}`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Public |
| **Path** | `id` — UUID |
| **Response** | `200` — `UserDto` |

**Error codes:** `404` — `USER_NOT_FOUND`

---

### `GET /internal/users/{userId}`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Internal |
| **Path** | `userId` — UUID |
| **Response** | `200` — `UserDto` |

**Error codes:**

| Code | HTTP |
|------|------|
| Invalid API key | `401` |
| User not found | `404` |

---

### Health — Identity Service

| Endpoint | Method | Auth | Response |
|----------|--------|------|----------|
| `/health` | GET | Public | `{ "status": "ok", "service": "identity-service" }` |
| `/health/live` | GET | Public | `{ "status": "live" }` |
| `/health/ready` | GET | Public | `{ "status": "ready" }` |

---

## Content Service

**Base URL (local direct):** `http://localhost:5002`  
**Production (via gateway):** `https://api-gateway-216098834386.us-central1.run.app` — prefix `/content`

There are **two entry paths** into the same publish / moderation pipeline:

| Journey | Entry | Initial status after success | Media source |
|---------|-------|------------------------------|--------------|
| **A — Image Studio** | `POST /content/generate` | `draft` (sync) | AI-generated image + captions |
| **B — Upload clip / asset** | `POST /content/upload-url` + `PUT` file | `draft` | User-uploaded bytes |

Both end the same way: `POST /content/{id}/publish` → `publishing` → WebSocket moderation → `published`.

---

### Journey A — Image Studio (generate → published)

End-to-end flow for `/create/image`-style UX (AI image / meme generation). Generation runs **inline** (HTTP waits for AI). Prefer the generate response for UI; WebSocket is for library refresh / failure.

#### Which content APIs are required?

| API | Required for Image Studio create/publish happy path? | When you still need it |
|-----|------------------------------------------------------|------------------------|
| `POST /content/generate` | **Yes** | Create the image + captions + hashtagSets |
| `POST /content/{id}/publish` | **Yes** | Submit for moderation → feed |
| `GET /content/{id}/media` | **Yes** (to display the image) | `cdnUrl` points here — JWT/cookie required (GCS is private) |
| `POST /content/{id}/retry-generation` | Only on failure | `generation_failed` |
| `PATCH /content/{id}` | Only on moderation reject | Edit title/description then re-publish |
| `GET /content/mine` | **Not for create flow** | “My content” library / status polling |
| `GET /content/mine/{id}` | **Not for create flow** | Detail of an owned draft/publishing item |
| `GET /content` | **No** | Public catalog of **published** items (discovery; feed is primary for the feed UI) |
| `GET /content/{id}` | **No** for create; **yes** after live | Public published detail (share / SEO); `404` until `published` |
| `DELETE /content/{id}` | **No** | Soft-delete from library |
| `POST /content/upload-url` | **No** | Journey B (user upload), not AI Image Studio |

**Minimum Image Studio journey:** `generate` → (render via `/content/{id}/media`) → `publish` → await `content:moderation_complete`. List/Get/Edit/Delete remain product APIs for library, reject recovery, and published detail — not blockers for a successful generate→publish.

```mermaid
sequenceDiagram
  participant App
  participant Gateway
  participant Content as content-service
  participant GCS as GCS bucket
  participant AI as ai-service
  participant WS as notification-service

  App->>Gateway: POST /content/generate { prompt, style }
  Gateway->>Content: proxy JWT
  Content->>AI: POST /internal/queue/generate-image (inline)
  AI-->>Content: storageKey, image bytes, captions[3], hashtagSets[3]
  Content->>GCS: putObject(storageKey)
  Content-->>App: contentId, cdnUrl=/content/{id}/media, captions, hashtagSets
  Note over App: Status = draft. Pick caption + hashtag set (local state only)
  App->>Gateway: GET /content/{id}/media (JWT / cookie)
  Gateway->>Content: authz (owner)
  Content->>GCS: signed GET URL
  Content-->>App: 302 → short-lived signed URL
  App->>Gateway: POST /content/{contentId}/publish { title, caption, hashtags }
  Gateway->>Content: proxy
  Content-->>App: message, contentId, status publishing
  Content->>AI: enqueue moderation
  WS-->>App: content:moderation_complete { contentId, status }
  Note over App: approved → wait until status published; rejected → PATCH then re-publish
```

#### Steps

| Step | API / action | Request | Success response / outcome |
|------|--------------|---------|----------------------------|
| 1 | `POST /content/generate` | `{ prompt, style?, aspectRatio? }` | `{ contentId, cdnUrl, thumbnailUrl, captions[3], hashtagSets[3], watermarked }` — status **`draft`**. `cdnUrl` is the **authenticated media route** (not a permanent public GCS URL) |
| 2 | `GET /content/{contentId}/media` | JWT Bearer or gateway cookie | `302` to short-lived GCS signed URL (or local stream). Use as `<img src>` with cookie, or fetch+blob with Bearer |
| 3 | Client UI only | — | User selects one caption + one hashtag bundle (no API) |
| 4 | `POST /content/{contentId}/publish` | `{ title?, caption?, hashtags?, description? }` | `{ message, contentId, jobId?, status: "publishing" }` |
| 5 | WebSocket `content:moderation_complete` | — | `status: "approved"` or `"rejected"` |
| 6a | On approve | — | Content stays **`publishing`** until feed projection succeeds → **`published`**. Then `GET /content/{id}` / feed / media for any signed-in user |
| 6b | On reject | `PATCH /content/{id}` then re-publish | Status → **`moderation_rejected`** → **`draft`** after PATCH |

#### Status machine (Image Studio)

```text
[*] --generate--> processing --inline success--> draft --publish--> publishing --feed OK--> published
                      |                              |
                      +--fail--> generation_failed    +--moderation reject--> moderation_rejected --PATCH--> draft
                                 |                                              |
                                 +--retry-generation--> processing -------------+
```

#### Failure / retry

| Situation | API | Notes |
|-----------|-----|-------|
| Generate HTTP error / provider failure | — | Content may remain `processing` or move to `generation_failed` |
| `generation_failed` | `POST /content/{id}/retry-generation` | Same Image Studio response shape as generate |
| Plan limit | — | `403` with `required_plan: "pro"`, `upgrade_url`, `current`, `limit` (daily generate limit **10** on FREE) |

#### Example — generate then publish

```http
POST /content/generate
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "prompt": "A sunset over mountains",
  "style": "cinematic",
  "aspectRatio": "16:9"
}
```

```http
POST /content/{contentId}/publish
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "title": "Mountain Sunset",
  "caption": "Selected caption from the three options",
  "hashtags": ["#NxClip", "#AIArt", "#Creator"]
}
```

Optional while waiting: `GET /content/mine` or `GET /content/mine/{contentId}` (library / status; includes media URL fields + captions). Not required to complete generate→publish.

---

### Journey B — Upload clip / asset (upload → published)

End-to-end flow for user-uploaded images or video clips. Content is created in **`draft`** at upload-url time; binary is written to storage with a separate `PUT`.

```mermaid
sequenceDiagram
  participant App
  participant Gateway
  participant Content as content-service
  participant Storage
  participant AI as ai-service
  participant WS as notification-service

  App->>Gateway: POST /content/upload-url { fileName, mimeType, fileSize }
  Gateway->>Content: proxy JWT
  Content-->>App: uploadUrl, contentId, assetId, expiresIn
  Note over App: Status = draft (storageKey reserved)
  App->>Storage: PUT uploadUrl (raw file bytes)
  Note over App: No "upload complete" API
  App->>Gateway: POST /content/{contentId}/publish { title, caption?, hashtags? }
  Gateway->>Content: proxy
  Content-->>App: message, contentId, status publishing
  Content->>AI: enqueue moderation
  opt contentType = clip
    Content->>AI: enqueue transcription
  end
  WS-->>App: content:moderation_complete { contentId, status }
  Note over App: approved → published after feed projection; rejected → PATCH then re-publish
```

#### Steps

| Step | API / action | Request | Success response / outcome |
|------|--------------|---------|----------------------------|
| 1 | `POST /content/upload-url` | `{ fileName, mimeType, fileSize }` (or aliases `filename`, `contentType`, `fileSizeBytes`) | `{ uploadUrl, contentId, assetId, expiresIn }` — status **`draft`**, `contentType` from MIME (`image` / `clip`) |
| 2 | `PUT {uploadUrl}` | Raw file body; `Content-Type` = mime type | Local: content-service `/storage/upload/...`. **GCP:** V4 signed GCS `PUT` to `gs://nxclip-media-prod/...` |
| 3 | `POST /content/{contentId}/publish` | `{ title?, caption?, hashtags?, description? }` | `{ message, contentId, jobId?, status: "publishing" }` |
| 4 | WebSocket `content:moderation_complete` | — | `approved` / `rejected` |
| 5a | On approve | — | **`publishing`** → **`published`** after feed projection; clips also get transcription jobs |
| 5b | On reject | `PATCH /content/{id}` → re-publish | Same as Image Studio |

#### Status machine (upload)

```text
[*] --upload-url--> draft --PUT file--> draft --publish--> publishing --feed OK--> published
                                              |
                                              +--moderation reject--> moderation_rejected --PATCH--> draft
```

#### Plan limits / errors

| Situation | HTTP | Notes |
|-----------|------|-------|
| Daily upload limit (FREE: **20**) | `403` | `required_plan`, `upgrade_url`, `current`, `limit` |
| Publish without media | `400` | Must `PUT` to `uploadUrl` first (row already has `storageKey`, but object should exist) |
| Not owner | `403` | `Not authorised to view this content` |
| Missing content | `404` | `Content not found` |

#### Example — upload then publish

```http
POST /content/upload-url
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "fileName": "highlight.mp4",
  "mimeType": "video/mp4",
  "fileSize": 5242880
}
```

```http
PUT {uploadUrl}
Content-Type: video/mp4

<raw file bytes>
```

```http
POST /content/{contentId}/publish
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "title": "Ranked highlight",
  "caption": "Clutch round",
  "hashtags": ["#NxClip", "#Highlights"]
}
```

---

### Shared after publish (both journeys)

| Concern | Detail |
|---------|--------|
| **Moderation** | Queued to ai-service; result via internal callback → outbox → WebSocket |
| **`published` meaning** | Feed projection succeeded — not merely “user clicked publish” |
| **Library** | `GET /content/mine`, `GET /content/mine/{id}` (any non-deleted status) — Image Studio library, not create happy-path |
| **Public catalog** | `GET /content` — published-only list (discovery; feed UI prefers `/feed`) |
| **Public / published detail** | `GET /content/{id}` only when **`published`** |
| **Authenticated media** | `GET /content/{id}/media` — owner always (non-deleted); other JWT users when **published**. GCS stays private |
| **Soft delete** | `DELETE /content/{id}` → `204` |
| **Object storage** | Production: GCS bucket `nxclip-media-prod` (`STORAGE_PROVIDER=gcs`). See [AI-INTEGRATIONS.md](./AI-INTEGRATIONS.md) § GCS |
| **Related guide** | [frontend-integration-guide.md](./frontend-integration-guide.md) §§8–9 |

---

### E2E testing (Postman + Socket.IO test page)

Use the same browser WebSocket page already shipped on the gateway for Creator Coach. It now also logs content lifecycle events.

#### 0. Prerequisites

| Item | Production | Local |
|------|------------|-------|
| **Gateway base** | `https://api-gateway-216098834386.us-central1.run.app` | `http://localhost:5000` |
| **Socket.IO test page** | `https://api-gateway-216098834386.us-central1.run.app/dev/coach-ws` | `http://localhost:5000/dev/coach-ws` |
| **Source** | `apps/api-gateway/public/dev/coach-ws.html` | same |
| **JWT** | From `POST /auth/register` or `POST /auth/login` | same |

**Setup (do this before Postman content calls):**

1. In Postman, register or login via the gateway; copy `accessToken`.
2. Open **`/dev/coach-ws`** in a browser, paste the JWT, confirm **Notification service URL**, click **Connect** (status → `connected`).
3. Leave that tab open. Event log will show coach **and** content events (`content:generation_*`, `content:moderation_complete`, …).
4. In Postman collection, set:
   - `GATEWAY` = gateway base URL
   - `TOKEN` = same `accessToken`
   - Header on content requests: `Authorization: Bearer {{TOKEN}}`

---

#### A. Image Studio (generate → publish → moderation WS)

| Step | Postman | Expect |
|------|---------|--------|
| A1 | `POST {{GATEWAY}}/content/generate` body `{ "prompt": "sunset mountains", "style": "cinematic", "aspectRatio": "16:9" }` | `201` — `contentId`, `cdnUrl` (= `/content/{id}/media`), `captions[3]`, `hashtagSets[3]`, `watermarked` |
| A1b | `GET {{GATEWAY}}/content/{{CONTENT_ID}}/media` (Bearer or cookie) | `302` signed GCS URL (or `200` local stream) — confirm image loads |
| A2 | Connect `/dev/coach-ws` with same JWT (optional) | May see `content:generation_complete`; UI can rely on HTTP response only |
| A3 | Save `contentId` from A1 as `CONTENT_ID` | — |
| A4 | `POST {{GATEWAY}}/content/{{CONTENT_ID}}/publish` body `{ "title": "Mountain Sunset", "caption": "<one of captions>", "hashtags": ["#NxClip"] }` | `200`/`201` — `status: "publishing"` |
| A5 | Watch Socket.IO test page | `content:moderation_complete` with `{ contentId, status: "approved" \| "rejected" }` |
| A6 | `GET {{GATEWAY}}/content/mine/{{CONTENT_ID}}` | Library row; after approve + feed → eventually `published` |
| A6b | `GET {{GATEWAY}}/content/{{CONTENT_ID}}` | `200` only when **published**; `404` while still publishing |

**Postman body examples**

```http
POST {{GATEWAY}}/content/generate
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

{
  "prompt": "A cinematic sunset over mountains",
  "style": "cinematic",
  "aspectRatio": "16:9"
}
```

```http
POST {{GATEWAY}}/content/{{CONTENT_ID}}/publish
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

{
  "title": "Mountain Sunset",
  "caption": "Paste one caption from the generate response",
  "hashtags": ["#NxClip", "#AIArt"]
}
```

**cURL (production) — Image Studio**

```bash
GATEWAY='https://api-gateway-216098834386.us-central1.run.app'
# Open $GATEWAY/dev/coach-ws , paste TOKEN, Connect first.

TOKEN='<accessToken>'

GEN=$(curl -s -X POST "$GATEWAY/content/generate" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"prompt":"A cinematic sunset over mountains","style":"cinematic","aspectRatio":"16:9"}')
echo "$GEN" | jq .

CONTENT_ID=$(echo "$GEN" | jq -r '.contentId')
CAPTION=$(echo "$GEN" | jq -r '.captions[0]')
TAGS=$(echo "$GEN" | jq -c '.hashtagSets[0]')

curl -s -X POST "$GATEWAY/content/$CONTENT_ID/publish" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"title\":\"Mountain Sunset\",\"caption\":$(echo "$CAPTION" | jq -Rs .),\"hashtags\":$TAGS}" | jq .

# Watch /dev/coach-ws for: content:moderation_complete
```

**If generate fails (optional retry)**

```http
POST {{GATEWAY}}/content/{{CONTENT_ID}}/retry-generation
Authorization: Bearer {{TOKEN}}
```

Watch page for `content:generation_failed` (`retryable`) then retry.

---

#### B. Upload clip (upload-url → PUT → publish → moderation WS)

| Step | Postman | Expect |
|------|---------|--------|
| B1 | `POST {{GATEWAY}}/content/upload-url` body `{ "fileName": "highlight.mp4", "mimeType": "video/mp4", "fileSize": 5242880 }` | `201` — `uploadUrl`, `contentId`, `assetId`, `expiresIn` |
| B2 | Save `contentId` → `CONTENT_ID`, `uploadUrl` → `UPLOAD_URL` | Status is **`draft`** |
| B3 | `PUT {{UPLOAD_URL}}` — Body = **binary** file; header `Content-Type: video/mp4` | `201` (local storage) or storage-provider success |
| B4 | `POST {{GATEWAY}}/content/{{CONTENT_ID}}/publish` body `{ "title": "Ranked highlight", "caption": "Clutch round", "hashtags": ["#NxClip"] }` | `publishing` |
| B5 | Socket.IO test page | `content:moderation_complete`; clips may also emit `content:transcribing` / `content:transcription_complete` |
| B6 | `GET {{GATEWAY}}/content/mine/{{CONTENT_ID}}` | Track status until **`published`** |

**Postman tips for B3 (binary PUT)**

1. New request → method `PUT` → URL = `{{UPLOAD_URL}}` (full URL from B1, may be host relative to content-service / Cloud Run).
2. Body → **binary** → select the `.mp4` / `.png` file.
3. Headers → `Content-Type: video/mp4` (or matching mime).
4. Do **not** send `Authorization` on the storage `PUT` unless your storage adapter requires it (local `/storage/upload/...` does not).

**cURL (local example) — upload clip**

```bash
GATEWAY='http://localhost:5000'
TOKEN='<accessToken>'
# Connect $GATEWAY/dev/coach-ws first.

UP=$(curl -s -X POST "$GATEWAY/content/upload-url" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"fileName":"highlight.mp4","mimeType":"video/mp4","fileSize":5242880}')
echo "$UP" | jq .

CONTENT_ID=$(echo "$UP" | jq -r '.contentId')
UPLOAD_URL=$(echo "$UP" | jq -r '.uploadUrl')

curl -s -X PUT "$UPLOAD_URL" \
  -H 'Content-Type: video/mp4' \
  --data-binary @./highlight.mp4

curl -s -X POST "$GATEWAY/content/$CONTENT_ID/publish" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Ranked highlight","caption":"Clutch round","hashtags":["#NxClip","#Highlights"]}' | jq .

# Watch /dev/coach-ws for content:moderation_complete (+ transcription events for clips)
```

---

#### WebSocket events to expect on `/dev/coach-ws`

| Event | Journey | Typical payload |
|-------|---------|-----------------|
| `content:processing` | Image Studio (optional) | `{ contentId, progress }` |
| `content:generation_complete` | Image Studio | `{ contentId, assetUrl }` (+ `notificationId`) |
| `content:generation_failed` | Image Studio failure | `{ contentId, reason, retryable }` |
| `content:moderation_complete` | Both (after publish) | `{ contentId, status: "approved" \| "rejected" }` |
| `content:transcribing` | Upload clip | progress |
| `content:transcription_complete` | Upload clip | `{ contentId, transcriptId }` |
| `coach:token` / `coach:progress` / `onboarding:complete` | Creator Coach only | see [Coach e2e](#e2e-flow-gateway--creator-coach) |

Auth on Socket.IO: same JWT as Postman (`auth.token`). Room: `user:{sub}`.

---

#### Postman collection checklist

- [ ] Environment: `GATEWAY`, `TOKEN`, `CONTENT_ID`, `UPLOAD_URL`
- [ ] Browser `/dev/coach-ws` connected before publish (and before generate if testing WS generation events)
- [ ] `AI_IMAGE_PROVIDER=vertex` on ai-service (Gemini Image on Vertex + Vertex captions), or `gemini` + billing for AI Studio image
- [ ] `STORAGE_PROVIDER=gcs`, `GCS_BUCKET=nxclip-media-prod`, `CONTENT_MEDIA_BASE_URL=<api-gateway origin>` on content-service
- [ ] Bucket private; content-service SA has `storage.objectAdmin` + `serviceAccountTokenCreator` (signed URLs)
- [ ] FREE plan: generate ≤ 10/day, upload-url ≤ 20/day (otherwise `403` + `required_plan`)
- [ ] On reject: `PATCH /content/{{CONTENT_ID}}` then publish again; watch a second `content:moderation_complete`

---

### `POST /content/upload-url`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | JWT |
| **Response** | `201` — `UploadUrlResponseDto` |

Creates a content row in `draft` and returns a PUT URL for the binary upload.

**Request body** (use either naming style):

```json
{
  "fileName": "photo.png",
  "mimeType": "image/png",
  "fileSize": 1024000
}
```

| Canonical | Alias |
|-----------|-------|
| `fileName` | `filename` |
| `mimeType` | `contentType` |
| `fileSize` | `fileSizeBytes` |

**Validation:** at least one name per field required; `fileSize` 1 – 104,857,600 (100 MB).

**Response:**

```json
{
  "uploadUrl": "https://storage.googleapis.com/nxclip-media-prod/…?X-Goog-Signature=…",
  "contentId": "uuid",
  "assetId": "uuid",
  "expiresIn": 3600
}
```

Local: `uploadUrl` targets content-service `/storage/upload/...`. Production GCS: V4 signed `PUT` URL (bucket remains private).

**Business rules:** Free plan daily upload limit 20 → `403` with `required_plan`, `current`, `limit`, `upgrade_url`.

**Client next step:** `PUT` the file to `uploadUrl`, then later `POST /content/{contentId}/publish`. Media display uses `GET /content/{contentId}/media` (JWT), not a public GCS URL.

---

### `POST /content/generate`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | JWT |
| **Response** | `201` — Image Studio payload (`GenerateImageResponseDto`) |

**Image Studio journey:** generate → pick caption/hashtag set in UI → publish → await moderation WebSocket.

Runs AI generation **inline** (content-service waits for ai-service). Prefer rendering from this HTTP response.

**Request body:**

```json
{
  "prompt": "A sunset over mountains",
  "style": "cinematic",
  "aspectRatio": "16:9"
}
```

| Field | Rules |
|-------|-------|
| `prompt` | Required, 3–2000 chars |
| `style` | Optional: `cinematic`, `meme`, `pixel_art`, `cartoon`, `realistic` |
| `aspectRatio` | Optional: `1:1`, `16:9`, `9:16` |
| `model` | Optional, max 64 |

**Response:**

```json
{
  "contentId": "uuid",
  "cdnUrl": "https://api-gateway-….run.app/content/{contentId}/media",
  "thumbnailUrl": "https://api-gateway-….run.app/content/{contentId}/media",
  "captions": ["Caption A", "Caption B", "Caption C"],
  "hashtagSets": [
    ["#NxClip", "#AIArt"],
    ["#Creator", "#Viral"],
    ["#Design", "#Social"]
  ],
  "watermarked": true
}
```

| Field | Notes |
|-------|------|
| `contentId` | Use for publish / library / media |
| `cdnUrl` / `thumbnailUrl` | Authenticated media route (`CONTENT_MEDIA_BASE_URL` + `/content/{id}/media`). Not a permanent public GCS URL |
| `captions` | Exactly 3 variants — pick one client-side |
| `hashtagSets` | Exactly 3 bundles — pick one client-side |
| `watermarked` | `true` for FREE plan |

**Errors:**

| HTTP | Condition |
|------|-----------|
| `400` | Validation |
| `403` | Daily limit (10) — body includes `required_plan: "pro"`, `upgrade_url` |

**Provider:** `AI_IMAGE_PROVIDER` — preferred GCP: `vertex` (Gemini Image + Vertex text captions). Alternatives: `gemini`, `pollinations`, `openai`, `mock`.

**Lifecycle:** content starts `processing`, completes as `draft` with media in GCS + caption metadata before the HTTP response returns.

---

### `GET /content/{id}/media`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | JWT (Bearer **or** gateway cookie `nx_access_token`) |
| **Response** | `302` redirect to short-lived GCS signed GET, or `200` streamed body (local storage) |

**Authorization**

| Caller | Allowed when |
|--------|----------------|
| Owner (`userId === sub`) | Any non-deleted status (draft / publishing / published / rejected / …) |
| Other signed-in user | Only if status is **`published`** (feed) |

**Why:** Keeps `gs://nxclip-media-prod` private. Browsers should load `<img src="{cdnUrl}">` against the **api-gateway** origin so the auth cookie is sent. SPA on another origin may `fetch` with `Authorization` + `blob:` URL.

**Errors:** `403` not allowed · `404` missing · `400` no `storageKey`.

---

### `GET /content`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Public |
| **Query** | `cursor` (ISO 8601, optional), `limit` (1–100, default 20) |
| **Response** | `200` — `ContentListResponseDto` |
| **Image Studio** | **Not required** for generate→publish. Discovery list of **published** items; feed UI normally uses `/feed`. |

**Response item (`ContentDto`):**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "",
  "description": "",
  "status": "published",
  "contentType": "image",
  "cdnUrl": "https://…",
  "thumbnailUrl": "https://…",
  "captions": ["…"],
  "hashtagSets": [["#a"]],
  "watermarked": false,
  "createdAt": "ISO"
}
```

Returns only `published` content. `captions` / `hashtagSets` are optional (set after Image Studio generation).

---

### `GET /content/mine`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | JWT |
| **Query** | Same as `GET /content` |
| **Response** | `200` — `ContentListResponseDto` |
| **Image Studio** | **Optional** — library / refresh. Not required for minimal generate→publish. |

Lists all content owned by the authenticated user (any status except soft-deleted). `cdnUrl` values are authenticated media routes.

---

### `GET /content/mine/{id}`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | JWT |
| **Response** | `200` — `ContentDto` |
| **Image Studio** | **Optional** — owned draft/publishing detail. |

Owned content in any non-deleted status (including `draft` / `processing`).

**Errors:** `403` not owner, `404` not found.

---

### `GET /content/{id}`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Public |
| **Path** | `id` — UUID |
| **Response** | `200` — `ContentDto` |
| **Image Studio** | **After `published` only** — share/detail. Not used during create. |

**Error codes:**

| Code | HTTP | Condition |
|------|------|-----------|
| Invalid UUID | `400` | Malformed `id` |
| Not found / not published | `404` | `ContentNotFoundException` |

---

### `PATCH /content/{id}`

| | |
|---|---|
| **Method** | `PATCH` |
| **Auth** | JWT |
| **Response** | `200` — `ContentDto` |
| **Image Studio** | **Only on moderation reject** — not part of happy-path generate→publish. |

Edit content **only** when status is `moderation_rejected`. Transitions to `draft` on success.

**Request body** (at least one required):

```json
{
  "title": "string",
  "description": "string"
}
```

**Validation:**

| Field | Rules |
|-------|-------|
| `title` | Required if `description` omitted; string, max 200 |
| `description` | Required if `title` omitted; string, max 5000 |

**Error codes:**

| Code | HTTP | Condition |
|------|------|-----------|
| Validation | `400` | DTO / missing both fields |
| Wrong status | `400` | `InvalidContentStateException` — not `moderation_rejected` |
| Not owner | `403` | `ContentForbiddenException` |
| Not found | `404` | `ContentNotFoundException` |

---

### `POST /content/{id}/retry-generation`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | JWT |
| **Response** | `200` — same Image Studio payload as `POST /content/generate` |

**Precondition:** Content status `generation_failed` with a stored `prompt`.

**Error codes:**

| Code | HTTP | Condition |
|------|------|-----------|
| Wrong status | `400` | Not `generation_failed` |
| No prompt | `400` | Missing prompt |
| Plan limit | `403` | Daily generation limit |
| Not owner | `403` | `ContentForbiddenException` |

---

### `POST /content/{id}/publish`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | JWT |
| **Response** | `200` — `PublishContentResponseDto` |

**Precondition:** Status `draft` or `processing`; must have `storageKey`.

**Request body** (all optional — Image Studio sends the user's selection):

```json
{
  "title": "Mountain Sunset",
  "caption": "Selected caption text",
  "hashtags": ["#NxClip", "#AIArt"],
  "description": "Optional longer description"
}
```

**Response:**

```json
{
  "message": "Content submitted for moderation",
  "contentId": "uuid",
  "jobId": "uuid",
  "status": "publishing"
}
```

**Client next step:** subscribe to WebSocket `content:moderation_complete` filtered by `contentId`.

**Error codes:**

| Code | HTTP | Condition |
|------|------|-----------|
| Wrong status | `400` | `InvalidContentStateException` |
| No media | `400` | Missing `storageKey` |
| Not owner | `403` | `ContentForbiddenException` / not authorised |
| Not found | `404` | `ContentNotFoundException` |

---

### `DELETE /content/{id}`

| | |
|---|---|
| **Method** | `DELETE` |
| **Auth** | JWT |
| **Response** | `204` |
| **Image Studio** | **Optional** — library management. Not required for generate→publish. |

Soft-deletes content and removes the GCS (or local) storage object.

**Error codes:** `403` not owner / not authorised, `404` not found.

---

### Internal — Content Service

**Base path:** `/internal/content`  
**Auth:** `X-Internal-API-Key` on all routes (header value = shared `INTERNAL_API_KEY`).

These routes are **service-to-service only** (ai-service → content-service). They are **not** proxied by api-gateway — call the **content-service** Cloud Run URL (or `http://localhost:5002` locally).

On **GCP Cloud Run**, backends require authentication. Callers must also send a Cloud Run **identity token**:

| Header | Purpose |
|--------|---------|
| `X-Internal-API-Key` | App-level internal auth (Nest guard) |
| `Authorization: Bearer <identity-token>` | Cloud Run IAM (`roles/run.invoker`) |

Locally (HTTP, no Cloud Run IAM), only `X-Internal-API-Key` is required.

#### `POST /internal/content/{id}/callbacks/moderation`

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `{CONTENT_SERVICE_URL}/internal/content/{contentId}/callbacks/moderation` |
| **Auth** | `X-Internal-API-Key` + (Cloud Run) identity token |
| **Response** | `204` |
| **Called by** | ai-service after Vertex/Gemini/mock moderation completes |

Used to move content out of `publishing` after approve/reject. If this callback fails (e.g. Cloud Run **403** because ai-service SA lacks `roles/run.invoker` on content-service), moderation may succeed in ai-service while content stays stuck in **`publishing`**. You can invoke this manually from Postman to unstick.

**Request body:**

```json
{
  "jobId": "019f64ae-1d9d-75cf-bf04-c5f2400b28f6",
  "approved": true,
  "flags": []
}
```

| Field | Rules |
|-------|-------|
| `jobId` | Required UUID — moderation job id from publish response / ai-service logs |
| `approved` | Required boolean |
| `flags` | Optional string array |

**Effects:**

- `approved: true` → lifecycle toward **`published`** (after feed projection) + WS `content:moderation_complete` `{ status: "approved" }`
- `approved: false` → **`moderation_rejected`** + WS `content:moderation_complete` `{ status: "rejected" }`

##### Manual invoke (Postman / curl) — Cloud Run

1. Resolve content-service URL (must match ai-service env `CONTENT_SERVICE_URL`, not the gateway):

```bash
gcloud run services describe content-service \
  --region=us-central1 --project=nxclip-500511 \
  --format='value(status.url)'
# Example: https://content-service-okab7lw4ha-uc.a.run.app
```

2. Mint a short-lived identity token (audience = that origin; expires ~1h):

```bash
gcloud auth print-identity-token \
  --audiences='https://content-service-okab7lw4ha-uc.a.run.app'
```

3. Use the same `INTERNAL_API_KEY` as content-service / ai-service Cloud Run.

**cURL (import into Postman: Import → Raw text):**

```bash
curl --location --request POST 'https://content-service-okab7lw4ha-uc.a.run.app/internal/content/019f64ad-1d1c-7397-9694-e3f3c2331c88/callbacks/moderation' \
  --header 'Authorization: Bearer PASTE_IDENTITY_TOKEN_HERE' \
  --header 'X-Internal-API-Key: PASTE_INTERNAL_API_KEY_HERE' \
  --header 'Content-Type: application/json' \
  --data-raw '{"jobId":"019f64ae-1d9d-75cf-bf04-c5f2400b28f6","approved":true,"flags":[]}'
```

Replace:

- Host / `{contentId}` / `jobId` with your values from publish response + ai-service logs
- `PASTE_IDENTITY_TOKEN_HERE` — output of `gcloud auth print-identity-token --audiences=…`
- `PASTE_INTERNAL_API_KEY_HERE` — shared `INTERNAL_API_KEY`

**Postman fields:**

| Field | Value |
|-------|--------|
| Method | `POST` |
| URL | `https://content-service-….run.app/internal/content/{{contentId}}/callbacks/moderation` |
| Header `Authorization` | `Bearer {{cloudRunIdToken}}` |
| Header `X-Internal-API-Key` | `{{internalApiKey}}` |
| Header `Content-Type` | `application/json` |
| Body (raw JSON) | `{ "jobId": "{{jobId}}", "approved": true, "flags": [] }` |

Then verify:

```bash
curl -s 'https://api-gateway-….run.app/content/mine/{{contentId}}' \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

Expect status to leave `publishing` (toward `published` after feed upsert, or `moderation_rejected` if `approved: false`).

##### Permanent fix (preferred over manual callbacks)

Grant the **ai-service** runtime SA `roles/run.invoker` on content-service (and typically identity / notification / feed for other callbacks):

```bash
AI_SA=$(gcloud run services describe ai-service --region=us-central1 --project=nxclip-500511 \
  --format='value(spec.template.spec.serviceAccountName)')
# If empty: PROJECT_NUMBER-compute@developer.gserviceaccount.com

gcloud run services add-iam-policy-binding content-service \
  --region=us-central1 --project=nxclip-500511 \
  --member="serviceAccount:${AI_SA}" \
  --role=roles/run.invoker
```

##### Local

```bash
curl -s -X POST 'http://localhost:5002/internal/content/{{contentId}}/callbacks/moderation' \
  -H 'X-Internal-API-Key: dev-internal-api-key-change-me' \
  -H 'Content-Type: application/json' \
  -d '{"jobId":"{{jobId}}","approved":true,"flags":[]}'
```

(No Cloud Run identity token locally.)

---

#### `POST /internal/content/{id}/callbacks/generation`

| | |
|---|---|
| **Response** | `204` |

**Request:**

```json
{
  "jobId": "uuid",
  "storageKey": "string",
  "thumbnailUrl": "string",
  "imageBase64": "optional base64 when provider returns inline bytes",
  "mimeType": "image/png",
  "captions": ["…", "…", "…"],
  "hashtagSets": [["#a"], ["#b"], ["#c"]]
}
```

**Validation:** `jobId` UUID; `storageKey` max 512; `thumbnailUrl` optional max 2048; `imageBase64` / captions / hashtagSets optional.

---

#### `POST /internal/content/{id}/callbacks/generation-failed`

| | |
|---|---|
| **Response** | `204` |

**Request:**

```json
{
  "jobId": "uuid",
  "reason": "provider timeout",
  "retryable": true
}
```

**Validation:** `jobId` UUID; `reason` string; `retryable` optional boolean.

---

#### `POST /internal/content/{id}/callbacks/transcription`

| | |
|---|---|
| **Response** | `204` |

**Request:**

```json
{
  "jobId": "uuid",
  "transcript": "string",
  "language": "en"
}
```

**Validation:** `jobId` UUID; `transcript` string; `language` optional max 16.

---

#### `GET /internal/content/{id}`

| | |
|---|---|
| **Response** | `200` — `ContentDto` |

Returns content including non-published and soft-deleted states.

**Internal errors:** `401` invalid API key; `404` not found.

---

### Health — Content Service

| Endpoint | Method | Auth | Response |
|----------|--------|------|----------|
| `/health` | GET | Public | `{ "status": "ok", "service": "content-service" }` |
| `/health/live` | GET | Public | `{ "status": "live" }` |
| `/health/ready` | GET | Public | `{ "status": "ready" }` |

---

## Feed Service

**Base URL (local direct):** `http://localhost:5003`  
**Production (via gateway):** `https://api-gateway-216098834386.us-central1.run.app` — prefix `/feed`

> **Routing note:** Engagement routes are registered at `/content/{id}/...` on feed-service, and user follow routes at `/users/{id}/...`. The API Gateway routes `/content` and `/users` to **other** services. Call feed-service **directly** on port `5003` for engagement and follow endpoints until gateway path splitting is added.

---

### `GET /feed`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | JWT |
| **Query** | `cursor` (ISO 8601), `limit` (1–50, default 20) |
| **Response** | `200` — `FeedListResponseDto` |

**Response item (`FeedItemDto`):**

```json
{
  "id": "uuid",
  "contentId": "uuid",
  "userId": "uuid",
  "title": "string",
  "description": "string",
  "contentType": "image",
  "thumbnailUrl": "string",
  "likeCount": 0,
  "commentCount": 0,
  "likedByMe": false,
  "publishedAt": "ISO"
}
```

---

### `GET /feed/trending`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Public (optional JWT enriches `likedByMe`) |
| **Query** | Same as `GET /feed` |
| **Response** | `200` — `FeedListResponseDto` |

---

### `GET /feed/{id}`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Public (optional JWT) |
| **Path** | `id` — feed projection UUID |
| **Response** | `200` — `FeedItemDto` |

**Error codes:** `404` — feed item not found.

---

### `POST /content/{id}/like`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | JWT |
| **Service** | feed-service (`5003`) |
| **Response** | `201` — `LikeResponseDto` |

**Response:**

```json
{
  "contentId": "uuid",
  "liked": true,
  "likeCount": 1
}
```

Idempotent — repeated likes do not duplicate.

---

### `POST /content/{id}/comment`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | JWT |
| **Response** | `201` — `CommentDto` |

**Request:**

```json
{
  "body": "Great clip!"
}
```

**Validation:** `body` required, 1–2000 chars.

**Response:**

```json
{
  "id": "uuid",
  "userId": "uuid",
  "contentId": "uuid",
  "body": "string",
  "createdAt": "ISO"
}
```

---

### `GET /content/{id}/comments`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Public |
| **Query** | `cursor`, `limit` (1–50) |
| **Response** | `200` — `CommentListResponseDto` |

---

### `POST /users/{id}/follow`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | JWT |
| **Service** | feed-service (`5003`) |
| **Path** | `id` — target user UUID |
| **Response** | `201` — `FollowResponseDto` |

**Response:**

```json
{
  "userId": "uuid",
  "following": true,
  "followerCount": 1
}
```

**Error codes:** `400` — `SelfFollowException` (cannot follow yourself).

---

### `GET /users/{id}/profile`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | Public (optional JWT for `isFollowing`) |
| **Response** | `200` — `UserProfileDto` |

```json
{
  "userId": "uuid",
  "followerCount": 0,
  "followingCount": 0,
  "isFollowing": false
}
```

---

### Internal — Feed Service

#### `POST /internal/feed/projections`

| | |
|---|---|
| **Auth** | Internal |
| **Response** | `201` — `{ "contentId": "uuid" }` |

**Request:**

```json
{
  "contentId": "uuid",
  "authorId": "uuid",
  "title": "string",
  "description": "string",
  "thumbnailUrl": "string",
  "contentType": "image",
  "publishedAt": "2026-06-11T12:00:00.000Z"
}
```

**Validation:**

| Field | Rules |
|-------|-------|
| `contentId`, `authorId` | Required UUID |
| `title` | Optional, max 200 |
| `description` | Optional, max 5000 |
| `thumbnailUrl` | Optional, max 2048 |
| `contentType` | Optional string |
| `publishedAt` | Required ISO 8601 |

**Error codes:** `401` invalid key; `404` content not found (when validated via content client).

---

### Health — Feed Service

| Endpoint | Method | Auth | Response |
|----------|--------|------|----------|
| `/health` | GET | Public | `{ "status": "ok", "service": "feed-service" }` |
| `/health/live` | GET | Public | `{ "status": "live" }` |
| `/health/ready` | GET | Public | `{ "status": "ready" }` |

---

## AI Service

**Base URL (local direct):** `http://localhost:5004`  
**Production (via gateway):** `https://api-gateway-216098834386.us-central1.run.app` — prefix `/coach` (JWT Creator Coach only)

| Route group | Auth | Via gateway? |
|-------------|------|--------------|
| `/coach/onboarding/*` | **JWT** | Yes — public SPA path |
| `/internal/*` | **Internal** API key | No — service-to-service only |

BullMQ job queues (`/internal/queue/*`) are processed asynchronously. Creator Coach onboarding is interactive (HTTP + WebSocket token streaming).

---

### Creator Coach Onboarding (JWT)

Interactive 5-question onboarding powered by Gemini (MVP) or Claude (production). UI brand: “Creator Coach”; engine selected by `AI_ONBOARDING_PROVIDER`.

**Prerequisites for e2e:**

1. Register / login → obtain `accessToken`.
2. Open the browser Socket.IO test page (deployed with the gateway):  
   **Production:** `https://api-gateway-216098834386.us-central1.run.app/dev/coach-ws`  
   **Local:** `http://localhost:5000/dev/coach-ws`  
   Paste the same JWT, click **Connect**, then run the coach HTTP calls from Postman.
3. Call the three endpoints below in order via the **API Gateway**.

**Base (production):** `https://api-gateway-216098834386.us-central1.run.app/coach/onboarding`  
**Base (local):** `http://localhost:5000/coach/onboarding` (gateway) or `http://localhost:5004/coach/onboarding` (direct)

---

#### Socket.IO browser test page

| | |
|---|---|
| **URL (production)** | `GET https://api-gateway-216098834386.us-central1.run.app/dev/coach-ws` |
| **URL (local)** | `GET http://localhost:5000/dev/coach-ws` |
| **Auth** | Public (page load). Paste JWT in the form for Socket.IO. |
| **Source** | `apps/api-gateway/public/dev/coach-ws.html` — shipped in the api-gateway Cloud Run image |

The page pre-fills **Notification service URL** from gateway env `NOTIFICATION_SERVICE_URL`. Keep it open while Postman calls `/coach/onboarding/*` **or** content journeys (`/content/generate`, `/content/upload-url`, `/content/{id}/publish`).

It logs:

- Coach: `coach:token`, `coach:progress`, `onboarding:complete`
- Content: `content:processing`, `content:generation_complete`, `content:generation_failed`, `content:moderation_complete`, transcription events

**If the log shows `connect_error: websocket error`:** the browser is connecting **directly** to notification-service Cloud Run. That service must allow unauthenticated invoke at the IAM layer (Socket.IO still requires your JWT). Check with:

```bash
curl -sI "https://notification-service-….run.app/health"
# Expect 200. If 403 Forbidden from Google Frontend, run:

gcloud run services add-iam-policy-binding notification-service \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --project=nxclip-500511
```

Also confirm `JWT_PUBLIC_KEY` on notification-service matches identity-service (invalid JWT → disconnect after handshake). Prefer a **fresh** `accessToken` from login/register.

See also: [Content E2E — Postman + Socket.IO](#e2e-testing-postman--socketio-test-page).

---

#### Creator Coach categories

Stable category ids (also accepted as case-insensitive labels). Seeded in ai-service Postgres (`ai.coach_categories` / `ai.coach_questions` via migration `002_coach_onboarding_question_bank.sql`):

| Id | Label |
|----|-------|
| `Gaming` | Gaming |
| `General` | General Content / Lifestyle |
| `Travel` | Travel / Adventure |
| `Food` | Food / Dining / Reviews |
| `Cooking` | Cooking / Recipes / DIY Baking |

Questions and chips are loaded from the DB at runtime (60s in-memory cache). To add a niche later, `INSERT` a category row plus question rows — no redeploy required for copy changes. Progress is still stored in **Redis** (`coach:onboarding:{userId}`, 7-day TTL) with an in-memory fallback.

---

#### `POST /coach/onboarding/start`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | JWT |
| **Body** | Optional `{ "category"?: "Travel", "reset"?: false }` |
| **Response** | `200` — `CoachQuestionResponse` |

- No body / no `category`: returns **category picker** (`question: 0`), unless an in-progress session exists — then **resumes** the next question.
- `{ "category": "Travel" }`: starts Travel Q1 (clears prior answers for a fresh category run).
- `{ "reset": true }`: clears saved progress, then follows the rules above.
- Streams opening text via WebSocket `coach:token`.

**Category picker response:**

```json
{
  "message": "Welcome to NxClip! I am your Creator Coach. First — what kind of content do you create? …",
  "question": 0,
  "category": null,
  "chips": ["Gaming", "General", "Travel", "Food", "Cooking"],
  "chipLabels": ["Gaming", "General Content / Lifestyle", "Travel / Adventure", "Food / Dining / Reviews", "Cooking / Recipes / DIY Baking"],
  "multiSelect": false,
  "totalQuestions": 5,
  "answeredCount": 0,
  "status": "category"
}
```

**Start with category:**

```bash
curl -s -X POST "$GATEWAY/coach/onboarding/start" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"category":"Travel"}'
```

**Example response (Travel Q1):**

```json
{
  "message": "Welcome to NxClip! I am your Travel Creator Coach. Let's set up your account in 90 seconds — just answer 5 quick questions.",
  "question": 1,
  "category": "Travel",
  "chips": ["Solo Backpacking", "Luxury Destinations", "Budget Travel Hacks", "Outdoor Adventure & Hiking", "Hidden Gems & Local Secrets", "Digital Nomad Lifestyle", "Vanlife & Camping"],
  "multiSelect": true,
  "totalQuestions": 5,
  "answeredCount": 0,
  "status": "in_progress"
}
```

---

#### `GET /coach/onboarding/status`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | JWT |
| **Response** | `200` — progress snapshot for SPA refresh |

```json
{
  "status": "in_progress",
  "category": "Travel",
  "nextQuestion": 3,
  "answeredCount": 2,
  "totalQuestions": 5,
  "answers": { "1": ["Solo Backpacking"], "2": "Smart budget planners" },
  "categories": [{ "id": "Travel", "label": "Travel / Adventure" }],
  "question": { "message": "…", "question": 3, "chips": ["…"], "multiSelect": false, "category": "Travel" }
}
```

`status`: `not_started` | `category` | `in_progress` | `ready_for_plan` | `completed` (completed is typically reflected on the user profile via `onboardingCompleted` after generate-plan).

---

#### `POST /coach/onboarding/answer`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | JWT |
| **Response** | `200` — next `CoachQuestionResponse` |

| Field | Rules |
|-------|-------|
| `question` | Required integer `0`–`5` (`0` = category) |
| `answer` | `string` (category / Q2–Q5) **or** `string[]` (multi-select Q1) |

**Example — category (Q0):**

```json
{ "question": 0, "answer": "Travel" }
```

**Example — Q1 (multi-select niches):**

```json
{ "question": 1, "answer": ["Solo Backpacking", "Budget Travel Hacks"] }
```

After Q5, response `status` is `ready_for_plan` — then call [`generate-plan`](#post-coachonboardinggenerate-plan).

Emits `coach:progress` (e.g. `Question 2/5 saved`) and `coach:token` for the next coach message.

---

#### `POST /coach/onboarding/generate-plan`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | JWT |
| **Body** | None |
| **Response** | `200` — `CoachPlanResponse` |

Requires all 5 answers in the durable coach session. Plan LLM prompt is category-aware. Persists to identity (`users.onboarding_plan`, `users.onboarding_completed = true`), streams `coach:progress` → `coach:token` → `onboarding:complete`, then clears the session.

**Response body:**

```json
{
  "message": "Your first Travel / Adventure week is ready! Here is what I have planned for you:",
  "category": "Travel",
  "onboardingCompleted": true,
  "plan": {
    "introMessage": "…",
    "days": [{ "day": "Monday", "icon": "✈️", "contentType": "Hero clip", "theme": "…" }],
    "recommendedHashtags": ["#nxclip", "#travel", "#contentcreator"],
    "workspaceTheme": {
      "primaryColor": "#6366F1",
      "motivationalQuote": "Create consistently — your audience is waiting."
    },
    "customSystemPromptSuggestion": "…"
  }
}
```

`plan.days` always contains **7** entries (Monday–Sunday).

---

#### E2E flow (gateway) — Creator Coach

```bash
GATEWAY='https://api-gateway-216098834386.us-central1.run.app'
# GATEWAY='http://localhost:5000'   # local

AUTH=$(curl -s -X POST "$GATEWAY/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"email":"coach-e2e@example.com","username":"coache2e","displayName":"Coach E2E","password":"Password123!"}')
TOKEN=$(echo "$AUTH" | jq -r '.accessToken')

# Category picker (or resume)
curl -s -X POST "$GATEWAY/coach/onboarding/start" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{}' | jq .

# Or jump straight into Travel
curl -s -X POST "$GATEWAY/coach/onboarding/start" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"category":"Travel","reset":true}' | jq .

curl -s -X POST "$GATEWAY/coach/onboarding/answer" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"question":1,"answer":["Solo Backpacking","Budget Travel Hacks"]}' | jq .

curl -s -X POST "$GATEWAY/coach/onboarding/answer" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"question":2,"answer":"Smart budget planners"}' | jq .

# … Q3–Q5 from Travel bank, then:
curl -s "$GATEWAY/coach/onboarding/status" -H "Authorization: Bearer $TOKEN" | jq .

curl -s -X POST "$GATEWAY/coach/onboarding/generate-plan" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' | jq .
```

**Related WebSocket events** (notification-service `/events`):

| Event | When | Payload |
|-------|------|---------|
| `coach:token` | Message streaming during start / answer / plan | `{ "token": "string" }` |
| `coach:progress` | Category set, each answer saved, plan generation | `{ "message": "string" }` |
| `onboarding:complete` | After plan saved | `{ "userId": "uuid", "message": "string" }` |

See also: [AI-INTEGRATIONS.md §11](./AI-INTEGRATIONS.md#11-interactive-creator-coach-onboarding-flow-specifications).

---

### Internal queue routes (Internal API key)

Not proxied by the gateway. Call `http://localhost:5004` (or the Cloud Run ai-service URL) with `X-Internal-API-Key`.

### `POST /internal/queue/generate-image`

| | |
|---|---|
| **Method** | `POST` |
| **Response** | `201` — `QueueJobResponseDto` |

**Request:**

```json
{
  "jobId": "uuid",
  "contentId": "uuid",
  "userId": "uuid",
  "prompt": "string",
  "style": "string",
  "aspectRatio": "16:9",
  "model": "default",
  "watermarkRequired": false
}
```

**Validation:**

| Field | Rules |
|-------|-------|
| `jobId` | Optional UUID |
| `contentId`, `userId` | Required UUID |
| `prompt` | 3–2000 chars |
| `style`, `model` | Optional, max 64 |
| `aspectRatio` | Optional, max 16 |
| `watermarkRequired` | Optional boolean |

**Response:** `{ "jobId": "uuid", "status": "queued" }`

On completion/failure, callbacks `content-service` internal endpoints.

---

### `POST /internal/queue/moderate`

| | |
|---|---|
| **Method** | `POST` |
| **Response** | `201` — `QueueJobResponseDto` |

**Request:**

```json
{
  "contentId": "uuid",
  "userId": "uuid",
  "assetUrl": "https://...",
  "storageKey": "uploads/...",
  "contentType": "image"
}
```

**Validation:** `contentId` UUID required; other fields optional with max lengths (2048 / 512 / 32).

---

### `POST /internal/queue/transcription`

| | |
|---|---|
| **Method** | `POST` |
| **Response** | `201` — `QueueJobResponseDto` |

**Request:**

```json
{
  "contentId": "uuid",
  "assetUrl": "https://..."
}
```

**Validation:** `contentId` UUID; `assetUrl` string max 2048.

---

### `POST /internal/moderation`

| | |
|---|---|
| **Method** | `POST` |
| **Response** | `202` — `QueueJobResponseDto` |

Contract alias. **Request:** `{ "contentId": "uuid", "assetUrl": "string" }` (minimal validation at controller).

---

### `POST /internal/transcription`

| | |
|---|---|
| **Method** | `POST` |
| **Response** | `202` — `QueueJobResponseDto` |

Contract alias. **Request:** `{ "contentId": "uuid", "assetUrl": "string" }`.

---

### Health — AI Service

| Endpoint | Method | Auth | Response |
|----------|--------|------|----------|
| `/health` | GET | Public | `{ "status": "ok", "service": "ai-service" }` |
| `/health/live` | GET | Public | `{ "status": "live" }` |
| `/health/ready` | GET | Public | `{ "status": "ready" }` |

---

## Analytics Service

**Base URL (local direct):** `http://localhost:5005`  
**Production (via gateway):** `https://api-gateway-216098834386.us-central1.run.app` — prefix `/analytics`

---

### `POST /analytics/events`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | JWT |
| **Response** | `202` — `IngestEventResponseDto` |

**Request:**

```json
{
  "eventType": "VIEW",
  "contentId": "uuid",
  "userId": "uuid",
  "occurredAt": "2026-06-11T12:00:00.000Z"
}
```

**Validation (FluentValidation):**

| Field | Rules |
|-------|-------|
| `eventType` | Required; one of `VIEW`, `LIKE`, `COMMENT`, `FOLLOW`, `SHARE`, `CONTENT_PUBLISHED` |
| `contentId` | Required UUID |
| `userId` | Optional UUID |
| `occurredAt` | Optional datetime |

**Response:**

```json
{
  "eventId": "uuid",
  "status": "accepted"
}
```

---

### `GET /analytics/metrics`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | JWT |
| **Response** | `200` — `DashboardMetricsDto` |

```json
{
  "views": 0,
  "likes": 0,
  "comments": 0,
  "followers": 0,
  "reach": 0
}
```

**Error codes:** `403` — `PlanRestrictedException` for plans without analytics access.

---

### `GET /analytics/report/latest`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | JWT |
| **Response** | `200` — `WeeklyReportDto` |

```json
{
  "reportId": "uuid",
  "userId": "uuid",
  "periodStart": "datetime",
  "periodEnd": "datetime",
  "views": 0,
  "likes": 0,
  "comments": 0,
  "followers": 0,
  "growthRate": 0.0
}
```

**Error codes:**

| Code | HTTP | Condition |
|------|------|-----------|
| Report not found | `404` | `ReportNotFoundException` |
| Plan restricted | `403` | `PlanRestrictedException` |

---

### Internal — Analytics Service

#### `POST /internal/events`

| | |
|---|---|
| **Auth** | Internal |
| **Response** | `202` — `IngestEventResponseDto` |

Same request/response as public ingest. Used by content-service outbox dispatcher for `CONTENT_PUBLISHED` events.

**Error codes:** `401` invalid API key; `400` validation failure.

---

### Health — Analytics Service

| Endpoint | Method | Auth | Response |
|----------|--------|------|----------|
| `/health` | GET | Public | `{ "status": "ok", "service": "analytics-service" }` |
| `/health/live` | GET | Public | `{ "status": "live" }` |
| `/health/ready` | GET | Public | `{ "status": "ready" }` |

---

## Notification Service

**Base URL (local direct):** `http://localhost:5006`  
**Production (via gateway):** `https://api-gateway-216098834386.us-central1.run.app` — prefix `/notifications`

### WebSocket (real-time)

| | |
|---|---|
| **URL** | `ws://localhost:5006/events` |
| **Namespace** | `/events` (Socket.IO) |
| **Auth** | JWT via `Authorization: Bearer`, `auth.token`, or cookie `nx_access_token` |
| **Delivery** | Server emits event name as message type (e.g. `content:generation_complete`) |

---

### `POST /notifications/register-token`

| | |
|---|---|
| **Method** | `POST` |
| **Auth** | JWT |
| **Response** | `204` |

**Request:**

```json
{
  "token": "device-push-token",
  "platform": "web"
}
```

**Validation:**

| Field | Rules |
|-------|-------|
| `token` | Required, 10–512 chars |
| `platform` | Optional: `web`, `ios`, `android` |

---

### `GET /notifications`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | JWT |
| **Query** | `cursor` (ISO 8601), `limit` (1–100, default 20) |
| **Response** | `200` — `NotificationListResponseDto` |

---

### `GET /notifications/preferences`

| | |
|---|---|
| **Method** | `GET` |
| **Auth** | JWT |
| **Response** | `200` — `NotificationPreferencesDto` |

```json
{
  "pushEnabled": true,
  "inAppEnabled": true,
  "eventPreferences": {
    "content:generation_complete": true
  }
}
```

---

### `PATCH /notifications/preferences`

| | |
|---|---|
| **Method** | `PATCH` |
| **Auth** | JWT |
| **Response** | `200` — `NotificationPreferencesDto` |

**Request** (all optional):

```json
{
  "pushEnabled": true,
  "inAppEnabled": true,
  "eventPreferences": {
    "content:generation_complete": false
  }
}
```

**Validation:** Booleans for flags; `eventPreferences` object when provided.

---

### `PATCH /notifications/{id}/read`

| | |
|---|---|
| **Method** | `PATCH` |
| **Auth** | JWT |
| **Path** | `id` — notification UUID |
| **Response** | `200` — `NotificationDto` |

**Error codes:** `404` — `NotificationNotFoundException`

---

### Internal — Notification Service

#### `POST /internal/emit`

| | |
|---|---|
| **Auth** | Internal |
| **Response** | `204` |

**Request:**

```json
{
  "userId": "uuid",
  "eventName": "content:generation_complete",
  "payload": {
    "contentId": "uuid",
    "assetUrl": "string"
  }
}
```

**Validation:**

| Field | Rules |
|-------|-------|
| `userId` | UUID |
| `eventName` | String, max 128; must be in `WEBSOCKET_EVENTS` |
| `payload` | Object |

**Error codes:**

| Code | HTTP | Condition |
|------|------|-----------|
| Invalid API key | `401` | — |
| Unsupported event | `400` | `BadRequestException` |

**Supported event names** (from `@nxclip/contracts`):

`onboarding:complete`, `coach:token`, `coach:progress`, `content:processing`, `content:moderation_complete`, `content:transcribing`, `content:transcription_complete`, `content:captions_ready`, `content:polish_complete`, `content:generation_complete`, `content:generation_failed`, `analytics:report_ready`, `billing:subscription_changed`

---

### Health — Notification Service

| Endpoint | Method | Auth | Response |
|----------|--------|------|----------|
| `/health` | GET | Public | `{ "status": "ok", "service": "notification-service" }` |
| `/health/live` | GET | Public | `{ "status": "live" }` |
| `/health/ready` | GET | Public | `{ "status": "ready" }` |

---

## Cross-Service Error Reference

### Content Service

| Exception | HTTP | Message pattern |
|-----------|------|-----------------|
| `ContentNotFoundException` | `404` | Content not found |
| `ContentForbiddenException` | `403` | Not authorised to view this content |
| `InvalidContentStateException` | `400` | State transition not allowed |
| `InvalidPlanException` | `403` | Plan limit — body includes `message`, `current`, `limit`, `upgrade_url`, `required_plan` |
| Validation pipe | `400` | Field validation errors |
| `InternalApiKeyGuard` | `401` | Invalid internal API key |

### Feed Service

| Exception | HTTP |
|-----------|------|
| `ContentNotFoundException` | `404` |
| `SelfFollowException` | `400` |
| `NotFoundException` | `404` |
| Validation pipe | `400` |

### Identity Service

| `code` | HTTP |
|--------|------|
| `EMAIL_EXISTS` | `409` |
| `USERNAME_EXISTS` | `409` |
| `INVALID_CREDENTIALS` | `401` |
| `INVALID_REFRESH_TOKEN` | `401` |
| `INVALID_VERIFICATION_TOKEN` | `401` |
| `USER_NOT_FOUND` | `404` |
| `ACCOUNT_DISABLED` | `403` |
| FluentValidation | `400` |

### Analytics Service

| Exception | HTTP |
|-----------|------|
| `ReportNotFoundException` | `404` |
| `PlanRestrictedException` | `403` |
| `ArgumentException` | `400` |
| FluentValidation | `400` |

### Notification Service

| Exception | HTTP |
|-----------|------|
| `NotificationNotFoundException` | `404` |
| Unsupported event | `400` |
| Validation pipe | `400` |

---

## Content Status Values (API)

Returned in `ContentDto.status`:

| Value | Description |
|-------|-------------|
| `draft` | Editable; ready to publish (also terminal state after successful Image Studio generate) |
| `processing` | AI generation in progress (usually brief — generate runs inline) |
| `generation_failed` | Generation failed; retry via `POST .../retry-generation` |
| `publishing` | Moderation / feed projection in progress |
| `moderation_rejected` | Moderation failed; `PATCH` then re-publish |
| `published` | Visible in feed (feed projection succeeded) |
| `deleted` | Soft-deleted |

---

## Headers

| Header | Direction | Purpose |
|--------|-----------|---------|
| `Authorization: Bearer <jwt>` | Request | User authentication (gateway validates JWT before proxying protected routes) |
| `X-Internal-API-Key` | Request | Service-to-service authentication on `/internal/*` routes (not exposed via gateway). Set `INTERNAL_API_KEY` identically in every service `.env` |
| `X-Correlation-Id` | Request/response | Distributed tracing |
| `X-User-Id` | Gateway → upstream | User ID forwarded by proxy |

**JWT keys:** Identity signs tokens with `JWT_PRIVATE_KEY`. Gateway and other services validate with the same `JWT_PUBLIC_KEY`. In Development, if identity has no keys configured it generates a new pair on each restart — align keys across services or protected routes return `401`.

---

*Generated from nxClip repository. **Production gateway:** `https://api-gateway-216098834386.us-central1.run.app`. **Local gateway:** `http://localhost:5000`. Interactive Swagger UI is available at `/docs` on the gateway and on each NestJS service in local development.*
