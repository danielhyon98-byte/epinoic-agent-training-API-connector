import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { scanDirectory, scanSource } from "../tools/check-portable.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = resolve(ROOT, "src");

test("src/ passes the portability scan (no Node built-ins, network, process, console, Date or randomness)", () => {
  const { files, findings } = scanDirectory(SRC);
  assert.ok(files.length >= 20, `scanned ${files.length} files`);
  assert.deepEqual(findings, []);
});

test("npm run check:portable exits 0", () => {
  const out = execFileSync(process.execPath, ["tools/check-portable.mjs"], { cwd: ROOT, encoding: "utf8" });
  assert.match(out, /check-portable: OK/);
});

test("the scanner flags each forbidden construct", () => {
  const file = resolve(SRC, "fake.js");
  const flagged = (code) => scanSource(code, { file, srcRoot: SRC }).map((f) => f.rule);
  const cases = {
    'import fs from "node:fs";': /non-relative/,
    'import { readFile } from "fs";': /non-relative/,
    'import x from "../tools/x.js";': /outside src/,
    'export * from "some-package";': /non-relative/,
    'import x from "./x.mjs";': /non-\.js/,
    'const m = await import("./x.js");': /dynamic import/,
    'const r = require("fs");': /require/,
    "console.log(1);": /console/,
    'await fetch("https://example.org");': /fetch/,
    "process.env.KEY;": /process/,
    "const n = Date.now();": /Date/,
    "const r = Math.random();": /Math\.random/,
    "crypto.getRandomValues(new Uint8Array(4));": /crypto randomness/,
    "crypto.randomUUID();": /crypto randomness/,
    "setTimeout(() => {}, 1);": /timers/,
    "Buffer.from('x');": /Buffer/,
    "globalThis.process;": /globalThis/,
    "globalThis['fetch'];": /globalThis/,
    "new Function('return 1');": /Function/,
    "eval('1');": /eval/,
    "new WebSocket('wss://x');": /network/,
  };
  for (const [code, rule] of Object.entries(cases)) {
    const rules = flagged(code);
    assert.ok(rules.some((r) => rule.test(r)), `${code} -> ${JSON.stringify(rules)}`);
  }
});

test("the scanner ignores comments, strings, template text and regex literals", () => {
  const code = [
    "// never calls console or fetch, never reads process.env",
    "/* Date and Math.random are banned */",
    'const a = "console.log(process.env)";',
    "const b = `fetch ${1 + 2} Date`;",
    "const c = /console|fetch|process/g;",
    "const d = globalThis.crypto.subtle;",
    'import { x } from "./ok.js";',
  ].join("\n");
  assert.deepEqual(scanSource(code, { file: resolve(SRC, "fake.js"), srcRoot: SRC }), []);
});

test("the CLI fails (exit 1) on a copy of src/ with one forbidden line added", () => {
  const tmp = mkdtempSync(join(tmpdir(), "epinoic-portable-"));
  try {
    const copy = join(tmp, "src");
    cpSync(SRC, copy, { recursive: true });
    const clean = spawnSync(process.execPath, ["tools/check-portable.mjs", "--src", copy], { cwd: ROOT, encoding: "utf8" });
    assert.equal(clean.status, 0, clean.stderr);
    appendFileSync(join(copy, "bridge.js"), "\nconsole.log(Date.now());\n");
    writeFileSync(join(copy, "notes.txt"), "not a module\n");
    const dirty = spawnSync(process.execPath, ["tools/check-portable.mjs", "--src", copy], { cwd: ROOT, encoding: "utf8" });
    assert.equal(dirty.status, 1);
    assert.match(dirty.stderr, /bridge\.js:\d+: forbidden: console/);
    assert.match(dirty.stderr, /forbidden: Date/);
    assert.match(dirty.stderr, /notes\.txt:0: forbidden: non-\.js file/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
