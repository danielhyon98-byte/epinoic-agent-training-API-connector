import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";
import { checkPortable, lex } from "../tools/check-portable.mjs";
import { ROOT } from "./helpers.js";

const tmp = mkdtempSync(path.join(os.tmpdir(), "routing-portable-"));
after(() => rmSync(tmp, { recursive: true, force: true }));

describe("check:portable", () => {
  test("src/ passes (CLI exit 0)", () => {
    const { files, problems } = checkPortable(path.join(ROOT, "src"));
    assert.deepEqual(problems, []);
    assert.ok(files.includes("index.js") && files.length >= 10);
    const cli = spawnSync(process.execPath, ["tools/check-portable.mjs"], { cwd: ROOT, encoding: "utf8" });
    assert.equal(cli.status, 0, cli.stdout);
    assert.match(cli.stdout, /check:portable OK/);
  });

  test("detects host APIs, non-relative imports and dynamic import", () => {
    const cases = {
      "a.js": 'import { readFileSync } from "node:fs";\nexport const x = 1;\n',
      "b.js": "export const y = () => process.env.KEY;\n",
      "c.js": "export async function f() { return fetch(\"https://x\"); }\n",
      "d.js": "export function g() { console.log(1); }\n",
      "e.js": "export const h = () => import(\"./a.js\");\n",
      "f.js": "export const k = globalThis.process;\n",
      "g.js": 'import x from "lodash";\nexport default x;\n',
      "h.js": "export const t = () => setTimeout(() => 0, 1);\n",
      "i.js": "export const b = Buffer.from(\"x\");\n",
      "j.js": "export const c = crypto.subtle;\n",
    };
    for (const [name, code] of Object.entries(cases)) writeFileSync(path.join(tmp, name), code);
    const { problems } = checkPortable(tmp);
    const flagged = new Set(problems.map((p) => p.file));
    for (const name of Object.keys(cases)) assert.ok(flagged.has(name), `${name} should be flagged`);
    const cli = spawnSync(process.execPath, ["tools/check-portable.mjs", tmp], { cwd: ROOT, encoding: "utf8" });
    assert.equal(cli.status, 1);
  });

  test("ignores words in comments, strings and regex literals", () => {
    const code = [
      "// never call fetch or console here; process is forbidden",
      "/* require(\"fs\") */",
      'export const s = "process console fetch";',
      "export const t = `fetch ${1 + 2} console`;",
      "export const r = /process|console/g;",
      "export const ok = globalThis.crypto.subtle;",
    ].join("\n");
    const { code: lexed } = lex(code);
    assert.ok(!/process|console|fetch|require/.test(lexed), lexed);
    assert.match(lexed, /globalThis\.crypto\.subtle/);
    assert.match(lexed, /\$\{1 \+ 2\}/);
  });
});
