#!/usr/bin/env node
// Deployment-readiness and Z3-integration check. Offline: reads the packages' own
// exports and the environment; calls no model, provider or network.
//
//   node tools/readiness-check.mjs            (human-readable table, exit 1 if not ready)
//   node tools/readiness-check.mjs --json
//
// Set EPINOIC_Z3_PYTHON to a Python with the Logic Translator installed to include
// the Z3 smoke checks.

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import * as runtime from "../specialist-runtime/src/index.js";
import * as routing from "../specialist-routing/src/index.js";

const checks = [];
const add = (area, name, ok, detail, blocker = true) => checks.push({ area, name, ok, blocker, detail });

// --- Runtime (History pilot) ---
const m = runtime.RUNTIME_MANIFEST;
const h = m.entries.find((e) => e.slug === "history");
add("runtime", "Manifest validates", runtime.validateManifest(m).ok, "validateManifest(RUNTIME_MANIFEST)");
add("runtime", "Manifest source verified", m.sourceStatus === "verified", `sourceStatus = ${m.sourceStatus}`);
add("runtime", "History source commit pinned", Boolean(h?.source?.commit), `source.commit = ${h?.source?.commit}`);
add("runtime", "History bundle path pinned", Boolean(h?.source?.bundlePath), `source.bundlePath = ${h?.source?.bundlePath}`);
add("runtime", "History KB version pinned", Boolean(h?.kbVersion), `kbVersion = ${h?.kbVersion}`);
add("runtime", "History bundle SHA-256 verified", h?.bundleSha256Status === "verified", `bundleSha256Status = ${h?.bundleSha256Status}`);
const pendingChecks = Object.entries(runtime.HISTORY_GATE_CONFIG.checks).filter(([, c]) => c.status !== "active").map(([id]) => id);
add("runtime", "History gate rules loaded (handoff/04)", pendingChecks.length === 0, pendingChecks.length ? `pending: ${pendingChecks.join(", ")}` : "all active");
add("runtime", "History enabled for staging pilot", h?.stagingPilotEnabled === true, `stagingPilotEnabled = ${h?.stagingPilotEnabled} (needs reviewed enablement)`);
for (const env of ["staging-pilot", "production"]) {
  const caps = runtime.getCapabilities({ environment: env });
  const n = caps.entries.filter((e) => e.available).length;
  add("runtime", `Specialists available in ${env}`, n > 0, `${n} of ${caps.entries.length} manifest entries available`);
}
add("runtime", "Other 15 specialists in manifest", m.entries.length >= 16, `${m.entries.length} manifest entr${m.entries.length === 1 ? "y" : "ies"} (History only, by design for the pilot)`, false);

// --- Router ---
const catalogue = JSON.parse(readFileSync(new URL("../specialist-routing/fixtures/catalogue.synthetic.json", import.meta.url), "utf8"));
add("routing", "Catalogue built from real packages", catalogue.synthetic === false, `synthetic = ${catalogue.synthetic}`);
add("routing", "Production routing policy approved", routing.PRODUCTION_POLICY.status === "approved", `PRODUCTION_POLICY.status = ${routing.PRODUCTION_POLICY.status}`);
add("routing", "Calibration record present", routing.PRODUCTION_POLICY.calibration !== null, `calibration = ${JSON.stringify(routing.PRODUCTION_POLICY.calibration)}`);
const roster = JSON.parse(readFileSync(new URL("../agents/agents.json", import.meta.url), "utf8"));
const provisional = roster.agents.filter((a) => a.slugSource !== "handoff").map((a) => a.slug);
add("routing", "All specialist slugs verified", provisional.length === 0, provisional.length ? `${provisional.length} provisional: ${provisional.join(", ")}` : "all verified");

// --- Provider / website (environment) ---
add("provider", "ANTHROPIC_API_KEY available to this environment", Boolean(process.env.ANTHROPIC_API_KEY), process.env.ANTHROPIC_API_KEY ? "set (value not read)" : "not set; keys belong in the Worker's secret store, set by the website owner");
add("provider", "OPENAI_API_KEY available to this environment", Boolean(process.env.OPENAI_API_KEY), process.env.OPENAI_API_KEY ? "set (value not read)" : "not set (only needed if GPT-6 Luna is approved)", false);
add("website", "Website repository reachable from this session", false, "Epinoic-AI/Epinoic-Ai-Website: 'you don't have access' (add_repo, 14 Oct)");
add("website", "Website integration patch applied", false, "plan only: docs/handoff/website-01-integration-plan.md; owned by website 01");
add("website", "Website contract accepts more than english/history", false, "per handoff: public IDs and D1 route enum allow only english/history");

// --- Z3 Logic Translator ---
const py = process.env.EPINOIC_Z3_PYTHON;
const z3Installed = Boolean(py && existsSync(py));
add("z3", "Translator installed and importable", z3Installed, z3Installed ? `EPINOIC_Z3_PYTHON = ${py}` : "set EPINOIC_Z3_PYTHON to a venv with the translator installed");
if (z3Installed) {
  const probe = (answer) => {
    const r = spawnSync(py, ["-I", new URL("../integration/z3/check_answer.py", import.meta.url).pathname], {
      input: JSON.stringify({ slug: "physics", request: "A trolley accelerates uniformly from rest to 20 m s^-1 in 4.0 s. Calculate its acceleration.", answer }),
      encoding: "utf8", timeout: 60000,
    });
    try { return JSON.parse(r.stdout); } catch { return null; }
  };
  const wrong = probe("Using a = Δv/Δt, a = (20 - 0)/4.0 = 6.0 m s⁻².");
  const right = probe("Using a = Δv/Δt, a = (20 - 0)/4.0 = 5.0 m s⁻².");
  add("z3", "Z3 router catches a wrong worked step", wrong?.formal_errors === 1, `formal_errors = ${wrong?.formal_errors}, status = ${wrong?.status}`);
  add("z3", "Z3 router passes the correct step", right?.formal_errors === 0 && right?.status === "ACCEPTED", `formal_errors = ${right?.formal_errors}, status = ${right?.status}`);
}
add("z3", "Runtime result carries Z3/claims output", false, "claims = null by design: the handoffs defer Z3 and claim extraction");
add("z3", "Translator can run inside the Cloudflare Worker", false, "No: Python + z3-solver; the translator README says it does not run in a Worker. Needs a separate service (POST /v1/verify, never deployed)");
add("z3", "Translator service deployed", false, "translator docs: 'Nothing in this repository is deployed'");

// --- Output ---
const blockers = checks.filter((c) => !c.ok && c.blocker);
if (process.argv.includes("--json")) {
  process.stdout.write(JSON.stringify({ ready: blockers.length === 0, blockers: blockers.length, checks }, null, 2) + "\n");
} else {
  console.log("| Area | Check | Result | Detail |\n| --- | --- | --- | --- |");
  for (const c of checks) console.log(`| ${c.area} | ${c.name} | ${c.ok ? "PASS" : c.blocker ? "**BLOCKER**" : "not met (non-blocking)"} | ${c.detail.replace(/\|/g, "\\|")} |`);
  console.log(`\nDeployment ready: ${blockers.length === 0 ? "YES" : `NO (${blockers.length} blockers)`}`);
}
process.exit(blockers.length === 0 ? 0 : 1);
