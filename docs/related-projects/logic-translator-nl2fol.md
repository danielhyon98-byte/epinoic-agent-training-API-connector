# Related project: Logic Translator (NL2FOL-inspired Z3 engine)

Repository supplied by the user mid-session:
`https://github.com/danielhyon98-byte/https-github.com-lovishchopra-NL2FOL`
(read at commit `361cc4e`, branch default, shallow clone, read-only).

## What it is

Epinoic AI's "Logic Translator and Z3 Verification Engine" (Python). It checks
specialist reports structurally, has a model propose a typed logic problem for
eligible claims, and decides consistency and entailment with Z3. Every result carries
a scope statement: a result proves a property of its encoding, never that a claim is
true. The README says nothing in it is deployed and that it does not run inside a
Cloudflare Worker.

## Licence

- `LICENSE`: "Copyright (c) 2026 Epinoic AI. All rights reserved. … proprietary and
  confidential. No part of this repository may be used, copied, modified, merged,
  published, distributed, sublicensed or sold without the prior written permission
  of Epinoic AI."
- `THIRD_PARTY_NOTICES.md`: Z3 is used as an unmodified dependency (MIT, Microsoft).
  The upstream NL2FOL project (Lovish Chopra et al., arXiv:2405.02318, MIT licence)
  is credited as **design inspiration only**. No NL2FOL code, prompt text or data is
  included there.

Consequences for this repository:

- No code, prompt or document from the translator was copied here. Only facts about
  the roster and subject concerns were noted, with this page as the record.
- The translator repository is publicly cloneable even though its licence says
  "confidential". If that is not intended, make it private.

## Is it needed for the agents now?

**Not for this slice.** All three coordination handoffs defer Z3, claim extraction,
`/v1/outcomes` calls and formal-check badges. No translator dependency, call or
claim field is added here. `claims` stays `null` in runtime results.

It was still useful in two ways:

1. **The specialist roster.** Its `docs/ARENA_RESULTS.md` (round 7) lists sixteen
   specialist agents across fifteen IB subjects: English A: Literature (two agents),
   English A: Language and Literature, History, Economics, Business Management,
   Psychology, Geography, Language B: Spanish, Computer Science, Physics, Chemistry,
   Biology, Environmental Systems and Societies, Mathematics: Analysis and
   Approaches, Mathematics: Applications and Interpretation. `agents/agents.json`
   uses this roster. Folder slugs other than the six named in the handoffs are
   provisional, because the knowledge-base repository could not be read.
2. **The subject integrity concerns.** Its branch packs check quotation integrity
   in literature, chronology and dated figures in History, study attributions in
   Psychology, elasticity arithmetic in Economics, margins in Business Management,
   and written arithmetic, substitutions, units and balances in the STEM subjects.
   The supplementary knowledge documents tell each specialist to write in a way
   that makes those checks possible: verbatim quotations only from supplied text,
   explicit dates, named studies, shown working with units. This makes later
   integration easier but does not implement it.

## Where it would fit later

The translator's own docs place it on the path between router and specialists (a
"channel" that envelopes requests and checks responses). That is a later, separately
reviewed integration owned by the translator and website owners. The runtime here
returns `claims: null` and a provenance record, which a later channel could wrap
without changing this package's accepted-answer rules.
