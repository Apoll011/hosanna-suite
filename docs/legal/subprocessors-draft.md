# Subprocessors

**Last updated:** 2026-11-24

Hosanna uses the following subprocessors to provide and operate Hosanna Cloud.

| Provider | Purpose | Personal data processed | Configured region |
| --- | --- | --- | --- |
| Vercel | Hosts the Hosanna Auth and API applications and their server functions | Account, organization, authentication, request, and operational data handled by those applications | `cdg1` (`eu-west-3`), Paris, France |
| Supabase | Hosts the primary database and private object storage | Account, organization, membership, library, service, agenda, and settings data; avatar and organization logo files | `eu-west-1`, Ireland |
| PostHog | Product analytics for Studio and Auth | User and organization identifiers and product usage events | EU Cloud, Frankfurt, Germany |
| Redis Cloud | Authentication secondary storage, rate limits, and application caches | Session state, rate-limit state, and cache entries | `eu-west-3`, Paris, France |

The regions above describe Hosanna's configured application, database, analytics, and Redis locations. They do not mean that every provider operation, support process, network delivery, or provider-side subprocessor is restricted to that location. The providers' data-processing terms govern their additional processing and any applicable international data transfers.
