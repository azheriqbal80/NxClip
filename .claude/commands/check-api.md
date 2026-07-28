# Check API Usage

Read `docs/api-reference.md` then audit the specified feature or file for correct API usage.

Check for:
- Correct endpoint paths (match exactly what's in the docs)
- Correct HTTP methods
- Required request fields present and correctly named
- Response fields accessed correctly (match the documented response shape)
- Errors handled via `ApiError` and surfaced with `sonner` toasts
- No direct gateway URL calls — must go through service modules in `src/services/apiClient.ts`

Report any mismatches with file path, line reference, and the correct implementation.
