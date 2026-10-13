# Context documents

`api-repo-website-setup/` holds the nine Markdown files from
`API_Repo_Website_Set_Up_context.zip` (SHA-256
`9949d7e099a0127e9a40c2618d912271dcd10dd33a8a8a5619efc6b62853a313`), copied
unchanged. They summarise an 11 October 2026 conversation about connecting master
prompts and knowledge documents to a website through an API backend.

## How this repo uses them

The coordination handoffs of 13 October are newer and more specific, so they win
where the two disagree. The main differences:

| Topic | Zip (11 Oct) | Handoffs (13 Oct), followed here |
| --- | --- | --- |
| Agent topology | An LLM orchestrator calls specialists as tools and may fan out. | A deterministic router selects one specialist or asks for clarification. No automatic multi-subject fan-out. Mixed requests get a clarification. |
| Backend | Python/Flask sketch | The existing Cloudflare Worker (plain JS). The specialist package is portable ES modules imported by the Worker. |
| Provider calls | The backend calls the SDK directly. | Website task 03 owns the OpenAI Responses and Anthropic Messages transports. Task 04 owns spending. This repo never calls a provider. |
| Retries | Code retries on malformed output. | No internal retry, fallback or revision loop in the pilot. One admitted turn calls the injected callback at most once. |
| Quote verification | `verify(claims, docs)` sketch | Deferred, with claim extraction and Z3. `claims` stays `null`. |

Points from the zip that **are** applied here:

- Keep the model ID in one config value, behind a thin model-call layer (doc 05).
  Here that layer is the website's 03 transports. `agents/model-assignment.json`
  only proposes IDs.
- Keep prompts and knowledge as plain files under git, and log the source commit
  with every answer (doc 01). The runtime manifest records repo, commit and bundle
  SHA-256 in every result.
- Never put keys in the repo or the browser (docs 01, 06).
- Plan for model retirement: keep a second model tested (doc 05). Each agent has a
  GPT-6 Luna handoff beside its Haiku 5.5 handoff.
- Provide a "cannot answer" path and avoid invented sources (doc 07). See the
  shared answering-functionality knowledge document and the runtime gate.
- Haiku 5.5's reported price step above 100K-token prompts and its ~30% larger
  token counts (doc 02) matter for the ~300 KB History bundle. Token counts have
  not been measured. They must be measured with the provider's counter before any
  live test.

Prices, context sizes and retention periods in the zip come partly from third-party
sites, as its own `08-sources.md` says. Verify them on the vendors' pages before
relying on them.
