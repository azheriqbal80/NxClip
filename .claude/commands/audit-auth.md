# Audit Auth Flow

Read `docs/frontend-integration-guide.md` and `docs/api-reference.md` then audit the following files against the docs:

- `src/App.tsx` — boot sequence, auth loading, profile fetch
- `src/pages/Login/Login.tsx` — login handler, lockout, token persistence
- `src/pages/Signup/Signup.tsx` — register handler, token persistence
- `src/components/TopBar.tsx` — logout handler
- `src/services/apiClient.ts` — identityApi methods, AuthResponseDto
- `src/services/api/interceptors.ts` — 401 auto-refresh, session expiry
- `src/services/auth/authService.ts` — token storage helpers
- `src/store/slices/authSlice.ts` — auth state shape

Report findings as a numbered list. For each finding include: file, line reference, what the bug/mismatch is, and the fix.
