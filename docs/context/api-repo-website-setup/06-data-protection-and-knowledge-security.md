---
title: Data protection and proprietary knowledge security
exported: 2026-10-11
related: [01-architecture.md, 07-hallucination-controls.md, 08-sources.md]
---

# Data protection and proprietary documents

## Keeping documents safe
- Private repo, read-only deploy key, secrets in environment variables, backup copy on a second remote.
- **Anything in a prompt can leak through answers** (a visitor can ask the model to print instructions, or use prompt injection). Add an instruction not to quote documents verbatim, and have the backend block answers that heavily overlap a source document. Material that must never be disclosed should not go to the model at all.
- Give agents no tools beyond what they need; treat user input and document text as untrusted.

## What the vendor does with data (Anthropic)
- Use an API key from a Console organization: commercial API use falls under the Commercial Terms; claude.ai accounts run under the separate Consumer Terms.
- Anthropic's docs say retained data is never used for model training without your express permission.
- Default retention windows differ by source (one says 7 days for API logs, another says 30 days is the norm for commercial customers). Certain models require 30-day retention. **Check Anthropic's data retention page for Haiku 5.5.**
- Zero data retention (ZDR) exists but is subject to approval and applied per organization via Anthropic's sales team.
- Note: anything sent in prompts goes to the vendor, whichever vendor is chosen.

## Visitors' personal data
Collect and log as little as possible; publish a privacy policy; consider redacting personal data before sending to the model. Legal requirements depend on jurisdiction (the assistant is not a lawyer).
