# Status and access (13 October 2026)

This page says what this session could and could not reach, and therefore which
parts of the request were built here and which were handed off.

## What was asked

1. Follow the three coordination handoffs (first Daniel Claude: History specialist
   runtime; second Daniel Claude: multi-specialist router; coordination note).
2. Unpack `API_Repo_Website_Set_Up_context.zip`.
3. Set up the agents on Claude Haiku 5.5 and GPT-6 Luna where appropriate, connect
   them to the website and set up the APIs.
4. If (3) is unavailable, write one handoff file per agent for a new Claude or GPT
   instance, depending on the model.
5. Put a README describing the work in every upload.
6. Add knowledge documents that help each specialist in its subject and in how it
   answers.

## What this session could reach

| Resource | Result | Consequence |
| --- | --- | --- |
| `danielhyon98-byte/epinoic-agent-training-API-connector` (this repo) | Write access. The repo was empty (no commits) when the session started. | All work lives here on branch `claude/eloquent-euler-1kuwtf`. |
| `Epinoic-AI/Epinoic-Agent-Training` | Not reachable. The session's GitHub credential returned "you don't have access" when the repo was attached. | No knowledge-base package, master prompt, History bundle, validator or `handoff/00-08` file was read. Nothing here was checked against them. |
| `Epinoic-AI/Epinoic-Ai-Website` | Not reachable, same error. | No website source, router, contract, limit or test was read. The website constants quoted here come from the coordination handoffs, not from the code. |
| `danielhyon98-byte/https-github.com-lovishchopra-NL2FOL` (Logic Translator) | Readable, because it is **public**. | Used only to identify the 16-agent roster and the subject integrity concerns. See `docs/related-projects/logic-translator-nl2fol.md`. |
| Anthropic / OpenAI API keys | None set in this environment. | No model was called. No agent runs on any API. |

### How to fix repository access

Connect or reconnect GitHub at https://claude.ai/connect-github, and make sure the
Claude GitHub App is installed on the `Epinoic-AI` organisation (an org owner may
have to approve it) with `Epinoic-Agent-Training` and `Epinoic-Ai-Website` selected.
A session's repositories are chosen when it starts, so start a new session with
those repositories selected. GitHub membership and the session's app/connector
selection are separate. Never paste Bruno's or anyone else's token into chat.

## Why the agents were not put live on an API

Two reasons, either sufficient on its own:

1. **Not possible here.** No API keys were available, and the source knowledge
   bases and website were unreachable.
2. **Not authorised by the handoffs.** The coordination handoffs state that this
   slice performs no paid call, credential setup, deployment, production enablement
   or website source edit, and that live testing follows review and explicit caps.
   This session follows that boundary.

So the fallback in item (4) of the request applies. Each agent has:

- `agents/<slug>/HANDOFF-CLAUDE-HAIKU-5-5.md`, to paste into a new Claude instance;
- `agents/<slug>/HANDOFF-GPT-6-LUNA.md`, to paste into a new GPT instance;
- `agents/<slug>/knowledge/`, the supplementary knowledge documents;
- `agents/<slug>/README.md`.

The model each agent should use first is recorded in `agents/model-assignment.json`
and explained in `agents/README.md`. Treat it as a proposal: the handoffs say that
models, prices and production enablement are not selected in this slice.

## What was built and how far it was checked

| Part | Path | State |
| --- | --- | --- |
| Unpacked context | `docs/context/api-repo-website-setup/` | Copied verbatim from the zip (9 files). |
| Runtime contract | `docs/handoff/website-specialist-integration.md` | Written before the code, then updated with the implementation clarifications. Its source pins could not be verified. |
| Routing contract | `docs/handoff/specialist-routing.md` | Same. |
| Website 01 plan | `docs/handoff/website-01-integration-plan.md` | Plan only. No website file was changed. |
| History specialist runtime | `specialist-runtime/` | Portable ES modules. `npm test`: 117 pass, 0 fail. `check:portable`: OK. The real bundle checksum and History's handoff/04 gate rules depend on the unreachable repo, so the pinned config fails closed (`unsupported`, at best `gate_unverifiable`) and never reports a pass. Nothing is enabled. |
| Specialist router | `specialist-routing/` | Portable ES modules. `npm test`: 175 pass, 0 fail. `npm run evaluate`: PASS over 260 original synthetic items (153 tune / 107 holdout). These are policy-mechanics tests over synthetic scores, not classifier accuracy. The catalogue is synthetic. No live inference; the production policy is unapproved. |
| Cross-package check | `tools/cross-check.mjs` | The runtime's real capabilities object is accepted by the router, and nothing routes while every specialist is disabled. |
| Agent handoffs | `agents/*/HANDOFF-*.md` | 32 files: one Claude Haiku 5.5 and one GPT-6 Luna handoff per agent, generated from `agents/agents.json`, `model-assignment.json` and `handoff-spec.json`. `--check` passes. Their probe messages have **not** been run on any model. |
| Supplementary knowledge | `agents/*/knowledge/`, `agents/_shared/knowledge/` | 80 subject files (16 agents x README plus 01-04) and the shared answering rules (v0.1.4). All are original. Worked-example arithmetic and chemical equations were checked by script. They are not part of any pinned bundle and do not change its checksum. They are proposals for review by subject teachers. |

Each directory's README gives its exact tests and limits.

## Repository visibility (action needed)

- **This repository is public.** The context documents say proprietary prompts and
  knowledge must stay private. Nothing proprietary from the Epinoic knowledge bases
  is in this repo, because none of it could be read. Make the repo private before
  anyone copies master prompts, bundles or knowledge-base text into it.
- **The Logic Translator repository is also public**, but its `LICENSE` says
  "proprietary and confidential … All rights reserved". This session could clone it
  anonymously. If it is meant to be confidential, make it private. No code from it
  was copied here.
