#!/usr/bin/env node
// Deterministic overseer for the simulation: runs one specialist answer through
// (1) the specialist-runtime gate with the simulation gate config, and
// (2) the Epinoic Logic Translator's RouterHub (integration/z3/check_answer.py, receive
//     mode): the answer is received through the same hub task the request was dispatched
//     on, so the receipt carries Z3 arithmetic checks, quotation grounding, request-item
//     coverage and formally checked limits (for example word bounds),
// and prints one JSON verdict. Offline: no model or provider is called.
//
//   node simulation/tools/check-answer.mjs --slug physics --request req.txt --answer ans.md \
//        [--supplied supplied.json] [--out result.json] [--gate-config cfg.json]
//
// --gate-config loads an external gate config (for example one built from a real knowledge
// base in a private repository). Codes that are ordinary exam vocabulary are dropped by the
// gate's own benign-token filter and listed in the output. Gate checks that are "pending"
// report "unsupported" and are advisory (judged by an overseer), not blocking.
//
// The translator runs with the Python named by EPINOIC_Z3_PYTHON (a venv with the
// translator installed). If it is unset or missing, the Z3 part reports "not_run".

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createOfflineTestRuntime } from "../../specialist-runtime/src/index.js";
import { SYNTHETIC_MANIFEST } from "../../specialist-runtime/fixtures/synthetic/manifest.js";
import { simulationGateConfig, SLUGS } from "../config/gate-configs.mjs";
import { isBenignToken } from "../../specialist-runtime/src/gate/benign.js";

function args() {
  const out = {};
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i += 2) {
    if (!a[i].startsWith("--") || a[i + 1] === undefined) throw new Error(`bad argument ${a[i]}`);
    out[a[i].slice(2)] = a[i + 1];
  }
  for (const k of ["slug", "request", "answer"]) if (!out[k]) throw new Error(`--${k} is required`);
  return out;
}

const opt = args();
if (!opt["gate-config"] && !SLUGS.includes(opt.slug)) throw new Error(`unknown slug ${opt.slug}`);
const request = readFileSync(opt.request, "utf8");
const answer = readFileSync(opt.answer, "utf8");
const supplied = opt.supplied ? JSON.parse(readFileSync(opt.supplied, "utf8")) : [];

// (1) Runtime gate.
let config = simulationGateConfig;
let droppedBenignCodes = [];
if (opt["gate-config"]) {
  const ext = JSON.parse(readFileSync(opt["gate-config"], "utf8"));
  if (ext.slug !== opt.slug) throw new Error(`gate config is for ${ext.slug}, not ${opt.slug}`);
  const leak = ext.checks["internal-code-leakage"];
  if (leak && Array.isArray(leak.codes)) {
    droppedBenignCodes = leak.codes.filter((c) => isBenignToken(c));
    leak.codes = leak.codes.filter((c) => !isBenignToken(c));
  }
  config = () => ext;
}
config = config(opt.slug);
const rt = createOfflineTestRuntime({ manifest: SYNTHETIC_MANIFEST, gateConfigs: { [opt.slug]: config } });
const suppliedText = supplied.map((s) => s.text).join("\n");
const gate = rt.runGate({ slug: opt.slug, gateConfig: config, answerText: answer, finishReason: "stop", userMessage: `${request}\n${suppliedText}` });

// (2) Z3 hub.
let z3 = { status: "not_run", reason: "EPINOIC_Z3_PYTHON not set or missing" };
const py = process.env.EPINOIC_Z3_PYTHON;
if (py && existsSync(py)) {
  const input = JSON.stringify({ slug: opt.slug, request, answer, supplied_texts: supplied });
  const r = spawnSync(py, ["-I", new URL("../../integration/z3/check_answer.py", import.meta.url).pathname], {
    input, encoding: "utf8", timeout: 120000, maxBuffer: 16 * 1024 * 1024,
  });
  try {
    z3 = JSON.parse(r.stdout);
  } catch {
    z3 = { status: "ERROR", reason: `translator produced no JSON (exit ${r.status})` };
  }
}

const gateFails = gate.checks.filter((c) => c.status === "fail");
const gateUnsupported = gate.checks.filter((c) => c.status === "unsupported");
const z3Errors = (z3.findings ?? []).filter((f) => f.severity === "error");
const uncovered = (z3.coverage ?? []).filter((c) => !c.addressed && c.method !== "not_checkable");
const broken = (z3.constraints ?? []).filter((c) => c.satisfied === false);
const blockingReasons = [
  ...gateFails.map((c) => `gate:${c.id}:${c.code}`),
  ...z3Errors.map((f) => `z3:${f.code}`),
  ...broken.map((c) => `z3:constraint_unsatisfied:${c.constraint_id}`),
];
const verdict = {
  schema: "epinoic.simulation-deterministic-check.v1",
  slug: opt.slug,
  blocking: blockingReasons.length > 0,
  blockingReasons,
  gate: { status: gate.status, checks: gate.checks.map((c) => ({ id: c.id, status: c.status, code: c.code })) },
  z3: {
    status: z3.status,
    branch: z3.branch ?? null,
    counts: z3.counts ?? null,
    formalErrors: z3.formal_errors ?? null,
    findings: (z3.findings ?? []).map((f) => ({ code: f.code, severity: f.severity, formal: f.formal, claims: f.claims, message: String(f.message).slice(0, 600) })),
    requestItems: (z3.request?.items ?? []).map((i) => ({ item_id: i.item_id, text: i.text, command_term: i.command_term })),
    coverage: z3.coverage ?? null,
    uncoveredItems: uncovered.map((c) => c.item_id),
    constraints: z3.constraints ?? null,
    versions: z3.versions ?? null,
    reason: z3.reason ?? z3.error ?? null,
  },
  advisory: [
    ...uncovered.map((c) => `z3:item_not_addressed:${c.item_id} (heuristic ${c.method})`),
    ...gateUnsupported.map((c) => `gate:${c.id}:${c.code} (judged by an overseer)`),
  ],
  gateConfig: { version: config.configVersion, droppedBenignCodes },
  note: "Deterministic format/policy gate plus the translator hub's Z3 checks of the answer's own stated arithmetic, quotations and limits. Item coverage is heuristic and advisory. None of this establishes that the answer is true or complete.",
};
const text = JSON.stringify(verdict, null, 2);
if (opt.out) writeFileSync(opt.out, text + "\n");
process.stdout.write(text + "\n");
