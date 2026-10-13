---
title: Custom Claude Agents Project - Index
exported: 2026-10-11
status: planning / backend partially built
---

# Custom Claude Agents Project - Index

Exported summary of a conversation about building website-connected AI agents (orchestrator + specialist sub-agents, each with a master prompt and proprietary knowledge documents). Facts were checked via web search on 2026-10-11; see `08-sources.md` for what is official vs third-party. Verify anything important before relying on it.

## Goal
Website agents that use master prompts and knowledge documents, connected through an API backend to a web interface. Preferred model: Claude Haiku 5.5 (`claude-haiku-5-5`); GPT-6 Luna is an alternative. The owner says the specific API does not matter as long as the content stays portable.

## Stated situation and requirements
- Wants multiple sub-agents working on knowledge documents and master prompts, behind a website.
- First wanted it free; then wanted it linked to one Claude Max account so credits never run out regardless of traffic.
- Backend is already built; specialist sub-agents currently run on custom GPT files (OpenAI) and the owner worries that system may be shut down.
- Considering hosting knowledge files and the backend on an always-on local PC.
- Plans to keep all knowledge documents and master prompts in a private GitHub repository.
- Requirements: data protection, preservation of proprietary documents, and an architecture that minimizes hallucination in communication between AI agents.

## Key conclusions
1. "Never runs out of credits regardless of traffic" is not achievable with a Max account. Max includes a fixed monthly API credit; when it is used up, API requests stop until the next monthly credit unless the org has other credits. Fund a paid balance, set spend limits, and add caps in the backend. (`02`)
2. Do not route website traffic through a Max login. Use an API key from a Console organization, with the Max credits linked to that org. (`02`)
3. Custom GPTs inside ChatGPT have no API a backend can call, as far as known. OpenAI's Assistants API was scheduled to shut down 2026-08-26 (already passed). Find out which OpenAI API the backend uses. (`04`)
4. A thin model-call layer plus prompts/knowledge in a private repo makes switching vendors a small change. (`01`, `04`)
5. API retirement cannot be prevented, only made harmless. Anthropic gives at least 60 days notice for publicly released models. (`05`)
6. Knowledge docs sent in prompts can leak through answers; keep truly secret material away from the model. Use a Commercial-terms API key; ZDR is by approval. (`06`)
7. Reduce hallucination with structured messages, code-verified quotes, "cannot answer" paths and deterministic tools. This lowers but does not remove the risk. (`07`)

## Files
- `01-architecture.md` - how the website, backend, agents and repo connect
- `02-credits-costs-and-limits.md` - Max credits, pricing, budget guard, free options
- `03-reference-code.md` - backend and orchestrator sketches (untested)
- `04-openai-to-anthropic-migration.md` - migration path, effort, Haiku 5.5 vs Luna
- `05-api-retirement-resilience.md` - deprecation policies and a resilience checklist
- `06-data-protection-and-knowledge-security.md`
- `07-hallucination-controls.md`
- `08-sources.md`
