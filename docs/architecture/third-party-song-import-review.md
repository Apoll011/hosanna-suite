# Third-party song import review

Checked on 2026-11-24 against the providers' published terms. This is an implementation review for follow-up with counsel, not legal advice.

## CifraClub

The [CifraClub Terms of Use](https://www.cifraclub.com.br/aviso-legal.html) say users must not use data-prospecting or similar data-extraction methods. Hosanna's `/api/cifra` route fetches provider pages from the server and extracts song content. The published terms therefore raise a direct concern for the current implementation. The import disclosure does not grant permission from CifraClub or resolve that concern.

## Ultimate Guitar

The [Ultimate Guitar Terms of Service](https://www.ultimate-guitar.com/about/tos.htm) limit access and use of content, restrict reproduction and storage, and describe personal, non-commercial access. Hosanna currently fetches and transforms provider content for import into an organization library. The terms do not establish permission for that workflow.

## Follow-up

Keep the server fetch in place per the current product decision. Before treating either provider integration as cleared, obtain legal review or written authorization and record the outcome. The import notice tells users they are responsible for their own rights and licenses; it does not replace provider permission or determine whether a fetch is allowed.
