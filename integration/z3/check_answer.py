#!/usr/bin/env python3
"""Route one specialist exchange through the Epinoic Logic Translator's RouterHub (Z3).

Two modes, both through the same hub path (open_task -> dispatch -> receive):
  --mode dispatch : dispatch the student's request through the hub and print the explicit
                    TaskRequest the specialist should answer (items, command terms, limits).
  --mode receive  : (default) dispatch, then receive the specialist's answer through the hub
                    and print the receipt: status, findings, item coverage, constraint results.

Calls the translator as an external, separately installed dependency. No translator
code is copied here. Offline: no model or provider is called.

Usage (with the translator installed in a venv):
    $Z3_PY -I integration/z3/check_answer.py [--mode dispatch|receive] INPUT.json > OUTPUT.json

INPUT.json:
    {"slug": "physics", "request": "<the student's message>", "answer": "<specialist answer>",
     "supplied_texts": [{"document_id": "src-a", "title": "...", "text": "..."}],   # optional
     "course_level": "SL" | "HL" | "unknown"}                                       # optional

OUTPUT (always JSON, exit 0 unless the input is unreadable):
    {"schema": "epinoic.z3-answer-check.v1", "ok": bool, "status": "ACCEPTED|ACCEPTED_WITH_FINDINGS|REJECTED|ERROR",
     "branch": str|null, "subject": str, "findings": [{"code", "severity", "message", "claims": [claim text...],
     "formal": bool}], "counts": {"error": n, "warning": n, "info": n}, "engine_errors": n, "versions": {...}}
"""
from __future__ import annotations

import json
import sys

SUBJECTS = {
    "history": "History",
    "english-a-literature": "English A: Literature",
    "english-a-lang-lit": "English A: Language and Literature",
    "english-specialist": "English A: Literature",
    "mathematics-aa": "Mathematics: Analysis and Approaches",
    "mathematics-ai": "Mathematics: Applications and Interpretation",
    "economics": "Economics",
    "business-management": "Business Management",
    "psychology": "Psychology",
    "geography": "Geography",
    "spanish-b": "Language B: Spanish",
    "computer-science": "Computer Science",
    "physics": "Physics",
    "chemistry": "Chemistry",
    "biology": "Biology",
    "ess": "Environmental Systems and Societies",
}
KEY = b"simulation-only-signing-key-not-secret-0001"
AGENT = "specialist"


def main() -> int:
    argv = sys.argv[1:]
    mode = "receive"
    if len(argv) >= 2 and argv[0] == "--mode":
        mode, argv = argv[1], argv[2:]
    if mode not in ("dispatch", "receive"):
        print(json.dumps({"schema": "epinoic.z3-answer-check.v1", "ok": False, "status": "ERROR", "error": "bad_mode"}))
        return 2
    try:
        data = json.load(open(argv[0], encoding="utf-8")) if argv else json.load(sys.stdin)
    except Exception as exc:  # unreadable input is the caller's bug
        print(json.dumps({"schema": "epinoic.z3-answer-check.v1", "ok": False, "status": "ERROR", "error": f"input_unreadable: {type(exc).__name__}"}))
        return 2
    slug = data.get("slug")
    subject = SUBJECTS.get(slug)
    out = {"schema": "epinoic.z3-answer-check.v1", "mode": mode, "slug": slug, "subject": subject}
    if subject is None:
        out.update(ok=False, status="ERROR", error="unknown_slug")
        print(json.dumps(out))
        return 0
    try:
        from epinoic_logic import version as v
        from epinoic_logic.branches import RouterHub
        from epinoic_logic.engine import SolverConfig
        from epinoic_logic.integrity import WorkPlan
        from epinoic_logic.translate.contracts import SuppliedText

        hub = RouterHub(signing_key=KEY, config=SolverConfig(timeout_ms=4000, memory_max_mb=None))
        level = data.get("course_level") or "unknown"
        hub.open_task(WorkPlan(plan_id="sim", request_id="sim-q", task_id="t", subject=subject, course_level=level,
                               task_type="short_answer", selected_agent_ids=[AGENT]))
        supplied = [SuppliedText(document_id=s["document_id"], title=s.get("title"), text=s["text"]) for s in data.get("supplied_texts") or []]
        msg, req, dispatch_rc = hub.dispatch("t", AGENT, data["request"], supplied)
        explicit = {
            "task_type": req.task_type,
            "course_level": req.course_level,
            "items": [{"item_id": i.item_id, "text": i.text, "kind": i.kind, "required": i.required,
                       "command_term": i.command_term, "level": i.level} for i in req.items],
            "constraints": [{"constraint_id": c.constraint_id, "kind": str(getattr(c.kind, "value", c.kind)), "value": c.value, "text": c.text}
                            for c in req.constraints],
            "supplied_texts": [s.document_id for s in req.supplied_texts],
            "user_input_sha256": req.user_input_sha256,
        }
        if mode == "dispatch":
            out.update(ok=msg is not None, status=dispatch_rc.status.value, branch=dispatch_rc.branch, request=explicit,
                       findings=[{"code": f.code, "severity": f.severity, "message": f.message} for f in dispatch_rc.findings])
            print(json.dumps(out, ensure_ascii=False))
            return 0
        if msg is None:
            out.update(ok=False, status="ERROR", error="dispatch_refused",
                       findings=[{"code": f.code, "severity": f.severity, "message": f.message} for f in dispatch_rc.findings])
            print(json.dumps(out))
            return 0
        _reply, rc = hub.receive("t", msg.message_id, data["answer"], agent_id=AGENT, report_id="r1")
        claims = {}
        for rep in hub.channels["t"].transmitted_reports.values():
            for c in rep.claims:
                claims[c.claim_id] = c.claim_text
        findings = []
        counts = {"error": 0, "warning": 0, "info": 0}
        for f in rc.findings:
            counts[f.severity] = counts.get(f.severity, 0) + 1
            findings.append({
                "code": f.code,
                "severity": f.severity,
                "message": f.message,
                "claims": [claims.get(cid, cid) for cid in f.claim_ids][:5],
                "formal": f.formal_result_id is not None,
            })
        out.update(
            ok=True,
            status=rc.status.value,
            branch=rc.branch,
            findings=findings,
            counts=counts,
            formal_errors=sum(1 for f in findings if f["formal"] and f["severity"] == "error"),
            request=explicit,
            coverage=[{"item_id": c.item_id, "addressed": c.addressed, "method": c.method} for c in rc.coverage],
            constraints=[{"constraint_id": c.constraint_id, "satisfied": c.satisfied, "method": c.method, "detail": c.detail[:300]}
                         for c in rc.constraint_results],
            versions={k: getattr(v, k) for k in dir(v) if k.endswith("VERSION")},
        )
    except Exception as exc:  # report, never crash the caller
        out.update(ok=False, status="ERROR", error=f"{type(exc).__name__}: {str(exc)[:300]}")
    print(json.dumps(out, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
