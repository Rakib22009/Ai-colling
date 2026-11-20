# Security Specification — LinguaConnect AI

## 1. Data Invariants
1. **Identity Integrity**: Every user-owned document (`users/{uid}`, `publicProfiles/{uid}`, `userSettings/{uid}`) must match `request.auth.uid == uid` on writes and enforce `request.auth.token.email_verified == true`.
2. **PII Isolation**: Private email addresses live exclusively in `users/{uid}` (strictly owner-only read/write). Strangers resolve friends via deterministic SHA-256 hashes in `emailIndex/{emailHash}` with `allow list: if false`.
3. **Immutable Ownership & Timestamps**: `createdAt`, `uid`, `fromUid`, `callerUid`, and `calleeUid` cannot be reassigned after creation. All `createdAt` / `updatedAt` timestamps must equal `request.time`.
4. **Terminal State Locking**: Once a `friendRequests` document leaves `pending` (`accepted` or `rejected`), or a `calls` document reaches `ended`, `missed`, or `rejected`, status transitions are locked.
5. **Participant-Only Queries**: `allow list` on `friendRequests`, `friendships`, `notifications`, and `calls` strictly requires `resource.data` to match `request.auth.uid`.

## 2. Dirty Dozen Adversarial Payloads
1. **Cross-User Profile Overwrite**: Authenticated User B attempts `set` on `publicProfiles/{userA}` -> `PERMISSION_DENIED`.
2. **PII Scraping**: Authenticated User B attempts `list` on `users` or `get` on `users/{userA}` -> `PERMISSION_DENIED`.
3. **Email Index Enumeration**: Authenticated User B attempts `list` on `emailIndex` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection**: User A creates `users/{userA}` with an extra `{ isAdmin: true }` field -> `PERMISSION_DENIED`.
5. **Handle Hijacking**: User B attempts to overwrite an existing `handles/{existingHandle}` with `uid: userB` -> `PERMISSION_DENIED`.
6. **Spoofed Friend Request**: User B creates `friendRequests/{id}` with `fromUid: userA` -> `PERMISSION_DENIED`.
7. **Unauthorized Request Acceptance**: Sender User A updates `friendRequests/{id}` to `status: 'accepted'` without being `toUid` -> `PERMISSION_DENIED`.
8. **Terminal Request Re-open**: Recipient User B changes `friendRequests/{id}` from `accepted` back to `pending` -> `PERMISSION_DENIED`.
9. **Notification Forgery**: User B creates `notifications/{id}` with `fromUid: userA` -> `PERMISSION_DENIED`.
10. **Other User Notification Read**: User B reads `notifications/{id}` where `toUid == userA` -> `PERMISSION_DENIED`.
11. **Call Record Hijack**: User C updates `calls/{callAB}` where neither `callerUid` nor `calleeUid` is `userC` -> `PERMISSION_DENIED`.
12. **Resource Poisoning & Timestamp Forgery**: User A submits `bio` > 280 chars or client-forged `createdAt` != `request.time` -> `PERMISSION_DENIED`.
