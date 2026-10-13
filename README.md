# Epinoic agent training: API connector

Specialist-side work for connecting Epinoic's IB subject-specialist agents to the
website. It covers the History pilot runtime, the multi-specialist router, a Claude
and a GPT handoff per agent, and supplementary knowledge documents.

> **Read `docs/STATUS-AND-ACCESS.md` first.** This session could not reach
> `Epinoic-AI/Epinoic-Agent-Training` or `Epinoic-AI/Epinoic-Ai-Website`, and no API
> keys were configured. Nothing here has been checked against the real knowledge
> bases or the website code, no model has been called, and no agent is live.
> **This repository is public.** Do not add proprietary prompts or knowledge-base
> text until it is made private.

## Layout

| Path | What it is |
| --- | --- |
| `docs/STATUS-AND-ACCESS.md` | What was reachable, what was blocked, how to fix access |
| `docs/context/` | The unpacked `API_Repo_Website_Set_Up_context.zip`, and how it relates to the newer handoffs |
| `docs/handoff/website-specialist-integration.md` | Contract for the History specialist runtime (first Daniel Claude's deliverable) |
| `docs/handoff/specialist-routing.md` | Contract for the multi-specialist router (second Daniel Claude's deliverable) |
| `docs/related-projects/` | Notes on the Logic Translator (NL2FOL/Z3) repo, which is deferred |
| `specialist-runtime/` | Portable ES-module History specialist package: manifest, bundle integrity, input preparation, one-turn bridge, deterministic gate |
| `specialist-routing/` | Portable ES-module router: catalogue, evidence validation, selection policy, calibration fingerprint, synthetic evaluation set |
| `agents/` | One folder per specialist (16), each with a Claude Haiku 5.5 handoff, a GPT-6 Luna handoff, a README and supplementary knowledge |

Each folder has its own README with tests and limits.

## Boundaries this work keeps

From the coordination handoffs:

- No provider call, API key, paid test, deployment, production enablement or
  website source edit. The website owners (01, 03, 04) wire these packages in
  after review.
- History is the only pilot specialist. Every other specialist stays disabled for
  website execution. A knowledge folder or handoff file does not mean an agent is
  enabled or tested.
- No Z3, claim extraction or formal-check badges. `claims` stays `null`.
- Synthetic fixtures are labelled synthetic. They are never provider observations
  or accuracy results.

## Running the offline tests

Node.js 22 or later. No dependencies need installing.

```
cd specialist-runtime && npm test
cd specialist-routing && npm test && npm run evaluate
```

## Work log

See `WORKLOG.md`.
