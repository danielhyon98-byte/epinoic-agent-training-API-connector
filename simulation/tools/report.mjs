#!/usr/bin/env node
// Build the cycle report from the simulation run files (deterministic; no model call).
//
//   node simulation/tools/report.mjs --cycle 1 [--out simulation/reports/cycle-1.md]
//
// Lists, per specialist and question, every round's verdicts and every text excerpt the
// overseers returned, grouped by the four feedback categories:
//   (a) lacking detail  (b) leap in logic / factually untrue  (c) no source  (d) no evidence
// plus the deterministic gate and Z3 RouterHub findings and the specialist's diagnoses.

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";

const argv = process.argv.slice(2);
const opt = {};
for (let i = 0; i < argv.length; i += 2) opt[argv[i].replace(/^--/, "")] = argv[i + 1];
const cycle = Number(opt.cycle);
if (!Number.isInteger(cycle) || cycle < 1) throw new Error("--cycle N is required");

const ROOT = new URL("../", import.meta.url).pathname;
// --runs-dir points at another run tree (for example the private real-agent training runs).
const RUNS = opt["runs-dir"] ? join(opt["runs-dir"], `cycle-${cycle}`) : join(ROOT, "runs", `cycle-${cycle}`);
const roster = JSON.parse(readFileSync(opt.roster ?? join(ROOT, "..", "agents", "agents.json"), "utf8"));
const name = Object.fromEntries((roster.agents ?? roster.subjects ?? []).map((a) => [a.slug, a.displayName]));
const CATS = [
  ["a_lacking_detail", "(a) Lacking detail"],
  ["b_logic_or_false", "(b) Leap in logic or factually untrue"],
  ["c_no_source", "(c) No source for the claim"],
  ["d_no_evidence", "(d) No evidence for the claim"],
];
const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const dirs = (p) => (existsSync(p) ? readdirSync(p).filter((d) => statSync(join(p, d)).isDirectory()).sort() : []);
const oneLine = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const cell = (s) => oneLine(s).replace(/\|/g, "\\|");

const totals = { questions: 0, accepted: 0, rounds: 0, firstTry: 0, flags: { a_lacking_detail: 0, b_logic_or_false: 0, c_no_source: 0, d_no_evidence: 0 }, major: 0, detBlocking: 0, z3Errors: 0 };
const bySubject = [];
const body = [];

