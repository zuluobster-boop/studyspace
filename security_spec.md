# Security Architecture Specification (`security_spec.md`)

## 1. Data Invariants
1. **Identity & Privilege Escalation Guard**: Standard users registering in `/users/{userId}` can only create a profile with `role == 'member'` and `status == 'pending'`, UNLESS their verified email matches the bootstrapped Supreme Admin (`zuluobster@gmail.com`), who may initialize `role == 'supreme_obster'` and `status == 'approved'`.
2. **Multi-Tiered Hierarchy Enforcement**:
   - `supreme_obster` ("Obster"): Can update any user's role/status and delete any user (including `supreme_kunda5`).
   - `supreme_kunda5` ("Kunda5"): Can approve/reject/renew members and upload materials/videos/courses, and delete non-Obster members, but is strictly forbidden from deleting or demoting a user whose `role == 'supreme_obster'`.
   - `admin` ("Admin / Tutor"): Can create/update courses, PDF materials, and tutorial videos, and answer student assignment questions, but cannot change user roles or delete user accounts.
   - `member` ("Ordinary Member"): Can read courses, materials, videos, and discussions ONLY when their `/users/$(request.auth.uid)` document has `status == 'approved'`.
3. **PII Split Collection Isolation**: All user PII (`email`, `phone`, `passwordHash`) is strictly isolated inside `/users/{userId}/private/{docId}` (`docId == 'info'`) and is readable ONLY by the document owner (`request.auth.uid == userId`) or verified administrators (`isAnyAdmin()`).
4. **Private Q&A Routing**: Assignment questions in `/questions/{questionId}` can only be read (`get`/`list`) by the student who submitted them (`resource.data.studentId == request.auth.uid`) or by an administrator.
5. **Temporal & Structural Integrity**: Every document write enforces `hasAll` and `hasOnly` key allowlists, strict string `.size()` limits matching `firebase-blueprint.json`, regex validation on IDs, and `request.time` equality on `createdAt`/`updatedAt`.

## 2. The "Dirty Dozen" Payloads
1. **Self-Assigned Supreme Admin**: A standard authenticated user attempts to create `/users/{uid}` with `role: "supreme_obster"` and `status: "approved"`.
2. **Shadow Field Injection on User Profile**: A user attempts to create `/users/{uid}` with an extra unapproved field `isVerifiedAdmin: true`.
3. **Kunda5 Removing Obster**: A user with `role: "supreme_kunda5"` attempts to `delete` or demote a user document where `existing().role == "supreme_obster"`.
4. **Admin/Tutor Role Escalation**: A user with `role: "admin"` (Tutor) attempts to update `/users/{otherUid}` to approve or revoke membership.
5. **PII Lateral Scraping**: Authenticated student `userA` attempts `get(/users/userB/private/info)` to steal `phone` and `email`.
6. **Unapproved Member Resource Read**: A registered user with `status: "pending"` or `status: "expired"` attempts to read `/materials/{materialId}` or `/videos/{videoId}`.
7. **ID Poisoning Attack**: An attacker attempts to create a document with a 2,000-character ID or special path characters.
8. **Value Poisoning on Update**: An admin updates a question's `answerText` with a boolean `true` or a 100,000-character string exceeding `maxLength: 4000`.
9. **Student Answering Own Question**: A student attempts to update `/questions/{qId}` to set `status: "answered"` and `answerText: "Full marks"`.
10. **Cross-Student Question Snooping**: Student `userA` runs a `list` query on `/questions` without filtering `studentId == request.auth.uid`.
11. **Timestamp Forgery**: A client attempts to create a course or question with a backdated `createdAt` timestamp instead of `request.time`.
12. **Identity Spoofing on Question Submission**: Student `userA` creates a question in `/questions/{qId}` setting `studentId: "userB"`.
