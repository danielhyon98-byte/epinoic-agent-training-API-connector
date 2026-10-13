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
| Unpacked context | `docs/context/api-repo-website-setup/` | Copied verbatim from the zip. |
| Runtime contract | `docs/handoff/website-specialist-integration.md` | Written. Its source pins could not be verified. |
| Routing contract | `docs/handoff/specialist-routing.md` | Written. Its source pins could not be verified. |
| History specialist runtime | `specialist-runtime/` | Portable ES modules and offline tests. The real bundle checksum and the History-specific gate rules depend on the unreachable repo, so those checks fail closed and report "unsupported". They never report a pass. |
| Specialist router | `specialist-routing/` | Portable ES modules, synthetic catalogue, original synthetic evaluation set, offline evaluator and tests. Not built from the real packages. |
| Agent handoffs | `agents/*/HANDOFF-*.md` | One Claude and one GPT handoff per agent, generated from `agents/agents.json`. |
| Supplementary knowledge | `agents/*/knowledge/` | Original documents. They are not part of any pinned bundle and do not change its checksum. They are proposals for review. |

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
