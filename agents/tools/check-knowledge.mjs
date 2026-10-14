#!/usr/bin/env node
// Structural checks for agents/*/knowledge/ supplements.
//
//   node agents/tools/check-knowledge.mjs
//
// Checks: required files exist; front matter is present, parses as simple
// `key: value` YAML (values containing ": " must be quoted), carries the required
// keys and names the folder's slug; no URLs or web addresses anywhere.
// These are structural checks only. They say nothing about accuracy or quality.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AGENTS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const roster = JSON.parse(readFileSync(join(AGENTS_DIR, "agents.json"), "utf8"));
const REQUIRED = [
  "README.md",
  "01-subject-thinking-and-skills.md",
  "02-task-types-and-answer-patterns.md",
  "03-answering-functionality.md",
  "04-worked-examples.md"
];
// Written by the simulation curators (simulation/README.md); optional, checked when present.
const OPTIONAL = ["05-lessons-from-simulation.md"];
const REQUIRED_KEYS = ["document", "subject", "slug", "version", "status", "precedence"];
const URL_PATTERNS = [/\b[a-z][a-z0-9+.-]*:\/\/\S+/i, /\bwww\.[a-z0-9-]+\.[a-z]{2,}/i];

const problems = [];
const note = (file, msg) => problems.push(`${file}: ${msg}`);

function parseFrontMatter(file, text) {
  if (!text.startsWith("---\n")) return note(file, "missing front matter"), null;
  const end = text.indexOf("\n---\n", 4);
  if (end < 0) return note(file, "unterminated front matter"), null;
  const fields = {};
  for (const line of text.slice(4, end).split("\n")) {
    const m = /^([a-z_]+): (.*)$/.exec(line);
    if (!m) { note(file, `front matter line not 'key: value': ${line}`); continue; }
    let value = m[2];
    if (/^".*"$/.test(value)) value = value.slice(1, -1);
    else if (value.includes(": ")) note(file, `front matter value for '${m[1]}' contains ": " and must be quoted`);
    if (m[1] in fields) note(file, `duplicate front matter key '${m[1]}'`);
    fields[m[1]] = value;
  }
  return fields;
}

for (const agent of roster.agents) {
  const dir = join(AGENTS_DIR, agent.slug, "knowledge");
  for (const name of [...REQUIRED, ...OPTIONAL]) {
    const file = join(dir, name);
    const rel = `agents/${agent.slug}/knowledge/${name}`;
    if (!existsSync(file)) { if (!OPTIONAL.includes(name)) note(rel, "missing"); continue; }
    const text = readFileSync(file, "utf8");
    if (name !== "README.md") {
      const fm = parseFrontMatter(rel, text);
      if (fm) {
        for (const k of REQUIRED_KEYS) if (!(k in fm)) note(rel, `front matter missing '${k}'`);
        if (fm.slug !== undefined && fm.slug !== agent.slug) note(rel, `front matter slug '${fm.slug}' != folder '${agent.slug}'`);
        if (fm.document !== undefined && fm.document !== name.replace(/\.md$/, "")) note(rel, `front matter document '${fm.document}' != file stem`);
      }
    }
    text.split("\n").forEach((line, i) => {
      for (const re of URL_PATTERNS) if (re.test(line)) note(`${rel}:${i + 1}`, `URL-like text: ${line.trim().slice(0, 80)}`);
    });
  }
  const extra = existsSync(dir) ? readdirSync(dir).filter((f) => !REQUIRED.includes(f) && !OPTIONAL.includes(f)) : [];
  for (const f of extra) note(`agents/${agent.slug}/knowledge/${f}`, "unexpected file");
}

const shared = join(AGENTS_DIR, "_shared", "knowledge", "00-answering-functionality-core.md");
readFileSync(shared, "utf8").split("\n").forEach((line, i) => {
  for (const re of URL_PATTERNS) if (re.test(line)) note(`agents/_shared/knowledge/00-answering-functionality-core.md:${i + 1}`, "URL-like text");
});

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`knowledge check passed: ${roster.agents.length} agents x ${REQUIRED.length} files, plus the shared core`);
