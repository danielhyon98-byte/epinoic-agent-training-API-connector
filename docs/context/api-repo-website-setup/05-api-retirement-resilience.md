---
title: API retirement and resilience
exported: 2026-10-11
related: [04-openai-to-anthropic-migration.md, 08-sources.md]
---

# Preventing API retirement from breaking the site

You cannot prevent a vendor from retiring a model or API. You can make it a small, planned change.

## What Anthropic's policy gives you
- Anthropic notifies customers with active deployments and gives **at least 60 days notice** before retiring a publicly released model. (Older docs mention 6 months; plan on 60 days.)
- Example: `claude-opus-4-20250514` was deprecated 2026-04-14 and retired 2026-06-15 (about two months), per a third-party tracker.
- Requests to a retired model fail.
- The Console usage page exports a CSV broken down by API key and model.

## Checklist
1. Keep the model ID in one config value. Haiku 5.5 has no date suffix and no alias, so there is no floating "latest" name.
2. Keep a thin model-call layer (one file knows the vendor API shape).
3. Own your assets: prompts and knowledge in git; conversation history in your own database. Vendor-hosted state is what hurt Assistants API users.
4. Build a regression test set: 30-50 real questions per specialist with notes on what a good answer must contain; run it against a replacement model when a notice arrives.
5. Make sure notices reach a human (monitored Console account email); calendar a quarterly check of the deprecations page.
6. Keep a second model configured and tested as a fallback.
7. Alert on error-rate spikes; show a graceful "temporarily unavailable" message.
8. Avoid putting beta or vendor-hosted features on the core path.

Vendor risk also includes pricing and terms changes; this checklist keeps switching cost to days instead of weeks.
