#!/usr/bin/env node
/**
 * Static portability check for src/ (the runtime that must run unchanged in a
 * Cloudflare Worker and in Node 22).
 *
 * Rules, applied to code with comments removed and string/template text blanked:
 * - imports and re-exports use relative "./x.js" specifiers that resolve inside src/;
 *   no bare, "node:" or URL specifiers and no dynamic import();
 * - no host APIs: process, require, module, Buffer, fetch, XMLHttpRequest,
 *   WebSocket, EventSource, console, timers, Deno, Bun, eval, new Function,
 *   import.meta, __dirname, __filename, navigator, storage;
 * - globalThis is used only as globalThis.crypto (for crypto.subtle), and the
 *   bare name `crypto` only via globalThis.
 * Allowed host features: globalThis.crypto.subtle, TextEncoder, TextDecoder.
 *
 *   node tools/check-portable.mjs [srcDir]
 */

import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FORBIDDEN = [
  ["process", /\bprocess\b/],
  ["require", /\brequire\b/],
  ["module", /\bmodule\s*\.\s*exports\b/],
  ["Buffer", /\bBuffer\b/],
  ["fetch", /\bfetch\b/],
  ["XMLHttpRequest", /\bXMLHttpRequest\b/],
  ["WebSocket", /\bWebSocket\b/],
  ["EventSource", /\bEventSource\b/],
  ["console", /\bconsole\b/],
  ["timers", /\b(setTimeout|setInterval|setImmediate|queueMicrotask)\b/],
  ["Deno", /\bDeno\b/],
  ["Bun", /\bBun\b/],
  ["eval", /\beval\s*\(/],
  ["new Function", /\bnew\s+Function\b/],
  ["dynamic import", /\bimport\s*\(/],
  ["import.meta", /\bimport\s*\.\s*meta\b/],
  ["__dirname/__filename", /\b(__dirname|__filename)\b/],
  ["navigator", /\bnavigator\b/],
  ["storage", /\b(localStorage|sessionStorage|indexedDB|caches)\b/],
  ["globalThis other than crypto", /\bglobalThis\s*\.\s*(?!crypto\b)\w+/],
  ["globalThis indexing", /\bglobalThis\s*\[/],
  ["bare crypto", /(?<!globalThis\s*\.\s*)\bcrypto\b(?!\s*:)/],
];

/**
 * Remove comments and blank string, template and regex literal text, keeping
 * line structure and template `${...}` expressions (which are code).
 * Also collects import/export specifiers with their line numbers.
 * @param {string} src
 * @returns {{code: string, specifiers: {spec: string, line: number}[]}}
 */
export function lex(src) {
  let out = "";
  const specifiers = [];
  let line = 1;
  let i = 0;
  const stack = []; // brace depth inside each open template expression
  let prev = ""; // last significant characters, for the regex-vs-division heuristic
  const regexCanFollow = () =>
    prev === "" || /[=(,:[!&|?{};+\-*%<>~^]$/.test(prev) || /\b(return|typeof|case|in|of|delete|void|throw|new)$/.test(prev);

  const templateText = () => {
    // i is just inside a template (after "`" or after the "}" closing an expression)
    while (i < src.length) {
      const c = src[i];
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === "`") {
        out += "`";
        i += 1;
        prev = "x";
        return;
      }
      if (c === "$" && src[i + 1] === "{") {
        out += "${";
        i += 2;
        stack.push(0);
        prev = "{";
        return;
      }
      if (c === "\n") {
        out += "\n";
        line += 1;
      }
      i += 1;
    }
  };

  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (c === "/" && n === "/") {
      while (i < src.length && src[i] !== "\n") i += 1;
    } else if (c === "/" && n === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? src.length : end + 2;
      for (let k = i; k < stop; k += 1) {
        if (src[k] === "\n") {
          out += "\n";
          line += 1;
        }
      }
      i = stop;
    } else if (c === "'" || c === '"') {
      const startLine = line;
      let j = i + 1;
      let value = "";
      while (j < src.length && src[j] !== c && src[j] !== "\n") {
        if (src[j] === "\\") {
          value += src[j + 1];
          j += 2;
        } else {
          value += src[j];
          j += 1;
        }
      }
      if (/\b(from|import)\s*$/.test(out)) specifiers.push({ spec: value, line: startLine });
      out += c + c;
      i = j + 1;
      prev = "x";
    } else if (c === "`") {
      out += "`";
      i += 1;
      templateText();
    } else if (c === "/" && regexCanFollow()) {
      let j = i + 1;
      let inClass = false;
      while (j < src.length && src[j] !== "\n") {
        if (src[j] === "\\") {
          j += 2;
          continue;
        }
        if (src[j] === "[") inClass = true;
        else if (src[j] === "]") inClass = false;
        else if (src[j] === "/" && !inClass) break;
        j += 1;
      }
      j += 1;
      while (j < src.length && /[a-z]/.test(src[j])) j += 1;
      out += "/regex/";
      i = j;
      prev = "x";
    } else if (c === "}" && stack.length && stack[stack.length - 1] === 0) {
      stack.pop();
      out += "}";
      i += 1;
      templateText();
    } else {
      if (stack.length) {
        if (c === "{") stack[stack.length - 1] += 1;
        else if (c === "}") stack[stack.length - 1] -= 1;
      }
      if (c === "\n") line += 1;
      out += c;
      if (!/\s/.test(c)) prev = (prev + c).slice(-12);
      i += 1;
    }
  }
  return { code: out, specifiers };
}

/** @param {string} dir @returns {string[]} */
function listJs(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listJs(full));
    else if (/\.(m?js)$/.test(entry.name)) out.push(full);
  }
  return out.sort();
}

/**
 * Check every .js/.mjs file under srcDir.
 * @param {string} srcDir
 * @returns {{files: string[], problems: {file: string, line: number, rule: string}[]}}
 */
export function checkPortable(srcDir) {
  const root = realpathSync(srcDir);
  const files = listJs(root);
  const problems = [];
  for (const file of files) {
    const rel = path.relative(root, file);
    const { code, specifiers } = lex(readFileSync(file, "utf8"));
    for (const { spec, line } of specifiers) {
      const target = path.resolve(path.dirname(file), spec);
      const inside = target.startsWith(root + path.sep);
      if (!spec.startsWith("./") && !spec.startsWith("../")) problems.push({ file: rel, line, rule: `non-relative import "${spec}"` });
      else if (!spec.endsWith(".js") || !inside || !existsSync(target) || !statSync(target).isFile()) {
        problems.push({ file: rel, line, rule: `import "${spec}" does not resolve to a .js file inside src/` });
      }
    }
    code.split("\n").forEach((text, idx) => {
      for (const [rule, re] of FORBIDDEN) if (re.test(text)) problems.push({ file: rel, line: idx + 1, rule });
    });
  }
  return { files: files.map((f) => path.relative(root, f)), problems };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const dir = process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
  const { files, problems } = checkPortable(dir);
  for (const p of problems) process.stdout.write(`NOT PORTABLE ${p.file}:${p.line} ${p.rule}\n`);
  process.stdout.write(problems.length
    ? `check:portable FAILED: ${problems.length} problem(s) in ${files.length} files\n`
    : `check:portable OK: ${files.length} files in src/ use only relative imports, globalThis.crypto.subtle, TextEncoder and TextDecoder\n`);
  process.exitCode = problems.length ? 1 : 0;
}
