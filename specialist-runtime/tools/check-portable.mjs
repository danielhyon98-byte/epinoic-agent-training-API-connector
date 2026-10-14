#!/usr/bin/env node
// Static portability scan of specialist-runtime/src/.
//
// The runtime must run unchanged in Cloudflare Workers and Node 22. It may use
// only globalThis.crypto.subtle, TextEncoder/TextDecoder, atob/btoa and
// AbortSignal, plus language built-ins. This scan fails on:
//   - any import that is not a relative "./" or "../" path to a .js file inside src/
//     (so node:*, fs, path, crypto and every package import are refused),
//   - dynamic import(), import.meta, require(), module.exports,
//   - process, console, fetch and other network APIs, Buffer, Date,
//     Math.random, crypto.getRandomValues/randomUUID, timers, performance,
//     eval/Function, host globals, and globalThis/crypto access other than
//     globalThis.crypto.subtle,
//   - any file in src/ that is not a .js file.
// Comments, string literals, template text and regex literals are blanked
// before scanning, so prose such as "never calls console" is not flagged.
//
//   node tools/check-portable.mjs      (exit 0 when clean, 1 with findings)

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const REGEX_AFTER_WORD = new Set([
  "return", "typeof", "instanceof", "in", "of", "new", "delete", "void", "throw", "case", "do", "else", "yield", "await",
]);

/**
 * Blank comments, strings, template text and regex literals. String and
 * template-text contents are collected; each is replaced by a placeholder
 * "#<index>" in double quotes. Newlines are preserved for line numbers.
 * @param {string} src
 * @returns {{ code: string, strings: string[] }}
 */
export function stripSource(src) {
  const n = src.length;
  const strings = [];
  const templateStack = [];
  let out = "";
  let i = 0;
  let braceDepth = 0;
  let prev = "";

  const newlinesIn = (s) => "\n".repeat((s.match(/\n/g) ?? []).length);
  const placeholder = (content, raw) => {
    strings.push(content);
    out += `"#${strings.length - 1}"` + newlinesIn(raw);
  };
  const regexAllowed = () => {
    if (prev === "") return true;
    if (prev.startsWith("word:")) return REGEX_AFTER_WORD.has(prev.slice(5));
    if (prev === "value") return false;
    return ![")", "]", "}"].includes(prev.slice(6));
  };
  // Reads template text from `start` up to "`" or "${". Returns the next index.
  const readTemplateText = (start) => {
    let j = start;
    let content = "";
    while (j < n) {
      if (src[j] === "\\") {
        content += src.slice(j, j + 2);
        j += 2;
      } else if (src[j] === "`") {
        placeholder(content, content);
        return j + 1;
      } else if (src[j] === "$" && src[j + 1] === "{") {
        placeholder(content, content);
        out += "${";
        templateStack.push(braceDepth);
        return j + 2;
      } else {
        content += src[j++];
      }
    }
    placeholder(content, content);
    return n;
  };

  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "/" && d === "/") {
      const end = src.indexOf("\n", i);
      i = end === -1 ? n : end;
    } else if (c === "/" && d === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? n : end + 2;
      out += src.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      let content = "";
      while (j < n && src[j] !== c && src[j] !== "\n") {
        if (src[j] === "\\") {
          content += src.slice(j, j + 2);
          j += 2;
        } else content += src[j++];
      }
      placeholder(content, "");
      i = j + 1;
      prev = "value";
    } else if (c === "`") {
      i = readTemplateText(i + 1);
      prev = "value";
    } else if (c === "}" && templateStack.length > 0 && templateStack[templateStack.length - 1] === braceDepth) {
      templateStack.pop();
      out += "}";
      i = readTemplateText(i + 1);
      prev = "value";
    } else if (c === "/" && regexAllowed()) {
      let j = i + 1;
      let inClass = false;
      while (j < n && src[j] !== "\n") {
        if (src[j] === "\\") j += 2;
        else {
          if (src[j] === "[") inClass = true;
          else if (src[j] === "]") inClass = false;
          else if (src[j] === "/" && !inClass) break;
          j++;
        }
      }
      j++;
      while (j < n && /[a-z]/.test(src[j])) j++;
      out += "/r/";
      i = j;
      prev = "value";
    } else if (/[A-Za-z_$]/.test(c)) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const word = src.slice(i, j);
      out += word;
      prev = `word:${word}`;
      i = j;
    } else if (/[0-9]/.test(c)) {
      let j = i + 1;
      while (j < n && /[0-9A-Za-z_.]/.test(src[j])) j++;
      out += src.slice(i, j);
      prev = "value";
      i = j;
    } else if (/\s/.test(c)) {
      out += c;
      i++;
    } else {
      if (c === "{") braceDepth++;
      else if (c === "}") braceDepth--;
      out += c;
      prev = `punct:${c}`;
      i++;
    }
  }
  return { code: out, strings };
}

