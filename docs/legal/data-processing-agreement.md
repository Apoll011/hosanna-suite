# Data Processing Agreement (DPA)

**Last updated:** 2026-11-24  
**Version:** 1.0

This Data Processing Agreement ("DPA") governs the processing of personal data by Hosanna, operated by an individual proprietor ("Processor", contact: support@hosanna.live), on behalf of the customer organization ("Controller", "Church", or "Customer") in connection with the Hosanna Cloud platform, applications, and related services ("Services").

This DPA supplements and forms part of the Hosanna Terms of Service or main service agreement entered into between the Church and Hosanna. This agreement satisfies the requirements of Article 28 of Regulation (EU) 2016/679 ("GDPR") and applicable UK and Swiss data protection legislation.

---

## 1. Definitions

1. **"Applicable Data Protection Law"** means Regulation (EU) 2016/679 ("GDPR"), the UK Data Protection Act 2018 and UK GDPR, the Swiss Federal Act on Data Protection ("FADP"), and any applicable national implementing legislation.
2. **"Controller"**, **"Processor"**, **"Data Subject"**, **"Personal Data"**, **"Personal Data Breach"**, and **"Processing"** have the meanings given in Article 4 of the GDPR.
3. **"Special Categories of Personal Data"** means personal data revealing racial or ethnic origin, political opinions, religious or philosophical beliefs, or trade union membership, and genetic data, biometric data, data concerning health, or data concerning a natural person's sex life or sexual orientation, as defined in Article 9(1) of the GDPR.
4. **"Sub-processor"** means any third-party processor engaged by Hosanna to process Customer Personal Data in connection with the Services.
5. **"Customer Personal Data"** means any Personal Data processed by Hosanna on behalf of the Church under or in connection with the Services.
6. **"Standard Contractual Clauses" ("SCCs")** means the European Commission's standard contractual clauses for the transfer of personal data to third countries pursuant to Regulation (EU) 2016/679, approved by Commission Implementing Decision (EU) 2021/914.

---

## 2. Roles, Scope, and Details of Processing

### 2.1 Roles of the parties

The parties acknowledge and agree that:
- The Church is the **Controller** of Customer Personal Data.
- Hosanna is the **Processor** acting on the Church's documented instructions.

### 2.2 Subject matter of processing

Hosanna provides cloud-based worship planning, liturgy management, music library administration, team scheduling, and church collaboration software.

### 2.3 Duration of processing

The processing continues for the duration of the Church's subscription and active account, plus the post-termination retention and data-deletion period described in Section 9.

### 2.4 Nature and purpose of processing

Hosanna processes Customer Personal Data exclusively to:
- Provide, maintain, host, synchronize, and support the Services.
- Enable user authentication, session security, and access control.
- Enable worship team scheduling, roster coordination, service planning, and song annotations.
- Deliver transactional service notifications, event alerts, and system updates requested by the Church.

### 2.5 Categories of data subjects

- Church leaders, pastors, administrators, and staff.
- Worship leaders, musicians, vocalists, and choir members.
- Audio, video, lighting, projection, and technical volunteers.
- Church members, attendees, and invited guest participants.

### 2.6 Types of personal data

The Customer Personal Data processed may include:
- **Identification and contact details:** Full name, email address, telephone number, display name, and profile avatar.
- **Church role and administrative data:** Assigned teams, ministry positions, skill sets, scheduling availability, blockout dates, and attendance records.
- **Service planning content:** Service notes, rehearsals, setlists, song arrangements, annotations, and run-sheet assignments.
- **Authentication and account data:** User identifiers, hashed credentials, two-factor authentication records, session tokens, audit logs, and IP addresses.

---

## 3. Special Category Data (Religious Beliefs, GDPR Art. 9)

### 3.1 Acknowledgment of special category data

The parties acknowledge that personal data submitted to the Services in the context of church operations, worship teams, ministry rosters, service notes, and participation records may reveal religious or philosophical beliefs under Article 9(1) of the GDPR.

### 3.2 Church confirmation of lawful basis

The Church, as Controller, represents and warrants that:
1. It maintains a valid lawful basis under Applicable Data Protection Law to collect and process such data, including Article 9(2)(d) of the GDPR (processing carried out in the course of legitimate activities by a foundation, association, or other not-for-profit body with a religious or philosophical aim, concerning members, former members, or persons in regular contact), or Article 9(2)(a) (explicit consent of the data subject).
2. Appropriate disclosures have been made to data subjects informing them that their details and participation in church services are stored within church management and worship software.
3. The Church will not use the Services to process special category data outside the scope of its legitimate church or ministry activities.

---

## 4. Processor Obligations

Hosanna covenants and agrees to comply with the following obligations pursuant to GDPR Article 28(3):

### 4.1 Documented instructions (Art. 28(3)(a))

Hosanna shall process Customer Personal Data only on documented instructions from the Church, including with regard to transfers of personal data to a third country or an international organization, unless required to do so by European Union or Member State law to which Hosanna is subject. In such a case, Hosanna shall inform the Church of that legal requirement before processing, unless that law prohibits such information on important grounds of public interest.

