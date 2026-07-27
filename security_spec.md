# Security Specification for nxclip.ai

## Data Invariants
1. **User Ownership**: All user-specific data (`chats`, `analytics`, `creations`) must belong to a valid user and can only be accessed/modified by that user or an admin.
2. **Immutable Identity**: `uid` fields in documents and `userId` in related records must be immutable and match the authenticated user.
3. **Role Protection**: The `role` field in the `users` collection can only be set by admins. A user cannot elevate their own role to `admin`.
4. **Relational Integrity**: Creations and Analytics reports must reference a valid user.
5. **Timestamp Integrity**: `createdAt` and `updatedAt` must be server-validated.

## The "Dirty Dozen" Payloads (Red Team Tests)

| # | Targeted Resource | Attack Type | Payload Description | Expected Result |
|---|---|---|---|---|
| 1 | `/users/{targetId}` | Identity Spoofing | authenticated user tries to update another user's profile | PERMISSION_DENIED |
| 2 | `/users/{authId}` | Privilege Escalation | user tries to update their own `role` to 'admin' | PERMISSION_DENIED |
| 3 | `/users/{authId}` | Shadow Field Injection | user tries to inject `isVerified: true` (not in schema) | PERMISSION_DENIED |
| 4 | `/creations/{any}` | Orphaned Write | user tries to create a creation with someone else's `uid` | PERMISSION_DENIED |
| 5 | `/chats/{any}` | Path Leakage | user tries to list all chats (blanket read) | PERMISSION_DENIED |
| 6 | `/admins/{authId}` | Self-Promotion | user tries to create an entry in `/admins/` | PERMISSION_DENIED |
| 7 | `/creations/{id}` | Resource Poisoning | user tries to set a 2MB string as a `prompt` | PERMISSION_DENIED |
| 8 | `/creations/{id}` | State Shortcutting | user tries to update status to `published` without admin approval (if logic required) | PERMISSION_DENIED |
| 9 | `/analytics/{any}` | Cross-Tenant Read | user tries to view another user's analytics record | PERMISSION_DENIED |
| 10 | `/users/{authId}` | Immutable Violations | user tries to change their `uid` or `email` after creation | PERMISSION_DENIED |
| 11 | `/creations/{id}` | Type Poisoning | user tries to set `status` as a boolean instead of an enum string | PERMISSION_DENIED |
| 12 | `/creations/{id}` | Timing Attack | user tries to set `createdAt` to a future date manually | PERMISSION_DENIED |

## Test Runner (Logic Verification)
A `firestore.rules.test.ts` will be implemented to verify these constraints.