const FORBIDDEN = Object.freeze([
  [/\bimport\s*\(/, "dynamic import()"],
  [/\bimport\s*\.\s*meta\b/, "import.meta"],
  [/\brequire\s*\(/, "require()"],
  [/\bmodule\s*\.\s*exports\b/, "module.exports"],
  [/\bprocess\b/, "process"],
  [/\bconsole\b/, "console"],
  [/\bfetch\b/, "fetch"],
  [/\b(?:XMLHttpRequest|WebSocket|EventSource|navigator|caches|Request|Response|Headers|FormData|importScripts)\b/, "network or host API"],
  [/\bBuffer\b/, "Buffer"],
  [/\bDate\b/, "Date"],
  [/\bMath\s*\.\s*random\b/, "Math.random"],
  [/\b(?:getRandomValues|randomUUID)\b/, "crypto randomness"],
  [/\b(?:setTimeout|setInterval|setImmediate|queueMicrotask)\b/, "timers"],
  [/\bperformance\b/, "performance"],
  [/\beval\b/, "eval"],
  [/\bFunction\b/, "Function constructor"],
  [/\b(?:__dirname|__filename|global|Deno|Bun|window|document|self|localStorage|sessionStorage|indexedDB)\b/, "host global"],
  [/\b(?:WebAssembly|SharedArrayBuffer|Atomics|Worker|structuredClone)\b/, "unsupported global"],
  [/\bglobalThis\s*(?:\[|\.\s*(?!crypto\b))/, "globalThis access other than globalThis.crypto.subtle"],
  [/\bcrypto\s*(?:\[|\.\s*(?!subtle\b))/, "crypto access other than crypto.subtle"],
]);

function lineOf(code, index) {
  return code.slice(0, index).split("\n").length;
}

/**
 * Scan one source file. `file` is its absolute path and `srcRoot` the src/
 * directory, used to check that relative imports stay inside src/.
 * @param {string} source
 * @param {{ file: string, srcRoot: string }} where
 * @returns {{ file: string, line: number, rule: string }[]}
 */
export function scanSource(source, { file, srcRoot }) {
  const findings = [];
  const { code, strings } = stripSource(source);
  for (const [re, rule] of FORBIDDEN) {
    const global = new RegExp(re.source, "g");
    let m;
    while ((m = global.exec(code)) !== null) findings.push({ file, line: lineOf(code, m.index), rule });
  }
  const specifiers = /\b(?:from\s*|import\s*)"#(\d+)"/g;
  let m;
  while ((m = specifiers.exec(code)) !== null) {
    const spec = strings[Number(m[1])];
    const line = lineOf(code, m.index);
    if (!/^\.\.?\//.test(spec) || !spec.endsWith(".js")) {
      findings.push({ file, line, rule: `non-relative or non-.js import "${spec}"` });
      continue;
    }
    const target = resolve(dirname(file), spec);
    if (target !== srcRoot && !target.startsWith(srcRoot + sep)) {
      findings.push({ file, line, rule: `import outside src/ "${spec}"` });
    }
  }
  return findings;
}

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? listFiles(p) : [p];
  });
}

/**
 * Scan every file under a src/ directory.
 * @param {string} srcRoot
 */
export function scanDirectory(srcRoot) {
  const root = resolve(srcRoot);
  const files = listFiles(root).sort();
  const findings = [];
  for (const file of files) {
    if (!file.endsWith(".js")) {
      findings.push({ file, line: 0, rule: "non-.js file in src/" });
      continue;
    }
    findings.push(...scanSource(readFileSync(file, "utf8"), { file, srcRoot: root }));
  }
  return { files, findings };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const srcRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "src");
  const { files, findings } = scanDirectory(srcRoot);
  if (findings.length > 0) {
    for (const f of findings) process.stderr.write(`${relative(process.cwd(), f.file)}:${f.line}: forbidden: ${f.rule}\n`);
    process.stderr.write(`check-portable: FAILED (${findings.length} finding(s) in ${files.length} files)\n`);
    process.exit(1);
  }
  process.stdout.write(`check-portable: OK (${files.length} files in src/, no forbidden imports or globals)\n`);
}
