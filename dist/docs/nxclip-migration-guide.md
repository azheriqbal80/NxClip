# nxClip Production Migration Blueprint & Integration Report

This report provides backend developers and lead engineers with a module-by-module integration architecture mapping our React/Redux Toolkit (RTK) MVP client (originally backed by Firebase/Firestore) to the NestJS microservices environment. It incorporates real API constraints, schema parameters, security structures, and integration procedures detailed in the **nxClip API Reference** and **Frontend Integration Guide**.

---

## SECTION 1: Architectural Baseline

To migrate the nxClip client smoothly, we define standard frontend behaviors and microservice configurations that apply natively across all modules.

1.  **Identity & Security Architecture:**
    *   **Gateway Access:** All frontend requests target the API Gateway (`http://localhost:5000`).
    *   **Stateless Token Rotation:** Access tokens are short-lived JWTs (1 hour), and Refresh tokens expire in 30 days. Both can be configured inside cookies (`nx_access_token` and `nx_refresh_token`) with the flags `HttpOnly`, `SameSite=Lax`, and `Secure` to block XSS and CSRF.
    *   **Request Interceptors:** Standard HTTP queries mount `X-Correlation-Id: <uuid>` inside header requests for logging. Upstream paths have access to authenticated user contexts via forwarded `X-User-Id` header attributes.
2.  **CORS & Networking Constraints:**
    *   Dev and production client queries run with `credentials: "include"` inside fetch/Axios options to ensure cookie parameters are automatically attached.
3.  **WebSocket Handshake Protocols:**
    *   Client real-time triggers are powered by Socket.IO, pointing directly to the notification service endpoint (`ws://localhost:5006/events`).
    *   Authentication tokens are validated during the connection handshake using one of three credentials sources: standard bearer headers (`Authorization: Bearer <token>`), explicit handshake structures (`auth: { token }`), or native cookie queries (`nx_access_token`).

---

## SECTION 2: Module-by-Module Integration Blueprint

For each core business module of **nxclip.ai**, this section explains:
1.  **Current MVP Implementation:** How it is currently working with Firebase, Firestore, or local states.
2.  **Frontend Integration Approach:** How we will approach their frontend integration (based on the Frontend Integration Guide, headers, CORS, interceptors, etc.).
3.  **API Utilization Blueprint:** How we will utilize the APIs they expose (endpoint routes, payloads, validations, error loops).
4.  **Backend Migration Path:** How we will shift from Firebase to their services for the backend (Postgres tables, data synchronization, security rules).
5.  **Packages, Plugins, & Best Practices:** Dedicated dependencies and deployment guide principles.

---

### MODULE A: User Authentication & Security

#### A.1 Current MVP Implementation
*   **Mechanism:** Client interacts directly with Firebase Auth using `signInWithPopup(auth, GoogleAuthProvider)` and standard Email-Password functions.
*   **Local State:** Credentials maps to standard attributes (`uid`, `email`, `displayName`, `photoURL`) synced into the `authSlice` Redux state via the client's `onAuthStateChanged` listener.

#### A.2 Frontend Integration Approach
*   **Interceptor Lifecycle:** Transitions from the Firebase observer to a customized stateless system. We track `accessToken` in the global state while the `refreshToken` is managed as an HTTP-only browser cookie.
*   **Automatic Handshake Retries:** Configure Axios request interceptors to scan outbound headers. If an API returns `401 Unauthorized`, the interceptor blocks the request queue, triggers `POST /auth/refresh`, updates the credential variables, and automatically retries the original API payload.

#### A.3 API Utilization Blueprint
*   **Route `POST /auth/register` (Public):**
    *   *Payload:* `{ "email": "usr@test.com", "username": "usrname", "displayName": "Display Name", "password": "securepassword" }`
    *   *Validations:* `email` is verified; `username` (3–64 chars, regex `^[a-zA-Z0-9_]+$`); `displayName` (max 100); `password` (8–128).
    *   *Responses:* `201 Created` returning `AuthResponseDto`. If taken, returns `409` with code `EMAIL_EXISTS` or `USERNAME_EXISTS`.
*   **Route `POST /auth/login` (Public):**
    *   *Payload:* `{ "email": "usr@test.com", "password": "securepassword" }`
    *   *Responses:* `200 OK` (AuthResponseDto). If wrong, `401` with `INVALID_CREDENTIALS`. If disabled, `403` with `ACCOUNT_DISABLED`.