The main agreement, the Church's configuration of the Services, and instructions submitted via Hosanna application user interfaces and APIs constitute the complete documented instructions.

### 4.2 Confidentiality (Art. 28(3)(b))

Hosanna shall ensure that persons authorized to process the Customer Personal Data have committed themselves to confidentiality or are under an appropriate statutory obligation of confidentiality. Access to Customer Personal Data by Hosanna personnel is restricted to personnel who require access to maintain, troubleshoot, or operate the Services.

### 4.3 Security of processing (Art. 28(3)(c), Art. 32)

Hosanna shall implement and maintain appropriate technical and organizational measures to ensure a level of security appropriate to the risk, as set forth in Annex I (Technical and Organizational Security Measures). These measures include:
- TLS 1.3/1.2 encryption in transit for all web, API, and WebSocket connections.
- AES-256 encryption at rest for database storage and object stores.
- Strict logical tenant isolation enforced at the database query layer (`forOrganization(orgId)`), preventing cross-organization data leakage.
- Role-Based Access Control ("RBAC") separating owner, admin, and member privileges.
- Two-factor authentication ("2FA") support for user accounts.
- Automated rate limiting, denial-of-service protection, and security logging.

### 4.4 Assistance with data subject rights (Art. 28(3)(e))

Taking into account the nature of the processing, Hosanna shall assist the Church by appropriate technical and organizational measures, insofar as this is possible, for the fulfilment of the Church's obligation to respond to requests for exercising the data subject's rights laid down in Chapter III of the GDPR (including rights of access, rectification, erasure, restriction, objection, and data portability).

Hosanna provides self-service features in the Services enabling the Church to view, edit, export, and delete member profiles, rosters, and planning data. If a data subject contacts Hosanna directly regarding their data, Hosanna shall prompt the data subject to contact the Church directly, unless prohibited by law.

### 4.5 Security incident and breach notification (Art. 28(3)(f), Art. 33)

Hosanna shall notify the Church without undue delay, and in any event within 48 hours, after becoming aware of a confirmed Personal Data Breach affecting Customer Personal Data.

The notification shall contain, to the extent known:
1. A description of the nature of the Personal Data Breach, including the categories and approximate number of data subjects and records concerned.
2. The name and contact details of Hosanna's contact point (support@hosanna.live).
3. The likely consequences of the breach.
4. The measures taken or proposed to be taken by Hosanna to address the breach, including mitigation measures.

Hosanna shall cooperate with the Church and provide reasonable assistance in fulfilling the Church's obligations under GDPR Articles 33 and 34.

### 4.6 Deletion or return of personal data (Art. 28(3)(g))

Upon termination or expiry of the Services, Hosanna shall, at the choice of the Church, delete or return all Customer Personal Data to the Church, and delete existing copies, unless applicable European Union or Member State law requires continued storage.

The Church may trigger automated data export and permanent deletion through the organization settings interface. Permanent deletion removes active database records, storage assets, and caches. Provider-managed backups are purged in accordance with standard backup rotation cycles (not exceeding 30 days).

### 4.7 Audits and compliance demonstrations (Art. 28(3)(h))

Hosanna shall make available to the Church all information reasonably necessary to demonstrate compliance with the obligations laid down in Article 28 of the GDPR.

Hosanna shall allow for and contribute to audits, including inspections, conducted by the Church or an independent auditor mandated by the Church, subject to reasonable advance written notice (minimum 30 calendar days), mutual agreement on scope, and appropriate confidentiality undertakings. The Church shall bear the costs of any such audit unless the audit reveals a material breach of this DPA by Hosanna.

---

## 5. Sub-processors

### 5.1 General authorization

The Church grants Hosanna general written authorization to engage Sub-processors to support the operation of the Services.

### 5.2 Current sub-processors

Hosanna's approved Sub-processors are published and maintained at:  
`https://hosanna.live/legal/subprocessors` (and documented in Annex II).

### 5.3 Notification of changes and right to object

1. Hosanna shall provide the Church with at least 30 days' advance notice of any intended appointment of a new Sub-processor or replacement of an existing Sub-processor, via in-app notification, email to the organization owner, or public feed subscription.
2. The Church may object to the appointment of a new Sub-processor on reasonable data protection grounds by notifying Hosanna in writing within 14 days of receiving notice.
3. If the Church objects and the parties cannot reach a mutually agreeable resolution within 30 days of the objection, the Church may terminate the affected Services without penalty, with a pro-rata refund of any prepaid fees for the remaining term.

### 5.4 Sub-processor obligations

Hosanna enters into a written agreement with each Sub-processor imposing data protection terms that offer at least the same level of protection for Customer Personal Data as those set out in this DPA. Hosanna remains fully liable to the Church for the performance of the Sub-processor's obligations.

---

## 6. International Data Transfers

### 6.1 Processing locations

