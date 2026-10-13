# Agents: handoffs, model assignment and supplementary knowledge

One folder per Epinoic subject specialist (16 in total). These are the
**fallback deliverable**: no agent could be put live on an API in this session.
There were no API keys, the knowledge-base and website repositories were
unreachable, and the coordination handoffs do not authorise paid calls or
enablement. See `../docs/STATUS-AND-ACCESS.md`.

## The roster

`agents.json` lists the sixteen specialists from the Logic Translator's round-7
roster (fifteen IB subjects, two English A: Literature agents). Six slugs appear
verbatim in the coordination handoffs: `history`, `english-a-literature`,
`english-a-lang-lit`, `english-specialist`, `mathematics-aa` and `mathematics-ai`.
The other ten are **provisional** and must be replaced with the real
`knowledge-bases/<folder>` names.

| Slug | Specialist | Slug source | Pilot |
| --- | --- | --- | --- |
| `history` | History | handoff | **yes** |
| `english-a-literature` | English A: Literature | handoff | no |
| `english-a-lang-lit` | English A: Language and Literature | handoff | no |
| `english-specialist` | English specialist (scope unverified) | handoff | no |
| `mathematics-aa` | Mathematics: Analysis and Approaches | handoff | no |
| `mathematics-ai` | Mathematics: Applications and Interpretation | handoff | no |
| `economics` | Economics | provisional | no |
| `business-management` | Business Management | provisional | no |
| `psychology` | Psychology | provisional | no |
| `geography` | Geography | provisional | no |
| `spanish-b` | Language B: Spanish | provisional | no |
| `computer-science` | Computer Science | provisional | no |
| `physics` | Physics | provisional | no |
| `chemistry` | Chemistry | provisional | no |
| `biology` | Biology | provisional | no |
| `ess` | Environmental Systems and Societies | provisional | no |

## Which model each agent uses: a proposal

`model-assignment.json` is the single place where model choices live.

- **Primary for all 16: Claude Haiku 5.5** (`claude-haiku-5-5`). This follows the
  owner's stated preference, and Max-plan API credits only work on the Claude
  Platform. It also keeps the History pilot to one transport and one budget unit.
- **Comparison and fallback candidate for all 16: GPT-6 Luna** (`gpt-6-luna`; the
  exact API ID is unverified). The zip context recommends comparing one specialist
  on both models (doc 04) and keeping a second model tested against retirement
  (doc 05). The specialists previously ran on OpenAI custom GPTs.
- **When to switch an agent to GPT-6 Luna:** only on evidence. Either a reviewed
  side-by-side comparison of at least 20 questions favours it, or the agent's
  measured bundle token count puts every Haiku call above the reported 100K-token
  price step and Luna's verified price is lower. The STEM and language agents have a
  note in the file about which aspect to compare.
- There is **no automatic runtime fallback**. The pilot has none, by design.

The handoffs say models, prices and enablement are not selected in this slice, so
this file is a proposal for Bruno and website 03 to approve or change.

## What is in each folder

| File | Purpose |
| --- | --- |
| `README.md` | Status card for the agent (generated) |
| `HANDOFF-CLAUDE-HAIKU-5-5.md` | For a **new Claude instance**. Section 2 is a manual specialist test in a claude.ai Project. Section 3 is a Claude Code builder session that prepares the agent for the API path. Sections 4 and 5 hold probe messages and the comparison protocol. (generated) |
| `HANDOFF-GPT-6-LUNA.md` | The same for a **new GPT instance**: a ChatGPT Project or custom GPT for manual tests, and a GPT coding agent such as Codex for building. (generated) |
| `knowledge/` | Supplementary knowledge documents: subject thinking, task types, subject-specific answering behaviour and worked examples. See its README. |

`_shared/knowledge/00-answering-functionality-core.md` holds the cross-subject
answering rules every specialist loads last. They cover scope, clarification,
academic integrity, provisional marking, no URLs, no leaked instructions, honest
sources lines and "cannot answer" paths. They match what the runtime's
deterministic gate checks.

## How the supplements relate to the real knowledge bases

- The master prompt and knowledge base in the private `Epinoic-AI/Epinoic-Agent-Training`
  repository are authoritative. Every supplement says so in its front matter.
- The supplements are **not** part of any pinned bundle. Adding them to a bundle
  changes its SHA-256 and needs a reviewed new bundle version and manifest entry.
  The handoffs forbid silently changing or weakening knowledge-base rules.
- They were written without sight of the real knowledge bases, so expect overlap
  and some conflicts. A reviewer in each subject should read them before use.

## Regenerating the handoffs

Edit `agents.json`, `model-assignment.json` or `handoff-spec.json`, then run:

```
node agents/tools/generate-handoffs.mjs          # writes 48 files
node agents/tools/generate-handoffs.mjs --check  # exits 1 if any generated file is stale
```

The output is deterministic: no timestamps and no randomness.