*   **Route `POST /auth/refresh` (Public):**
    *   *Payload:* `{ "refreshToken": "string" }` (Can be omitted if the `nx_refresh_token` cookie is present).
*   **Route `POST /auth/logout` (JWT):** Returns `204` to clean browser session states.
*   **Route `POST /auth/verify-email` (Public):** `{ "token": "string" }` returns `204`.

#### A.4 Backend Migration Path
*   **Sync Execution:** Extract data structures using Firebase Admin SDK scripts or standard GCP CLI commands (`gcloud auth export`).
*   **Target Postgres Table Schema:**
    ```sql
    CREATE TABLE auth_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(64) UNIQUE NOT NULL,
      display_name VARCHAR(100) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      plan_level VARCHAR(20) DEFAULT 'FREE', -- 'FREE' | 'PRO' | 'STUDIO'
      email_verified BOOLEAN DEFAULT FALSE,
      roles VARCHAR(50)[] DEFAULT '{USER}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_users_email ON auth_users(email);
    CREATE INDEX idx_users_username ON auth_users(username);
    ```
*   **Password Re-hashing:** Firebase password hashes use custom scrypt loops (`SCRYPT_B64`). Backend microservices can support these legacy hashes using a NestJS Scrypt compat layer, or prompt users to trigger a password change flow during migration.

#### A.5 Packages, Plugins, & Best Practices
*   **Dependencies:** `jwt-decode` (decodes JWT expiration locally on the client), `bcrypt` / `argon2` (secure server-side hash generation).
*   **Security Principle:** Do not store authentication tokens in `localStorage` to completely mitigate XSS access risks. Always leverage HTTP-Only cookies with a `SameSite=Lax` configuration.

---

### MODULE B: Profiles & User Management

#### B.1 Current MVP Implementation
*   **Mechanism:** Profile configurations map to Firestore collections `/users/{userId}`.
*   **Fields:** Simple key-value text structures: `bio`, social accounts (`twitch`, `youtube`, `tiktok`), and selected stream niches (`niches`).
*   **Updating State:** Updates are saved on input changes using `updateDoc`.

#### B.2 Frontend Integration Approach
*   **Server-State Synchronies:** Transitions page components to use Apollo Client or Axios mapping hooks. Re-syncs profile inputs with `GET /users/me` on component mount to keep views synchronized.
*   **Avatar Upload Handling:** Avatar modifications utilize the central content upload pipeline, retrieving S3 pre-signed upload channels rather than writing binary files directly to public Storage folders.

#### B.3 API Utilization Blueprint
*   **Route `GET /users/me` (JWT):** Retrieves standard profile details.
*   **Route `PATCH /users/me` (JWT):**
    *   *Payload:* `{ "displayName"?: "Name", "bio"?: "Bio Text", "avatarUrl"?: "url" }`
    *   *Validations:* `displayName` (max 100); `bio` (max 200); `avatarUrl` (max 500).
*   **Route `GET /users/{id}` (Public):** Retrieves a public profile card. If invalid or missing, returns `404` with `USER_NOT_FOUND`.

#### B.4 Backend Migration Path
*   **User Data Mapping Schema:**
    ```sql
    CREATE TABLE user_profiles (
      id UUID PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
      bio VARCHAR(200),
      avatar_url VARCHAR(500),
      social_links JSONB DEFAULT '{}'::jsonb, -- e.g. { "twitch": "", "youtube": "" }
      niches VARCHAR(50)[] DEFAULT '{}',
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ```

#### B.5 Packages, Plugins, & Best Practices
*   **Dependencies:** `react-hook-form` (simplifies client-side form management), `zod` (runtime schema validation).
*   **Optimization:** Implement a caching layer (e.g. Redis key-value store) in-front of public profile lookups to quickly serve public creator cards without overloading the primary Postgres instance.

---

### MODULE C: Clip Editor & Video Content Management

#### C.1 Current MVP Implementation
*   **Mechanism:** Client-side video track timelines use standard React states to track play segments, active clip parameters, and in-memory pacing indices.

#### C.2 Frontend Integration Approach
*   **Pre-signed Content Lifecycles:** Client-side media workflows bypass heavy server loads by uploading raw files directly to Amazon S3:
    1. Client triggers raw video uploads via selection inputs.
    2. Sends size parameters to `POST /content/upload-url` and receives a secure pre-signed write URL.
    3. Triggers binary upload streams (`method: 'PUT'`) with an active progress indicator.
    4. Upon completion, dispatches `POST /content/{assetId}/publish` to initiate processing.
