// Entry point for `npm test` (`node --test test/`).
//
// Node 22 does not expand a directory argument to `--test`: it treats "test/" as a
// module path and loads this index.js. This file therefore imports every
// *.test.js file in the directory so they all run. The import only happens when
// the directory itself is the entry, so a bare `node --test` (which runs each
// file on its own) does not run the tests twice.
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entry === dir) {
  for (const name of readdirSync(dir).filter((f) => f.endsWith(".test.js")).sort()) {
    await import(pathToFileURL(path.join(dir, name)).href);
  }
}
