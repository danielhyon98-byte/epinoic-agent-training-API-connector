---
title: Credits, costs and limits
exported: 2026-10-11
related: [01-architecture.md, 08-sources.md]
---

# Credits, costs and limits

## Can a Max account make credits unlimited? No.
- Max plans include a monthly Claude Platform API credit: **$100 (Max 5x), $200 (Max 20x)**; Team up to $500 pooled. It covers the Claude API (Messages, Batches), Managed Agents, the Agent SDK and the playground.
- If the organization has no credits left, **API requests stop until the next monthly credits arrive** (unless other credits exist or the org is invoiced through Anthropic sales). The plan itself is never billed for overage.
- The credits only work on the Claude Platform and do not change Claude / Claude Code usage limits.

## Correct setup
1. Create a Console organization and generate an API key.
2. On claude.ai: Settings -> Billing -> API credits -> Link organization (the Max subscriber does this). No card is needed to claim or use the credit. Everyone with an API key in the linked org draws from the same balance.
3. Your backend uses that key; Max credits are spent first.
4. To keep running past the monthly credit, add a paid balance or payment method in the Console (check for automatic top-ups) and set a spend limit.

## Do not route site traffic through a Max login
A third-party licensing summary of Anthropic's terms says Anthropic does not permit third-party developers to route requests through Free, Pro or Max plan credentials on behalf of their users. Community proxies exist, but a consumer subscription is a personal license. Check the Consumer Terms yourself and prefer an API key.

## Haiku 5.5 pricing (per million tokens; from Anthropic docs as reported by third parties)
| Item | Price |
|---|---|
| Input, prompts up to 100K tokens | $0.10 |
| Output, prompts up to 100K tokens | $0.50 |
| Input / output, prompts over 100K tokens | $0.50 / $2.50 |
| Cache reads | from $0.01 |

- Model ID: `claude-haiku-5-5` (no date suffix, no alias). Context window 1M tokens; max output 128K.
- Tokenizer counts about 30% more tokens for the same text than earlier models.

## Rough estimate (my arithmetic, not a sourced figure)
A 10,000-token prompt with a 500-token reply costs about $0.00125, so roughly 80,000 messages per $100, before caching savings. Every sub-agent call is an extra API call, so orchestration multiplies cost per user message.

## Controls to build
- Per-visitor rate limits and a global daily budget; the API response reports tokens used, so the backend can keep a running spend total and stop before the balance hits zero.
- Alert when usage passes a threshold.
- Catch API errors and show a "temporarily busy" message.
- Use prompt caching for repeated context and the Batches API for work that does not need an immediate response.
- No setup can guarantee "never": the promise is only as strong as the funded balance and the caps.

## Free options (chat only)
- Claude.ai Free plan can select Haiku 5.5 in chat, but gives no API key.
- The Claude API has no ongoing free tier; new users get a small test credit.
- Claude Projects (instructions + files) on the free plan: sources disagree; check your sidebar. Either way it is the claude.ai interface, not your own site.