*   **State Watchers:** Displays active processing indicators while listening for `content:transcribing` and `content:generation_complete` triggers via WebSockets.

#### C.3 API Utilization Blueprint
*   **Route `POST /content/upload-url` (JWT):**
    *   *Payload:* `{ "fileName": "stream_clip.mp4", "mimeType": "video/mp4", "fileSize": 52428800 }`
    *   *Validations:* Target file size (1 to 104,857,600 bytes). Free plans have a daily limit of 20 uploads (returns `403` with `InvalidPlanException` if exceeded).
    *   *Response:* `{ "uploadUrl": "https://s3.amazonaws.com/...", "assetId": "uuid" }`
*   **Route `POST /content/{id}/publish` (JWT):**
    *   *Payload:* Empty request body. Triggers the moderation and feed projection workflows for a draft and returns `{ "id": "uuid", "status": "publishing" }`.

#### C.4 Backend Migration Path
*   **Video Processing Lifecycle States:** Tracks content status transitions: `draft` -> `processing` -> `publishing` -> `published` / `moderation_rejected`.
*   **Data Models:**
    ```sql
    CREATE TABLE content_assets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      title VARCHAR(200) DEFAULT '',
      description TEXT DEFAULT '',
      status VARCHAR(30) DEFAULT 'draft', -- 'draft', 'processing', 'publishing', 'published', 'moderation_rejected'
      content_type VARCHAR(10) DEFAULT 'clip', -- 'clip' | 'image'
      storage_key VARCHAR(512),
      thumbnail_url VARCHAR(2048),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_content_user ON content_assets(user_id);
    CREATE INDEX idx_content_status ON content_assets(status);
    ```

#### C.5 Packages, Plugins, & Best Practices
*   **Dependencies:** `framer-motion` (interactive video timeline selectors), `@tailwindcss/aspect-ratio` (fluid media dimension tracking).
*   **Best Practices:** Utilize multipart S3 uploads for streams exceeding 20MB. Backends should verify payload variables before generating pre-signed keys to prevent unauthorized storage usage.

---

### MODULE D: Image Editor & Meme Canvas

#### D.1 Current MVP Implementation
*   **Mechanism:** Client canvas components (`Canvas-2D` contexts) render visual captions, sticker overlays, and dynamic canvas layouts directly within the browser.
*   **Storage Pipeline:** Converts rendered canvas frames into base64 characters, writing to Firebase Storage before storing references in Firestore.

#### D.2 Frontend Integration Approach
*   **Decoupled Rendering Engine:** Avoid processing high-resolution rendering resources inside the browser. The frontend tracks coordinates and caption parameters reactively, and dispatches them as JSON configurations to the NestJS cluster.
*   **Micro-status Indicators:** The workspace shows rendering progress animations, automatically refreshing the meme card layout as soon as the client receives a `content:generation_complete` WebSocket notification.

#### D.3 API Utilization Blueprint
*   **Route `POST /content/generate` (JWT):**
    *   *Payload:* `{ "prompt": "A retro cyberpunk gamer overlay", "style": "cinematic", "aspectRatio": "16:9" }`
    *   *Validations:* `prompt` (3–2000 chars); `aspectRatio` ('1:1', '16:9', '9:16'). Free plans enforce a daily generation limit of 10 writes (triggers `403` if exceeded).
    *   *Response:* `{ "jobId": "uuid", "status": "queued" }`
*   **Route `POST /content/{id}/retry-generation` (JWT):**
    *   *Description:* Retries a failed canvas rendering if the current status is `generation_failed`.

#### D.4 Backend Migration Path
*   **Image Processing Workflows:** Leverages NestJS BullMQ queues and worker threads to run headless rendering engines (such as standard node-canvas or sharp libraries) in the background.
*   **Data Models:**
    ```sql
    CREATE TABLE image_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content_id UUID NOT NULL REFERENCES content_assets(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL,
      style VARCHAR(64),
      aspect_ratio VARCHAR(16),
      node_job_id VARCHAR(128),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ```

#### D.5 Packages, Plugins, & Best Practices
*   **Dependencies:** `react-dropzone` (file drag-and-drop), `image-compressor` (compresses asset binaries locally to speed up initial transfer times).
*   **Best Practices:** Implement background canvas validation (such as size limitations and syntax checks) to prevent system memory overload from malicious payloads.

