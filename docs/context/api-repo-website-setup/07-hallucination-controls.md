---
title: Reducing hallucination between agents
exported: 2026-10-11
related: [03-reference-code.md, 01-architecture.md]
---

# Reducing hallucination between agents

Interpretation used in the conversation: "code solver architecture" means plain deterministic code, not another AI, checks what agents say to each other.

1. **Structured messages.** Specialists return JSON such as `{"claims": [{"text", "doc", "quote"}], "cannot_answer": false}`. Code validates the format and retries if malformed.
2. **Quote verification.** Code checks each quote appears word for word in the cited document; failing claims are dropped or sent back.
3. **Allow "I can't answer."** Specialists answer only from their documents; the orchestrator treats `cannot_answer` as a valid result.
4. **Code does the math.** Give agents a calculator or lookup function for numbers, dates and totals.
5. **Fewer hops.** Pass the original question and source quotes between agents, not summaries of summaries.
6. **Test for it.** Include unanswerable questions in the regression set; log every validation failure.

See `03-reference-code.md` for the `verify` sketch.

## Limits
This reduces hallucination a lot but does not remove it. A verified quote proves a document says something, not that the specialist drew the right conclusion. Keep a human review step for high-stakes answers.
