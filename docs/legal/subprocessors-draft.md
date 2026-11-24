# Subprocessor list draft

**Status:** draft for deployment and contract verification. Do not publish as the live Hosanna Cloud list until every region and transfer mechanism below has been confirmed against production accounts and provider terms.

**Draft date:** 2026-11-24

This inventory is based on the integrations documented in this repository. A provider appearing here does not prove that it is enabled in production. Optional, customer-selected AI providers are listed separately.

## Hosanna Cloud providers

| Provider | Purpose | Data processed | Production location | Transfer mechanism |
| --- | --- | --- | --- | --- |
| Supabase | Primary Postgres database and private object storage for avatars and organization logos | Account, organization, membership, library, service, agenda, and settings records; avatar and logo files | Confirm database and storage project regions | Confirm project terms and applicable adequacy decision or SCCs |
| Vercel | Auth and API hosting, cron execution, and application logs | Request and authentication data, account and organization data handled by the hosted applications, operational logs | Confirm deployment regions and log retention | Confirm applicable Vercel terms, region, and safeguards |
| Cloudflare | Static asset delivery and Turnstile | Request metadata, IP and challenge signals; static assets | Confirm account configuration and processing regions | Confirm applicable Cloudflare terms and safeguards |
| Redis provider configured by `REDIS_URL` | Better Auth secondary storage, rate limits, and application caches | Session and rate-limit state, cache entries | Identify the production vendor, account, and region | Confirm provider contract and applicable safeguards |
| Stripe | Subscription billing and payment processing | Customer and organization identifiers, billing contact, subscription and transaction metadata | Confirm Stripe account region and applicable payment-processing locations | Confirm Stripe data-transfer terms and safeguards |
| Resend | Transactional authentication, organization, and billing email | Recipient addresses, message content, delivery metadata | Confirm account region and processing locations | Confirm Resend data-processing terms and safeguards |
| Firebase / Google Cloud | Push delivery and Firestore realtime signals | Push tokens, notification payloads, annotation and note signal documents | Confirm Firebase project region and each service's data location | Confirm applicable Google Cloud terms and safeguards |
| PostHog | Product analytics for Studio and Auth | User and organization identifiers, analytics events, and configured session replay data | Confirm project host, region, and retention settings | Confirm project contract and applicable safeguards |
| Better Auth Infra | Sentinel bot and abuse protection | Authentication and request risk signals | Confirm service region and retention | Confirm service terms and applicable safeguards |
| Google | Social sign-in | OAuth identity and account profile data returned to Hosanna | Confirm applicable Google identity processing locations | Confirm Google terms and safeguards |

## Customer-selected AI providers

Churches may configure their own OpenAI, Anthropic, Google, or DeepSeek API credentials. When enabled, prompts and selected organization content are sent to that provider for the requested AI operation. Confirm and describe this separately from Hosanna-selected infrastructure subprocessors, including the customer's role in selecting the provider and the provider's terms.

## Publication checklist

- Confirm which candidate providers are enabled in production and remove unused entries.
- Confirm each account's configured region, data residency controls, logs, and retention.
- Confirm the applicable data-processing terms, adequacy decisions, and SCCs with counsel.
- Publish this list at `hosanna.live/subprocessors` with a version history and last-updated date.
- Decide how organization owners receive change notices and document that process in the DPA.