---

### MODULE E: Social Feed, Engagement, & Creator Relations

#### E.1 Current MVP Implementation
*   **Mechanism:** Subscribes directly to Firestore collection groups to fetch feeds, implementing localized `where` constraints and `orderBy` sorting.
*   **Interaction Actions:** Likes and comments write directly to Firestore databases, updating stats using counter fields.

#### E.2 Frontend Integration Approach
*   **Cursor-based Infinite Scroll:** Replaces page numbers with a cursor system to paginate items dynamically using the `nextCursor` value returned by the API.
*   **Optimistic UI Updates:** UI updates likes, comments, and engagement metrics immediately, with automatic rollback states if the corresponding network request fails.

#### E.3 API Utilization Blueprint
*   **Route `GET /feed` (JWT):**
    *   *Description:* Returns a personalized content feed.
    *   *Params:* `cursor` (optional ISO 8601 string), `limit` (max 50, default 20)
    *   *Response:* `{ "items": [FeedItemDto], "nextCursor": "ISO_string" }`
*   **Route `GET /feed/trending` (Public/JWT):**
    *   *Description:* Returns global discovery feed. Can be accessed without a token.
*   **Route `POST /content/{id}/like` (JWT - Directly on port 5003):**
    *   *Response:* `{ "contentId": "uuid", "liked": true, "likeCount": 12 }` (Idempotent: successive triggers toggle state safely).
*   **Route `POST /content/{id}/comment` (JWT - Directly on port 5003):**
    *   *Payload:* `{ "body": "Incredible streaming moment!" }`
    *   *Validations:* `body` (1–2000 chars)
*   **Route `POST /users/{id}/follow` (JWT - Directly on port 5003):** Follows a creator. Self-follows return a `400` validation error (`SelfFollowException`).

#### E.4 Backend Migration Path
*   **Data Models:**
    ```sql
    CREATE TABLE feed_engagement_likes (
      content_id UUID NOT NULL REFERENCES content_assets(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (content_id, user_id)
    );
    CREATE TABLE feed_comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      content_id UUID NOT NULL REFERENCES content_assets(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      body VARCHAR(2000) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE creator_relations_follows (
      follower_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      following_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (follower_id, following_id)
    );
    ```

#### E.5 Packages, Plugins, & Best Practices
*   **Dependencies:** `react-intersection-observer` (lazy load detections for infinite scroll lists), `date-fns` (client-side timestamp formatting).
*   **Best Practices:** Configure indexed database relationships for `follower_id` and `following_id` to maintain query performance even as creator relations grow.

---

### MODULE F: Aggregated Metrics & Analytics Dashboard

#### F.1 Current MVP Implementation
*   **Mechanism:** Renders mock charts in Recharts components using static local variables injected into `analyticsSlice`.

#### F.2 Frontend Integration Approach
*   **API Timeline Queries:** Fetches data points dynamically matching user-selected timeline filters (`7d`, `30d`, `6m`).
*   **Headless Event Tracking:** Integrates event tracking via non-blocking queries during video loads, page scrolls, and link clicks, ensuring metrics don't delay the user experience.

#### F.3 API Utilization Blueprint
*   **Route `POST /analytics/events` (JWT):**
    *   *Payload:* `{ "eventType": "VIEW", "contentId": "uuid", "occurredAt": "ISO_timestamp" }`
    *   *Validations:* `eventType` restricts values to: `VIEW`, `LIKE`, `COMMENT`, `FOLLOW`, `SHARE`, `CONTENT_PUBLISHED`.
*   **Route `GET /analytics/metrics` (JWT):**
    *   *Response:* `{ "views": 12000, "likes": 4200, "comments": 800, "followers": 300, "reach": 15000 }`
    *   *Errors:* Subscribing to Pro metrics without clean tier permissions triggers `403` with `PlanRestrictedException`.
*   **Route `GET /analytics/report/latest` (JWT):** Retrieves latest weekly aggregated summary reports.

#### F.4 Backend Migration Path
*   **TimeSeries Architecture Schema:**
    ```sql
    CREATE TABLE analytics_raw_events (
      id BIGSERIAL PRIMARY KEY,
      event_type VARCHAR(32) NOT NULL,
      content_id UUID REFERENCES content_assets(id) ON DELETE SET NULL,
      user_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
      occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_analytics_events_type_occurred ON analytics_raw_events(event_type, occurred_at);
    ```

