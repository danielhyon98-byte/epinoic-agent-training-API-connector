# Agent tools

| Tool | Purpose | Command |
| --- | --- | --- |
| `generate-handoffs.mjs` | Writes each agent's `README.md`, `HANDOFF-CLAUDE-HAIKU-5-5.md` and `HANDOFF-GPT-6-LUNA.md` from `agents.json`, `model-assignment.json` and `handoff-spec.json`. Output is deterministic. | `node agents/tools/generate-handoffs.mjs` (add `--check` to fail on stale files) |
| `check-knowledge.mjs` | Structural checks on `agents/*/knowledge/`: required files, front matter keys and slug, quoting of values containing `": "`, and no URLs. It does not judge accuracy or quality. | `node agents/tools/check-knowledge.mjs` |
