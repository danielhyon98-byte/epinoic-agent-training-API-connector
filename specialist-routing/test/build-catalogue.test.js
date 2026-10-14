import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";
import { validateCatalogue } from "../src/index.js";
import { BuildRefused, buildCatalogue } from "../tools/build-catalogue.mjs";
import { ROOT, clone, readJsonFile } from "./helpers.js";

const overlay = readJsonFile("catalogue/routing-overlay.json");
const roster = JSON.parse(readFileSync(path.join(ROOT, "..", "agents", "agents.json"), "utf8"));
const slugs = overlay.subjects.map((s) => s.slug);
const temps = [];
after(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

const sha256 = (data) => createHash("sha256").update(data).digest("hex");
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

/** Create a temporary git checkout with fake package directories. */
function makeRepo({ packages = slugs, extraDirs = [], kbName = "knowledge-bases", ignored = [] } = {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "routing-kb-"));
  temps.push(dir);
  git(dir, "init", "-q");
  git(dir, "config", "user.name", "Routing Test");
  git(dir, "config", "user.email", "routing-test@example.invalid");
  const kb = path.join(dir, kbName);
  for (const name of [...packages, ...extraDirs]) {
    mkdirSync(path.join(kb, name, "notes"), { recursive: true });
    writeFileSync(path.join(kb, name, "MASTER.md"), `Synthetic package ${name}\n`);
    writeFileSync(path.join(kb, name, "notes", "b.md"), `notes for ${name}\r\n`);
  }
  writeFileSync(path.join(kb, "README.md"), "top-level files are not packages\n");
  for (const name of ignored) {
    mkdirSync(path.join(kb, name), { recursive: true });
    writeFileSync(path.join(kb, name, "cache.tmp"), "ignored\n");
  }
  if (ignored.length) writeFileSync(path.join(dir, ".gitignore"), "*.tmp\n");
  git(dir, "add", "-A");
  git(dir, "-c", "commit.gpgsign=false", "commit", "-q", "-m", "fixture");
  return { dir, kb, head: git(dir, "rev-parse", "HEAD") };
}

/** @param {() => unknown} fn @param {RegExp} pattern */
function refused(fn, pattern) {
  assert.throws(fn, (e) => e instanceof BuildRefused && pattern.test(e.message));
}

describe("build-catalogue: synthetic mode", () => {
  test("rebuilding reproduces the committed fixture exactly", () => {
    const built = buildCatalogue({ synthetic: true, overlay, roster });
    assert.equal(`${JSON.stringify(built, null, 2)}\n`, readFileSync(path.join(ROOT, "fixtures", "catalogue.synthetic.json"), "utf8"));
    assert.equal(built.synthetic, true);
    assert.equal(built.source.commit, null);
    assert.ok(built.subjects.every((s) => s.evidence === null));
  });

  test("refuses to mix --synthetic with --kb or --commit, and refuses a non-synthetic build without a checkout", () => {
    refused(() => buildCatalogue({ synthetic: true, overlay, roster, kb: "/tmp" }), /cannot be combined/);
    refused(() => buildCatalogue({ synthetic: false, overlay, roster }), /needs --kb/);
    refused(() => buildCatalogue({ synthetic: false, overlay, roster, kb: "/tmp" }), /needs --kb/);
  });

  test("refuses an overlay that drifts from the roster", () => {
    const a = clone(overlay);
    a.subjects.find((s) => s.slug === "physics").slugStatus = "handoff";
    refused(() => buildCatalogue({ synthetic: true, overlay: a, roster }), /slugStatus/);
    const b = clone(overlay);
    b.subjects.pop();
    refused(() => buildCatalogue({ synthetic: true, overlay: b, roster }), /missing/);
    const c = clone(overlay);
    c.subjects[0].model = "x";
    refused(() => buildCatalogue({ synthetic: true, overlay: c, roster }), /unknown field/);
  });

  test("refuses an overlay whose catalogue would not validate", () => {
    const a = clone(overlay);
    a.subjects.find((s) => s.slug === "chemistry").aliases.push("bio");
    refused(() => buildCatalogue({ synthetic: true, overlay: a, roster }), /alias_collision/);
  });

  test("CLI: exit 0 for a synthetic build, exit 2 with REFUSED otherwise", () => {
    const out = path.join(mkdtempSync(path.join(os.tmpdir(), "routing-out-")), "c.json");
    temps.push(path.dirname(out));
    const ok = spawnSync(process.execPath, ["tools/build-catalogue.mjs", "--synthetic", "--overlay", "catalogue/routing-overlay.json", "--roster", "../agents/agents.json", "--out", out], { cwd: ROOT, encoding: "utf8" });
    assert.equal(ok.status, 0, ok.stderr);
    assert.equal(readFileSync(out, "utf8"), readFileSync(path.join(ROOT, "fixtures", "catalogue.synthetic.json"), "utf8"));
    const bad = spawnSync(process.execPath, ["tools/build-catalogue.mjs", "--overlay", "catalogue/routing-overlay.json", "--roster", "../agents/agents.json", "--out", out], { cwd: ROOT, encoding: "utf8" });
    assert.equal(bad.status, 2);
    assert.match(bad.stderr, /^REFUSED: /);
  });
});