#### F.5 Packages, Plugins, & Best Practices
*   **Dependencies:** `recharts` (custom SVG charts & timelines), `lodash.debounce` (prevents multiple tracking calls during rapid UI usage).
*   **Best Practices:** Querying thousands of raw analytics entries at runtime can impact database performance. The backend should compile reports daily and save snapshots in a separate `analytics_snapshots` table.

---

### MODULE G: Notifications & WebSockets Live Events

#### G.1 Current MVP Implementation
*   **Mechanism:** Lacks bidirectional connections or active server messaging layers. State alerts are handled locally via client timers.

#### G.2 Frontend Integration Approach
*   **Socket.IO Connection Loops:** Automatically connects to the notification namespace `/events` with automatic reconnection parameters.
*   **Pre-negotiated Handshake:** Authorizes connections during the socket handshake using Bearer headers or cookie lookups.

#### G.3 API Utilization Blueprint
*   **WebSocket Enpoints & Parameters:**
    *   *Namespace:* `ws://localhost:5006/events`
    *   *Handshake Authentication:* `{ auth: { token: "Bearer <token>" } }`
    *   *Supported Handshake Payloads:* Handshake establishes room subscription `user:{userId}`.
*   **Standard Events to Watch:**
    *   `content:processing` — Progression status bar triggers.
    *   `content:generation_complete` — Swaps local workspace layouts.
    *   `content:moderation_complete` — Triggers alert notifications if raw content fails safety checks `{ approved: false }`.
*   **Route `POST /notifications/register-token` (JWT):** Registrates standard push tokens.

#### G.4 Backend Migration Path
*   **Notification Ledgers:**
    ```sql
    CREATE TABLE notifications_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      event_name VARCHAR(128) NOT NULL,
      payload JSONB DEFAULT '{}'::jsonb,
      read_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_notifications_user_unread ON notifications_history(user_id) WHERE read_at IS NULL;
    ```

#### G.5 Packages, Plugins, & Best Practices
*   **Dependencies:** `socket.io-client` (manages connections), `sonner` (Toast alerts).
*   **Best Practices:** Implement exponential backoff for reconnection routines to avoid overloading the gateway if a microservice briefly goes offline.

---

### MODULE H: AI Creator Coach

#### H.1 Current MVP Implementation
*   **Mechanism:** Interactions are handled client-side using direct SDK prompt queries. Conversational logs are saved in an offline list inside the Redux `creatorCoachSlice`.

#### H.2 Frontend Integration Approach
*   **Server-Sent Event (SSE) Streams:** Renders assistant messages using a typewriter animation by reading Server-Sent Events (SSE) from NestJS, replacing static, slow REST queries.
*   **Subscription Enforcement:** The UI locks inputs and prompts Upgrade modals before requests are initialized if prompt quotas are reached.

#### H.3 API Utilization Blueprint
*   **Route `POST /ai-coach/chat/stream` (JWT):**
    *   *Payload:* `{ "message": "Analyze my CTR metrics", "history": [{ "role": "user", "content": "..." }] }`
    *   *Response:* Native SSE stream (delivering chunks of markdown characters sequentially).
*   **Validation:** Restricts history payloads to a max length of 10 exchanges to protect server memory boundaries.

#### H.4 Backend Migration Path
*   **Data Models:**
    ```sql
    CREATE TABLE chat_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      u_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role VARCHAR(10) NOT NULL, -- 'user' | 'model'
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ```

#### H.5 Packages, Plugins, & Best Practices
*   **Dependencies:** `react-markdown` (safe markdown and bullet parsing), `canvas-confetti` (interactive UI celebrations).
*   **Best Practices:** Safeguard backend access by validating and sanitizing chat histories before sending input to the Google GenAI SDK.

---

### MODULE I: Google Workspace Hub (Docs & Sheets Integration)

#### I.1 Current MVP Implementation
*   **Mechanism:** Direct implicit popup flows retrieve temporary scopes on the frontend, and the client directly issues API requests to `/v1/documents` and `/v4/spreadsheets`.
*   **Storage Strategy:** Credentials are saved in-memory inside custom service variables.

#### I.2 Frontend Integration Approach
*   **Secure Authorization Code Flow:** Replaces raw front-end access tokens with a secure three-step authentication process:
    1. The frontend initiates the authorization flow to display Google’s consent UI.
    2. Google redirects the user back, delivering a secure, one-time Authorization Code.
    3. The client captures the code and dispatches it upstream via `POST /workspace/auth/code-exchange`.
