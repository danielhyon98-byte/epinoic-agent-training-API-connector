---
title: Migrating from custom GPT / OpenAI to Anthropic
exported: 2026-10-11
related: [05-api-retirement-resilience.md, 01-architecture.md]
---

# Migration: OpenAI custom GPT files -> Anthropic Haiku 5.5

## What actually shut down
- No announcement was found that Custom GPTs inside ChatGPT are being shut down.
- OpenAI's **Assistants API** was set to shut down **2026-08-26** (already passed); replacement is the Responses API (plus Conversations API).
- One deprecation list also says the v1/prompts API and reusable prompt objects shut down **2026-11-30** (verify on OpenAI's deprecations page if Prompts are used).
- Custom GPTs in ChatGPT have no API a backend can call, as far as known. **Open question for the owner:** which OpenAI API does the backend call? If it is the Assistants API, migrate now regardless of vendor.

## How similar the infrastructure is
The architecture is the same: website -> backend -> orchestrator -> specialists -> model API. Differences:
- **Knowledge files (main rebuild):** OpenAI-hosted file search / vector stores do not carry over. On Anthropic, send document text in the prompt (with caching) or build your own retrieval.
- **API format:** system prompt is a separate parameter; tool calls use different block shapes; you keep conversation history yourself.
- **Prompts:** mostly transfer; expect tuning of tone and formatting. Haiku 5.5 counts about 30% more tokens, so re-check budgets.

## Effort estimate (my estimate, not sourced)
- Basic port for a handful of specialists: about 1-2 days.
- Testing and prompt tuning: a few more days; budget roughly a week.
- Large vector-store knowledge bases add time.

## Recommendation
- Put a thin layer between your code and the model; keep prompts and knowledge as plain files you own; keep conversation state in your own database.
- Haiku 5.5 vs GPT-6 Luna: broadly comparable (context windows about 1M vs about 1.05M tokens); comparison sites disagree on which is ahead. Run about 20 real questions through one specialist on each and compare.
- One concrete factor favoring Haiku for this plan: Max API credits only work on the Claude Platform.
- Disclosure from the conversation: the assistant is made by Anthropic; weigh its view accordingly.
