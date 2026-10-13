---
title: Architecture - how it connects to the website
exported: 2026-10-11
related: [02-credits-costs-and-limits.md, 03-reference-code.md, 06-data-protection-and-knowledge-security.md]
---

# Architecture

## Request flow

```
Visitor's browser (your website)
        |  HTTPS: question
        v
Your backend  (API key + GitHub token live only here)
  |- login, rate limits, daily budget guard
  |- local copy of your private GitHub repo (prompts + knowledge)
  v
Orchestrator agent (master prompt)
        | structured request
        v
Specialist agents (own prompt + own docs)
        | structured claims with quotes
        v
Validator (plain code, not AI)
        v
Final answer -> browser
```

The browser only sends a question and receives an answer. It never sees API keys, prompts or documents. Every model call happens on the backend.

## Components
- **Frontend:** a web page that POSTs `{messages}` to `/chat` and keeps conversation history. The API has no memory between calls, so full history is sent each time.
- **Backend:** holds `ANTHROPIC_API_KEY` and a read-only GitHub credential; applies auth, per-visitor rate limits and a global budget guard; loads prompts and knowledge; calls the model; validates results.
- **Orchestrator + specialists:** each specialist is a model call with its own system prompt and documents, exposed to the orchestrator as a tool (see `03-reference-code.md`).
- **Model-call layer:** one function (for example `call_model(system, docs, messages, tools)`) so only one file knows the vendor's API shape.

## Repo layout (private GitHub repository)

```
agents/
  billing/prompt.md
  billing/knowledge/*.md
  returns/prompt.md
  returns/knowledge/*.md
tests/questions.yaml
```

- Do not fetch from GitHub on every user message (latency, rate limits, dependency on GitHub uptime). Pull on startup and refresh on a schedule or a push webhook; keep files in memory or on disk.
- Keep a local last-good copy so the site survives a GitHub outage.
- Use a read-only deploy key or fine-grained token limited to that repo; store it in an environment variable.
- Log the commit ID with each answer; git gives easy rollback.
- Keep a second backup remote.

## Knowledge documents: two approaches
- **Small knowledge base:** paste all documents into the system prompt and use prompt caching.
- **Large knowledge base:** retrieval (chunk, embed, send only relevant chunks).
- Watch size: Haiku 5.5 pricing steps up for prompts over 100K tokens, and its tokenizer counts roughly 30% more tokens than earlier models for the same text.

## Hosting: local PC vs cloud
- Local hosting works: the backend reads files from disk and sends their text in prompts. Anthropic never accesses your disk.
- Risks of a home PC: power or internet loss, reboots, changing IP, security exposure. Mitigate with a self-restarting service and a tunnel service (for example Cloudflare Tunnel) instead of opening router ports.
- The backend is small; a cheap cloud host is usually more reliable for a public site. Local mainly wins when files are very large or must stay on your hardware.
- The repo makes content portable, not model behavior: prompts may need tuning per model and tool-call formats differ, so keep test questions in the repo.