*   **Indirect File Exporting:** When exporting metrics or coach documents, the client initiates background requests `/workspace/export/sheets` or `/workspace/export/docs` and awaits the generated Google Drive URLs.

#### I.3 API Utilization Blueprint
*   **Route `POST /workspace/auth/code-exchange` (JWT):**
    *   *Payload:* `{ "authCode": "4/0AdQt8..." }`
    *   *Response:* `204 No Content` on successful code verification.
*   **Route `POST /workspace/export/sheets` (JWT):**
    *   *Payload:* `{ "title": "Analytics Snapshot", "sheets": [{ "name": "Overview", "headers": ["Metric", "Value"], "rows": [["Views", "12k"]] }] }`
    *   *Response:* `{ "id": "spreadsheetId", "url": "https://docs.google.com/spreadsheets/d/..." }`
*   **Route `POST /workspace/export/docs` (JWT):**
    *   *Payload:* `{ "title": "AI Coach Session Outline", "sections": [{ "heading": "Growth Pacing", "body": "...", "bullets": ["Hook under 1.6s"] }] }`
    *   *Response:* `{ "id": "documentId", "url": "https://docs.google.com/document/d/..." }`

#### I.4 Backend Migration Path
*   **Token Encryption Schemas:** Stored credentials (access and refresh tokens) must be encrypted using AES-256-GCM.
*   **Data Models:**
    ```sql
    CREATE TABLE google_workspace_credentials (
      id UUID PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
      encrypted_access_token VARCHAR(512) NOT NULL,
      encrypted_refresh_token VARCHAR(512) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE google_workspace_exports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      file_type VARCHAR(16) NOT NULL, -- 'DOC' | 'SHEET'
      google_file_id VARCHAR(128) NOT NULL,
      shared_url VARCHAR(500) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ```

#### I.5 Packages, Plugins, & Best Practices
*   **Dependencies:** `googleapis` / `@googleapis/docs` (official Node client wrappers), `@radix-ui/react-dialog` (modal wrappers).
*   **Best Practices:** Configure the backend to automatically verify token expiration dates, refreshing expired tokens over-the-air using the stored refresh token to avoid blocking user export requests.

---

## SECTION 3: Global Hybrid Cache Matrix (Redux Toolkit + Apollo Client)

This matrix outlines store allocations between client state managers (RTK) and server state managers (Apollo Client) to keep the frontend responsive:

| Business Sector Module | Primary Frontend Storage Manager | Rationale & UI Application |
| :--- | :--- | :--- |
| **Authentication Keys** | Redux Toolkit (`authSlice`) | Dynamic route protections, persistent access verification, and session refreshes. |
| **Creator Profiles** | Apollo Cache (GraphQL Queries) | Keeps profile details synchronized across layout structures. |
| **Clip Media Editor** | Redux Toolkit (`clipSlice`) | Fast tracking of timeline markers, pacing bounds, and zoom triggers. |
| **Active Sound Deck** | Redux Toolkit (`audioSlice`) | Instant volume controls, track adjustments, and mute toggles. |
| **Social Content Feed**| Apollo Cache (GraphQL Mutations)| Built-in features for paginated list manipulation and optimistic comment additions. |
| **Dashboard Metrics** | Apollo Cache (GraphQL Queries) | Fast retrieval and caching of analytical logs for Recharts components. |
| **Live Notifications** | Socket.IO WebSocket Client | Updates dashboard activity badges in real-time. |
| **Google Workspace Hub**| Redux Toolkit (`workspaceSlice`) | Controls authorization states and display overlays. |

---

## SECTION 4: Distributed Error Propagation Standard

We mandate a unified error contract across all microservice instances:

```json
{
  "statusCode": 403,
  "message": "The analytics historical breakdown is restricted to Pro Plan subscribers.",
  "correlationId": "8f86b402-73a1-4be0-80de-6f8afcc060a8",
  "code": "PAYWALL_ERR_PLAN_LIMIT",
  "timestamp": "2026-06-18T10:30:00.000Z"
}
```

*   **Error Management standard:**
    *   **Strict Error Schema Rule:** Every microservice backend error must return this structured format.
    *   **Dynamic Client Parsing:** The client checks the returned `code` (e.g. `PAYWALL_ERR_PLAN_LIMIT`) against the `i18next` localized lookup files to display helpful, contextual messages to the user depending on their active language selection.
