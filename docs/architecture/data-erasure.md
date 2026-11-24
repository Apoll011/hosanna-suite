# Account and organization erasure

This document records the current deletion paths and the intended full-erasure workflow. The full workflow is not implemented yet.

## Current behavior

### Account

The Auth account page has no delete-account control, and the full Better Auth configuration does not enable `user.deleteUser`. The configured `databaseHooks.user.delete.after` hook attempts to remove the user's avatar from Supabase Storage and sends an account-deleted email after a user row is deleted by an enabled path. That hook does not implement a deletion request or coordinate cleanup across providers.

### Organization

The Auth organization data page shows a delete control to the organization owner. The owner must type the organization name, then the client calls Better Auth's `organization.delete` endpoint. Organization-owned Postgres relations use cascading foreign keys for library, service, agenda, notes, annotations, AI configuration and memory, teams, memberships, and invitations.

The current flow does not offer an export first, require recent re-authentication, or coordinate deletion in external stores. There is no organization deletion hook in `createAuth()`. The existing logo cleanup hook runs when an organization logo is removed during an update, not when the organization is deleted. Subscription rows are keyed by organization `referenceId`, without an organization foreign key, so they need explicit cleanup.

## Intended workflow

### Account deletion

1. Require the user to re-authenticate and confirm the account deletion.
2. Before deleting the account, check its organization memberships. If the user owns an organization, require an ownership transfer or deletion of that organization first. This avoids leaving an organization without an owner.
3. Delete the account and its account-scoped data from every active store, revoke sessions and push credentials, and remove the avatar.
4. Record an audit event that contains no personal data.
5. Show completion only after all required active-store deletions have succeeded. Document provider backup retention separately.

### Organization deletion

1. Require an organization owner to re-authenticate and confirm by typing the organization name.
2. Offer a complete data export before the permanent deletion confirmation.
3. Cancel the organization's Stripe subscription and delete the customer data where Stripe permits it.
4. Delete every organization-owned Postgres row, including soft-deleted data still in the trash, in a transaction where possible.
5. Delete the organization's Firestore annotation and note-signal documents, Supabase Storage logo, cached data, organization-scoped notifications, and PostHog organization properties where sent. Push-device registrations are user-scoped, so do not remove a member's device tokens solely because one organization is deleted.
6. Write a PII-free audit event and report completion only after all active stores have been handled.
7. Tell the requester how long copies may remain in provider-managed backups.

The external-store steps need provider-specific deletion behavior, credentials, and retention periods confirmed before implementation. A cross-provider deletion cannot be treated as one database transaction, so the implementation needs a durable, retryable job and a truthful partial-failure state before it can report success.

## Stores to cover

| Store | Account data | Organization data | Current evidence |
| --- | --- | --- | --- |
| Postgres | Better Auth records, preferences, notifications, push devices, user AI memory | Songs, folders, collections, services, agenda, notes, annotations, members, teams, invitations, AI settings and memory; subscription rows use the organization id as `referenceId` without a foreign key | Prisma schema and migrations |
| Supabase Storage | Avatar | Organization logo | `@hosanna/storage` tenant-scoped image adapter |
| Redis | Session and rate-limit state, caches | Organization-scoped cache entries | Configured through `REDIS_URL`; provider and key inventory need confirmation |
| Firestore | None identified | Annotation documents and note realtime signals | `apps/api/src/lib/firestore.ts` |
| Firebase Cloud Messaging | Device token / push registration | Organization notifications may be delivered to member devices; registrations belong to users, not organizations | Auth notification dispatcher |
| PostHog | User profile and analytics events | Organization-related analytics properties where sent | Studio and Auth analytics integrations |
| Stripe | Customer data only where a user is the billing contact | Customer and subscription records | Better Auth Stripe plugin; provider deletion constraints need confirmation |
| Provider backups | Account rows may appear in retained backups | Organization rows may appear in retained backups | Retention period is not recorded in this repo |

## Verification requirements

Before releasing the full workflow, verify allowed and denied authorization paths, sole-owner handling, idempotent retries, zero remaining Postgres rows for the deleted identifier, deletion of matching external documents and objects, Stripe cancellation/deletion outcomes, cache invalidation, and the documented backup retention period. Do not claim erasure succeeded while any required store is unconfirmed or still pending.