describe("build-catalogue: real mode against a temporary git checkout", () => {
  test("succeeds on a clean checkout at the pinned commit and computes per-package digests", () => {
    const repo = makeRepo();
    const c = buildCatalogue({ overlay, roster, kb: repo.kb, commit: repo.head });
    assert.deepEqual(validateCatalogue(c).errors, []);
    assert.equal(c.synthetic, false);
    assert.equal(c.source.commit, repo.head);
    assert.equal(c.source.packagesPath, "knowledge-bases");
    assert.deepEqual(Object.keys(c.source.packageDigests).sort(), [...slugs].sort());
    const lines = [
      `MASTER.md\0${sha256("Synthetic package history\n")}\n`,
      `notes/b.md\0${sha256("notes for history\r\n")}\n`,
    ].sort();
    assert.equal(c.source.packageDigests.history, sha256(lines.join("")));
    const history = c.subjects.find((s) => s.slug === "history");
    assert.deepEqual(history.evidence, { path: "knowledge-bases/history", sha256: c.source.packageDigests.history });
    assert.notEqual(c.source.packageDigests.history, c.source.packageDigests.physics);
  });

  test("refuses when an overlay slug has no directory", () => {
    const repo = makeRepo({ packages: slugs.filter((s) => s !== "ess") });
    refused(() => buildCatalogue({ overlay, roster, kb: repo.kb, commit: repo.head }), /ess has no directory/);
  });

  test("refuses an extra directory unless it is explicitly excluded", () => {
    const repo = makeRepo({ extraDirs: ["drama"] });
    refused(() => buildCatalogue({ overlay, roster, kb: repo.kb, commit: repo.head }), /drama is neither an overlay slug nor in overlay.excluded/);
    const withExcluded = { ...clone(overlay), excluded: ["drama"] };
    assert.equal(buildCatalogue({ overlay: withExcluded, roster, kb: repo.kb, commit: repo.head }).synthetic, false);
  });

  test("refuses a dirty tree: modified or untracked files", () => {
    const repo = makeRepo();
    writeFileSync(path.join(repo.kb, "history", "MASTER.md"), "edited\n");
    refused(() => buildCatalogue({ overlay, roster, kb: repo.kb, commit: repo.head }), /not clean/);
    const repo2 = makeRepo();
    writeFileSync(path.join(repo2.kb, "physics", "new.md"), "untracked\n");
    refused(() => buildCatalogue({ overlay, roster, kb: repo2.kb, commit: repo2.head }), /not clean/);
  });

  test("refuses a commit that is not HEAD or not 40-hex", () => {
    const repo = makeRepo();
    refused(() => buildCatalogue({ overlay, roster, kb: repo.kb, commit: "0".repeat(40) }), /does not equal --commit/);
    refused(() => buildCatalogue({ overlay, roster, kb: repo.kb, commit: repo.head.slice(0, 12) }), /40 lower-case hex/);
  });

  test("refuses a --kb directory that is not at overlay.source.packagesPath, or not in git", () => {
    const repo = makeRepo({ kbName: "kbs" });
    refused(() => buildCatalogue({ overlay, roster, kb: repo.kb, commit: repo.head }), /packagesPath/);
    const plain = mkdtempSync(path.join(os.tmpdir(), "routing-nogit-"));
    temps.push(plain);
    refused(() => buildCatalogue({ overlay, roster, kb: plain, commit: "a".repeat(40) }), /git checkout/);
    refused(() => buildCatalogue({ overlay, roster, kb: path.join(plain, "missing"), commit: "a".repeat(40) }), /not a readable directory/);
  });

  test("refuses a package directory with no tracked files", () => {
    const repo = makeRepo({ packages: slugs.filter((s) => s !== "chemistry"), ignored: ["chemistry"] });
    refused(() => buildCatalogue({ overlay, roster, kb: repo.kb, commit: repo.head }), /chemistry has no tracked files/);
  });
});
