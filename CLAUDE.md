# nxclip.ai — Claude Code Project Context

## What This Project Is
nxclip.ai is an AI-powered Creator OS for gaming creators. React 19 SPA deployed on Vercel, backed by a custom API Gateway on Google Cloud Run.

## Tech Stack
- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS v4
- **State:** Redux Toolkit (`src/store/`)
- **Routing:** React Router v7
- **Backend:** API Gateway at `https://api-gateway-216098834386.us-central1.run.app`
- **Auth:** JWT (1hr access / 30-day refresh tokens)
- **Proxy:** All browser API calls route through `/api/gateway-proxy` (handled by `server.ts` locally, `vercel.json` rewrite in production)
- **Animations:** `motion/react`
- **Icons:** `lucide-react`
- **Charts:** `recharts`
- **Toasts:** `sonner`

## Key Files to Know
| File | Purpose |
|---|---|
| `src/services/apiClient.ts` | All API service modules (identityApi, contentApi, feedApi, analyticsApi, notificationApi, coachApi) |
| `src/services/api/interceptors.ts` | Axios instance, JWT auto-refresh, 401 handling |
| `src/services/auth/authService.ts` | Token persistence (localStorage/sessionStorage) |
| `src/store/slices/authSlice.ts` | Auth Redux state |
| `src/App.tsx` | Boot sequence, auth loading, profile fetch |
| `src/components/TopBar.tsx` | Global nav + logout |
| `server.ts` | Express dev server + `/api/gateway-proxy` route |
| `vercel.json` | Vercel proxy rewrite for production |
| `docs/api-reference.md` | Full API contract — always check before implementing backend features |
| `docs/frontend-integration-guide.md` | Auth flow, error handling, onboarding rules |

## Auth Flow (Critical)
1. `identityApi.login()` → `setPersistedUser()` → `dispatch(setAuthUser())`
2. `App.tsx` profile useEffect → `identityApi.getMe()` → `dispatch(setAuthProfile())`
3. `authLoading` stays `true` until `getMe()` resolves — never set it false prematurely
4. `AuthGuard` redirects to `/onboarding` if `!profile.onboardingCompleted`

## API Rules
- **Never** call the gateway URL directly — always use service modules in `apiClient.ts`
- **Never** add `clearPersistedUser()` in component logout handlers — `identityApi.logout()` always calls it in its own `finally`
- All errors are `ApiError` objects with `{ statusCode, message, code, correlationId, timestamp }`
- Surface errors to users via `sonner` toasts

## Design System
- Dark creator-tech aesthetic — neutral graphite palette + Purple/Indigo brand accents
- Compact layouts — no excessive whitespace
- Sidebar: 240px expanded / 64px collapsed
- TopBar: 56px height
- Border radius: `rounded-lg` (buttons), `rounded-2xl` (cards)
- All styling via Tailwind utility classes — no inline styles

## Coding Standards
- Strict TypeScript — avoid `any`
- No comments unless the WHY is non-obvious
- No mock data — all integrations must be real
- Functional components with hooks only
- Always read a file before editing it

## Custom Commands
- `/audit-auth` — audit the login/logout/session flow against docs
- `/check-api` — verify a feature's API usage against `docs/api-reference.md`
- `/new-page` — scaffold a new page following project conventions
