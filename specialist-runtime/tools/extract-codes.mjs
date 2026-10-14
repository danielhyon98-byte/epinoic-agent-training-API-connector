#!/usr/bin/env node
// Extract internal codes from a bundle for the internal-code-leakage check.
//
//   node tools/extract-codes.mjs --bundle-module dist/history.bundle.mjs --pattern '<regex source>' [--out codes.json]
//   node tools/extract-codes.mjs --bundle-file /path/to/bundle.md       --pattern '<regex source>' [--out codes.json]
//
// --pattern is REQUIRED and has no default. It must come from History's
// handoff/04 or the bundle's own documented code convention; this tool does not
// guess one. The pattern is compiled with flags "gu" and every whole match is a
// code.
//
// Output (stdout, or --out): JSON
//   { "schema": "epinoic.specialist-bundle-codes.v1", "bundleSha256", "pattern", "codes": [sorted, unique] }
//
// Refuses (exit 1): a bundle module whose decoded bytes do not match its own
// sha256 or byteLength, non-canonical base64, invalid UTF-8, a pattern that
// matches the empty string, no matches, or matches that are benign vocabulary
// (paper names, HL/SL, years, "[15 marks]"...; see src/gate/benign.js), which
// means the pattern is too broad. Usage errors exit 2.
//
// The codes come from a proprietary bundle. Keep the output out of public
// repositories, like the bundle itself.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isBenignToken } from "../src/gate/benign.js";
import { decodeBase64Strict } from "../src/text.js";
import { UsageError, parseStrictArgs } from "./lib/args.mjs";

export const CODES_SCHEMA = "epinoic.specialist-bundle-codes.v1";

export class ExtractRefusal extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`);
    this.name = "ExtractRefusal";
    this.code = code;
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Bytes of a bundle module, verified against its own sha256 and byteLength. */
export async function bytesFromModule(modulePath) {
  const ns = await import(pathToFileURL(resolve(modulePath)).href);
  const mod = ns.BUNDLE;
  if (!mod || mod.schema !== "epinoic.specialist-bundle-module.v1" || typeof mod.base64 !== "string") {
    throw new ExtractRefusal("bundle_module_invalid", "not an epinoic.specialist-bundle-module.v1 module");
  }
  const bytes = decodeBase64Strict(mod.base64);
  if (bytes === null) throw new ExtractRefusal("invalid_base64", "the module's base64 is not canonical");
  if (bytes.length !== mod.byteLength || sha256(bytes) !== mod.sha256) {
    throw new ExtractRefusal("bundle_checksum_mismatch", "decoded bytes do not match the module's sha256/byteLength");
  }
  return bytes;
}

/**
 * Extract sorted unique codes.
 * @param {Uint8Array} bytes
 * @param {string} pattern RegExp source, compiled with flags "gu".
 */
export function extractCodes(bytes, pattern) {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new ExtractRefusal("invalid_utf8", "the bundle is not valid UTF-8");
  }
  let re;
  try {
    re = new RegExp(pattern, "gu");
  } catch (err) {
    throw new UsageError(`--pattern is not a valid regular expression: ${err.message}`);
  }
  if (new RegExp(pattern, "u").test("")) throw new ExtractRefusal("pattern_matches_empty", "the pattern matches the empty string");
  const codes = [...new Set(Array.from(text.matchAll(re), (m) => m[0]))].sort();
  if (codes.length === 0) throw new ExtractRefusal("no_codes_matched", "the pattern matched nothing; check it against handoff/04");
  const benign = codes.filter(isBenignToken);
  if (benign.length > 0) {
    throw new ExtractRefusal("codes_include_benign_tokens", `the pattern matches ordinary vocabulary (${benign.length} match(es)); tighten it`);
  }
  return { schema: CODES_SCHEMA, bundleSha256: sha256(bytes), pattern, codes };
}

const USAGE =
  "usage: node tools/extract-codes.mjs (--bundle-module <file.mjs> | --bundle-file <file>) --pattern <regex source> [--out <file.json>]\n" +
  "The pattern must come from handoff/04 or the bundle's documented code convention.\n";

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const args = parseStrictArgs(process.argv.slice(2), { required: ["pattern"], optional: ["bundle-module", "bundle-file", "out"] });
    const hasModule = "bundle-module" in args;
    if (hasModule === "bundle-file" in args) throw new UsageError("give exactly one of --bundle-module or --bundle-file");
    const bytes = hasModule ? await bytesFromModule(args["bundle-module"]) : readFileSync(resolve(args["bundle-file"]));
    const json = `${JSON.stringify(extractCodes(bytes, args.pattern), null, 2)}\n`;
    if (args.out) writeFileSync(resolve(args.out), json);
    else process.stdout.write(json);
  } catch (err) {
    if (err instanceof UsageError) {
      process.stderr.write(`extract-codes: ${err.message}\n${USAGE}`);
      process.exit(2);
    }
    if (err instanceof ExtractRefusal) {
      process.stderr.write(`extract-codes: refused: ${err.message}\n`);
      process.exit(1);
    }
    throw err;
  }
}
