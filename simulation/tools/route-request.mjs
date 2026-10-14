#!/usr/bin/env node
// Dispatch a student's request through the Epinoic Logic Translator's RouterHub and
// write the explicit TaskRequest (items, command terms, limits) the specialist answers.
// Offline: no model or provider is called.
//
//   node simulation/tools/route-request.mjs --slug history --request req.txt [--supplied s.json] --out explicit.json

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const a = process.argv.slice(2);
const opt = {};
for (let i = 0; i < a.length; i += 2) opt[a[i].replace(/^--/, "")] = a[i + 1];
for (const k of ["slug", "request", "out"]) if (!opt[k]) throw new Error(`--${k} is required`);
const py = process.env.EPINOIC_Z3_PYTHON;
let result = { ok: false, status: "not_run", reason: "EPINOIC_Z3_PYTHON not set or missing" };
if (py && existsSync(py)) {
  const input = JSON.stringify({
    slug: opt.slug,
    request: readFileSync(opt.request, "utf8"),
    answer: "-",
    supplied_texts: opt.supplied ? JSON.parse(readFileSync(opt.supplied, "utf8")) : [],
  });
  const r = spawnSync(py, ["-I", new URL("../../integration/z3/check_answer.py", import.meta.url).pathname, "--mode", "dispatch"], {
    input, encoding: "utf8", timeout: 60000,
  });
  try { result = JSON.parse(r.stdout); } catch { result = { ok: false, status: "ERROR", reason: `no JSON (exit ${r.status})` }; }
}
writeFileSync(opt.out, JSON.stringify(result, null, 2) + "\n");
process.stdout.write(JSON.stringify({ ok: result.ok, status: result.status, branch: result.branch ?? null, items: result.request?.items?.length ?? 0, constraints: result.request?.constraints?.length ?? 0 }) + "\n");
