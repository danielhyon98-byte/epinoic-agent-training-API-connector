---
title: Reference code sketches (untested)
exported: 2026-10-11
related: [01-architecture.md, 07-hallucination-controls.md]
---

# Reference code sketches

These are sketches from the conversation and have not been run. Check the current Anthropic SDK docs before use.

## Minimal backend (Python / Flask)

```python
# pip install anthropic flask   |  set ANTHROPIC_API_KEY in your environment
import anthropic, pathlib
from flask import Flask, request, jsonify

client = anthropic.Anthropic()
MASTER_PROMPT = pathlib.Path("master_prompt.md").read_text()
KNOWLEDGE = "\n\n".join(
    f'<document name="{p.name}">\n{p.read_text()}\n</document>'
    for p in pathlib.Path("knowledge").glob("*.md")
)

app = Flask(__name__)

@app.post("/chat")
def chat():
    resp = client.messages.create(
        model="claude-haiku-5-5",
        max_tokens=1000,
        system=[
            {"type": "text", "text": MASTER_PROMPT},
            {"type": "text", "text": KNOWLEDGE,
             "cache_control": {"type": "ephemeral"}},  # prompt caching
        ],
        messages=request.json["messages"],  # [{"role": "user", "content": "..."}]
    )
    return jsonify(reply=resp.content[0].text)
```

## Orchestrator with specialist sub-agents

```python
tools = [{
    "name": "ask_specialist",
    "description": "Send a question to a specialist agent.",
    "input_schema": {"type": "object",
        "properties": {"agent": {"type": "string", "enum": list(AGENTS)},
                       "question": {"type": "string"}},
        "required": ["agent", "question"]},
}]

def run_specialist(agent, question):   # AGENTS[name] = {"prompt": ..., "docs": ...}
    a = AGENTS[agent]
    r = client.messages.create(model="claude-haiku-5-5", max_tokens=800,
        system=[{"type": "text", "text": a["prompt"]},
                {"type": "text", "text": a["docs"],
                 "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": question}])
    return r.content[0].text

def orchestrate(user_text):
    msgs = [{"role": "user", "content": user_text}]
    while True:
        r = client.messages.create(model="claude-haiku-5-5", max_tokens=1000,
            system=ORCHESTRATOR_PROMPT, tools=tools, messages=msgs)
        if r.stop_reason != "tool_use":
            return r.content[0].text
        msgs.append({"role": "assistant", "content": r.content})
        msgs.append({"role": "user", "content": [
            {"type": "tool_result", "tool_use_id": b.id,
             "content": run_specialist(**b.input)}
            for b in r.content if b.type == "tool_use"]})
```

## Quote verifier

```python
def verify(claims, docs):
    norm = lambda s: " ".join(s.lower().split())
    return [c for c in claims
            if norm(c["quote"]) in norm(docs.get(c["doc"], ""))]
```

## Config tip
Keep the model ID in one place: `MODEL = os.environ.get("AGENT_MODEL", "claude-haiku-5-5")`.
