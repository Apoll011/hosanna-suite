# Improvements, bugs, and TODOs

Living backlog from an architecture pass across all Hosanna repos.

**Suggested remaining order:** Firestore annotation ACL (#3) → Redis/Upstash global rate limits.

See also: [deploy-report.md](./deploy-report.md).

---

## Still open

### Critical / High

### 3. Firestore annotations / note pings are world-readable

|           |                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| **Where** | `Hosanna-server/firestore.rules` (`allow read: if true`); optional inline canvas in `src/lib/firestore.ts`     |
| **Why**   | Anyone who knows IDs can read annotation payloads.                                                             |
| **Fix**   | Firebase Auth custom tokens + `request.auth`, or metadata-only Firestore + authenticated API for canvas bytes. |

---

## Low / polish (remaining)

| Item                                     | Where                | Notes                                       |
| ---------------------------------------- | -------------------- | ------------------------------------------- |
| Coming-soon feature UI                   | Studio `FeaturesTab` | Left as product tracking (not in this pass) |
| Android `google-services.json` committed | Flutter              | Restrict/rotate API keys in GCP             |
| Studio/server patch skew                 | 2.22.3 vs 2.22.2     | Major.minor aligned; patch need not match   |

---

## Nice-to-have

1. Idempotent backup policy for annotations/notes
2. Flutter offline song edits using `mark*Dirty`
3. Golden tests Dart ChordPro ↔ `@hosanna/chordpro`
4. Redis/Upstash global rate limits on Vercel
5. Enable blog GTM with a real container ID
6. E2E smoke: auth → org → sync → open song