Hosanna prioritizes processing within the European Economic Area ("EEA"). Primary application compute is hosted in Paris, France (`eu-west-3`), primary relational database and storage in Ireland (`eu-west-1`), and product analytics in Frankfurt, Germany.

### 6.2 Transfer mechanisms

If Customer Personal Data is transferred outside the EEA, the UK, or Switzerland to a country that has not received an adequacy decision from the European Commission (or UK/Swiss competent authority), the transfer shall be governed by:
1. The EU Standard Contractual Clauses (Commission Implementing Decision (EU) 2021/914), Module 2 (Controller-to-Processor) or Module 3 (Processor-to-Subprocessor), which are hereby incorporated into this DPA by reference.
2. For transfers originating in the United Kingdom, the UK International Data Transfer Addendum to the EU Commission Standard Contractual Clauses.
3. For transfers originating in Switzerland, the Swiss Addendum to the EU Standard Contractual Clauses.

---

## 7. Acceptance, Records, and Enforceability

### 7.1 Electronic acceptance

This DPA is accepted electronically by an authorized representative of the Church through one of the following methods:
1. Selecting the DPA acceptance checkbox during organization creation.
2. Confirming DPA acceptance during subscription checkout or onboarding.
3. Explicit confirmation in Organization Settings.

### 7.2 Stored acceptance record

Upon acceptance, Hosanna automatically records and binds the agreement to the Church's organization record, storing:
- Organization Identifier (`orgId`) and Church Legal/Operating Name.
- User Identifier and name of the accepting administrator (`acceptedByUserId`).
- UTC timestamp of acceptance (`acceptedAt`).
- DPA document version code (`dpaVersion`).
- Signatory IP address and browser user-agent.

### 7.3 Inspection and record in organization settings

An organization administrator may at any time view the current DPA text, agreement version, accepting administrator, and acceptance timestamp directly within Organization Settings. The interface allows standard browser printing of the agreement and its recorded execution details for legal compliance records.

---

## Annex I: Technical and Organizational Security Measures (TOMs)

Pursuant to GDPR Article 32, Hosanna maintains the following technical and organizational security measures:

1. **Access control and authentication:**
   - Multi-tenant isolation at the application and query layer: all domain queries enforce `forOrganization(orgId)`.
   - Role-Based Access Control (RBAC) governing organization permissions (`owner`, `admin`, `member`).
   - Strong password policies and two-factor authentication (TOTP 2FA) support.
   - Session tokens stored securely with HTTP-only, SameSite cookies and cryptographically signed session IDs.
2. **Data encryption:**
   - Data in transit: Transport Layer Security (TLS 1.2 and TLS 1.3) with modern cipher suites for all HTTPS and WebSocket endpoints.
   - Data at rest: Relational database tables, backups, and object storage buckets are encrypted using AES-256.
   - Provider BYOK API keys: Encrypted using authenticated encryption prior to database storage.
3. **Availability, resilience, and business continuity:**
   - Hosted on high-availability cloud infrastructure with automated multi-zone failover.
   - Point-in-time recovery and daily encrypted database backups.
   - Continuous uptime monitoring and automated alert mechanisms.
4. **Vulnerability management and software security:**
   - Automated dependency vulnerability scanning in CI/CD pipelines.
   - Regular security audits, code reviews, and principle of least privilege for cloud service access.
   - Rate limiting and abuse detection at the edge to mitigate brute-force and denial-of-service attacks.
5. **Organizational measures:**
   - Confidentiality agreements signed by all employees, contractors, and operators with infrastructure access.
   - Principle of least privilege applied to operational access to production databases.
   - Internal security guidelines and incident response procedure.

---

## Annex II: Authorized Sub-processors

The following Sub-processors are authorized as of the date of this agreement:

| Provider | Purpose | Data processed | Configured region | Transfer mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Vercel Inc.** | Application compute, edge routing, and serverless hosting | Account, organization, authentication, and HTTP request logs | `cdg1` (`eu-west-3`), Paris, France | EU-US Data Privacy Framework / SCCs |
| **Supabase Inc.** | Primary Postgres database, real-time sync, and object storage | Customer organization data, songs, rosters, service plans, member records, and uploaded logos | `eu-west-1`, Ireland | EU-US Data Privacy Framework / SCCs |
| **PostHog Inc.** | Privacy-friendly product analytics and usage metrics | User IDs, organization IDs, and anonymized feature usage events | EU Cloud, Frankfurt, Germany | Direct EU hosting / SCCs |
| **Redis Cloud (Redis Inc.)** | Authentication cache, session stores, and rate-limiting counters | Transient session tokens, rate-limit keys, and cache entries | `eu-west-3`, Paris, France | EU-US Data Privacy Framework / SCCs |
| **Stripe Payments Europe, Ltd.** | Billing and payment processing for paid subscriptions | Customer billing contact name, email, billing address, and transaction metadata | Ireland / Global | Direct EU entity / SCCs |

The authoritative live list of Sub-processors is maintained at: `https://hosanna.live/legal/subprocessors`.
