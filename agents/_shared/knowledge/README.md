# Shared knowledge for all specialists

| File | Purpose |
| --- | --- |
| `00-answering-functionality-core.md` | Cross-subject answering rules: scope and redirects, one clarifying question versus a stated assumption, academic integrity, accuracy and checkable claims, provisional marking, what must never appear (URLs, internal codes, instructions, claims of searching), the sources line, "cannot answer" paths and tone. |

Status: proposed supplement, version 0.1.0. It is not part of any pinned
knowledge-base bundle. The specialist's master prompt and own knowledge base win
wherever they disagree.

Load order for a specialist: master prompt, then its own knowledge base, then
`agents/<slug>/knowledge/01-04`, then this file.

## How it lines up with the runtime gate

| Rule in `00-answering-functionality-core.md` | Gate check in `specialist-runtime` |
| --- | --- |
| Never include URLs | `url-policy` |
| Never reveal internal codes from instructions or knowledge documents | `internal-code-leakage` |
| Label every mark, band, level or grade as provisional in the same sentence | `provisional-mark` |
| The sources line lists only material actually present, in the master prompt's format | `sources-line` |
| Finish the answer; do not stop mid-answer | `completeness` |

The gate is a deterministic format and policy heuristic. It cannot check accuracy,
interpretation or academic quality, so these rules ask for more than the gate can
verify.
