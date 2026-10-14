import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

test("test/index.js imports every *.test.js file, so `node --test test/` runs them all", () => {
  const dir = new URL("./", import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith(".test.js")).sort();
  const index = readFileSync(new URL("./index.js", import.meta.url), "utf8");
  const imported = [...index.matchAll(/^import "\.\/([^"]+)";$/gm)].map((m) => m[1]).sort();
  assert.deepEqual(imported, files);
});
