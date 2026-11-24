# Account and organization erasure

This document records the implemented account and organization deletion flows and store coverage.

## Account deletion

- UI: `AccountPage` (`/account`) includes a Danger Zone with a deletion modal.
- Sole-owner guard: `GET /api/erasure/account` and `POST /api/erasure/account` check if the user is the sole owner of any organization. If so, deletion is blocked (`409`) and the UI links to organization member management to transfer ownership or delete the organization first.
- Re-authentication: `POST /api/erasure/otp` (`kind: "account"`) sends a dedicated 6-digit email OTP (`deletion-otp` template) stored hashed in `Verification` with a 10-minute TTL.
- Execution (`eraseAccount`): revokes Better Auth sessions (Redis + Postgres), deletes OAuth tokens/consents/clients and verification rows, deletes the `User` row (cascading sessions, accounts, 2FA, push devices, notifications, notification preferences/deliveries, AI memory, and reminder dispatches; setting `null` on `OrganizationAgreement.acceptedByUserId`, `ServiceNote.authorId`, `ServiceSongAnnotation.updatedById`), removes the user avatar from Supabase Storage, and sends the `account-deleted` confirmation email.
- Backup notice: the confirmation modal informs users that encrypted provider backups may retain copies for up to 30 days.

## Organization deletion

- UI: `OrgDataPage` (`/account/organization/data`) requires the owner to download a backup export (`/api/backup`) before unlocking the delete action, then verify identity via a dedicated 6-digit email OTP (`org-deletion-otp` template), and confirm by typing the organization name.
- Execution (`eraseOrganization`, `POST /api/erasure/organization`):
  1. Cancels any active Stripe subscription immediately (`stripe.subscriptions.cancel`). Stripe Customer records are retained per Stripe terms.
  2. Detaches `OrganizationAgreement` (DPA) rows by copying `organizationId` into `deletedOrgId` and setting `organizationId = null` so legal consent records survive deletion without a live FK.
  3. Deletes `Subscription` (`referenceId`), `Notification` (`organizationId`), OAuth rows (`referenceId`), and erasure verification rows.
  4. Deletes the `Organization` row; Postgres cascades wipe songs, folders, collections, services, agenda events (including soft-deleted rows in trash), service notes, annotations, AI config/memory, teams, memberships, and invitations.
  5. Deletes the organization logo from Supabase Storage and sends the `org-deleted` confirmation email to the owner.

## Stores and scope

| Store | Account deletion | Organization deletion |
| --- | --- | --- |
| Postgres | User row + cascaded user tables + OAuth/verification rows | Organization row + cascaded tenant tables + Subscription + Notification + OAuth/verification rows; `OrganizationAgreement` detached and retained |
| Supabase Storage | Avatar deleted | Organization logo deleted |
| Redis | Sessions revoked via Better Auth | Self-expiring cache keys left to expire |
| Stripe | Not applicable (billing is org-scoped) | Subscription canceled immediately; Customer retained |
| Firestore / PostHog / FCM | PushDevice rows cascaded in Postgres; FCM tokens expire naturally; Firestore and PostHog untouched | Untouched |
| Provider backups | Encrypted backups may retain copies for up to 30 days | Encrypted backups may retain copies for up to 30 days |