for (const slug of dirs(RUNS)) {
  const subj = { slug, questions: 0, accepted: 0, rounds: 0, flags: 0 };
  body.push(`\n## ${name[slug] ?? slug} (\`${slug}\`)\n`);
  for (const qid of dirs(join(RUNS, slug))) {
    const qdir = join(RUNS, slug, qid);
    const sc = readJson(join(qdir, "scenario.json"));
    const rounds = dirs(qdir).filter((d) => /^round-\d+$/.test(d)).sort((x, y) => Number(x.split("-")[1]) - Number(y.split("-")[1]));
    totals.questions++; subj.questions++;
    let accepted = false;
    const roundLines = [];
    const flagLines = [];
    for (const rd of rounds) {
      const r = Number(rd.split("-")[1]);
      const rdir = join(qdir, rd);
      const det = readJson(join(rdir, "deterministic.json"));
      const oa = readJson(join(rdir, "overseer-a.json"));
      const ob = readJson(join(rdir, "overseer-b.json"));
      const diag = readJson(join(rdir, "diagnosis.json"));
      if (!existsSync(join(rdir, "answer.md"))) continue;
      totals.rounds++; subj.rounds++;
      const flags = [...(oa?.flags ?? []), ...(ob?.flags ?? [])];
      const z3err = (det?.z3?.findings ?? []).filter((f) => f.severity === "error");
      const ok = det && !det.blocking && oa?.verdict === "accept" && ob?.verdict === "accept";
      if (det?.blocking) totals.detBlocking++;
      totals.z3Errors += z3err.length;
      for (const f of flags) { totals.flags[f.category] = (totals.flags[f.category] ?? 0) + 1; if (f.severity === "major") totals.major++; subj.flags++; }
      roundLines.push(`| ${r} | ${ok ? "**accepted**" : "rejected"} | ${det ? (det.blocking ? cell(det.blockingReasons.join(", ")) : "pass") : "missing"} | ${det?.z3?.status ?? "–"}${z3err.length ? ` (${z3err.map((f) => f.code).join(", ")})` : ""} | ${oa?.verdict ?? "missing"} | ${ob?.verdict ?? "missing"} | ${CATS.map(([k]) => flags.filter((f) => f.category === k).length).join(" / ")} | ${diag?.diagnosis?.length ?? (r > 1 ? "missing" : "–")} |`);
      if (ok) { accepted = true; if (r === 1) totals.firstTry++; }
      for (const [k, label] of CATS) {
        for (const f of flags.filter((x) => x.category === k)) {
          flagLines.push(`- Round ${r}, ${label}, ${f.severity}: "${oneLine(f.excerpt).slice(0, 300)}". ${oneLine(f.explanation)} *Fix:* ${oneLine(f.required_fix)}`);
        }
      }
      for (const f of z3err) flagLines.push(`- Round ${r}, Z3 RouterHub ${f.code} (formal: ${f.formal}): "${oneLine((f.claims ?? [])[0]).slice(0, 200)}". ${oneLine(f.message).slice(0, 300)}`);
      for (const d of diag?.diagnosis ?? []) flagLines.push(`- Round ${r} diagnosis: ${oneLine(d.flag).slice(0, 120)}. *Root cause:* ${oneLine(d.root_cause)} *Change:* ${oneLine(d.change)}`);
    }
    if (accepted) { totals.accepted++; subj.accepted++; }
    body.push(`### ${qid} (${sc?.kind ?? "?"}): ${accepted ? "accepted" : "not accepted"} after ${rounds.length} round(s)\n`);
    body.push(`> ${oneLine(sc?.request).slice(0, 400)}\n`);
    body.push("| Round | Result | Deterministic gate | Z3 RouterHub | Overseer A | Overseer B | Flags a / b / c / d | Diagnoses |\n| --- | --- | --- | --- | --- | --- | --- | --- |");
    body.push(...roundLines);
    body.push("");
    if (flagLines.length) body.push("Flagged text and feedback:\n", ...flagLines, "");
  }
  bySubject.push(subj);
}

const head = [
  `# Simulation cycle ${cycle}: overseer report`,
  "",
  "Generated by `simulation/tools/report.mjs` from `" + (opt["runs-dir"] ? opt["runs-dir"].split("/").slice(-2).join("/") : "simulation/runs") + "/cycle-" + cycle + "/`." + (opt.header ? ` ${opt.header}` : "") + " All agents (specialists, overseers, curators) ran on Claude Fable 5.1 (the harness's `fable` alias); specialists were configured only from the supplementary knowledge and shared rules. Overseers are language models (fallible), backed by the deterministic gate and the Z3 Logic Translator's RouterHub. This is a simulation, not evidence about the real specialists or about the API path.",
  "",
  "## Totals",
  "",
  `- Questions: ${totals.questions}; accepted: ${totals.accepted}; accepted on the first answer: ${totals.firstTry}; specialist rounds: ${totals.rounds}`,
  `- Flags: (a) lacking detail ${totals.flags.a_lacking_detail}, (b) logic/false ${totals.flags.b_logic_or_false}, (c) no source ${totals.flags.c_no_source}, (d) no evidence ${totals.flags.d_no_evidence}; major ${totals.major}`,
  `- Deterministic blocking rounds: ${totals.detBlocking}; Z3 error findings: ${totals.z3Errors}`,
  "",
  "| Specialist | Questions | Accepted | Rounds | Flags |",
  "| --- | --- | --- | --- | --- |",
  ...bySubject.map((s) => `| ${name[s.slug] ?? s.slug} | ${s.questions} | ${s.accepted} | ${s.rounds} | ${s.flags} |`),
];
const md = [...head, ...body].join("\n") + "\n";
const out = opt.out ?? join(ROOT, "reports", `cycle-${cycle}.md`);
if (opt["runs-dir"] && !opt.out) throw new Error("--out is required with --runs-dir");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, md);
process.stdout.write(JSON.stringify({ cycle, out, ...totals }) + "\n");
