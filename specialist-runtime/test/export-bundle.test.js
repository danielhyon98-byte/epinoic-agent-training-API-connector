// Exercises tools/export-bundle.mjs against throwaway git repositories under
// os.tmpdir(). The bundle file in them is SYNTHETIC.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createOfflineTestRuntime } from "../src/index.js";
import { ExportRefusal, exportBundle } from "../tools/export-bundle.mjs";
import { SYNTHETIC_GATE_CONFIG } from "../fixtures/synthetic/gate-config.js";
import { syntheticManifestWith } from "../fixtures/synthetic/manifest.js";

const TOOL = fileURLToPath(new URL("../tools/export-bundle.mjs", import.meta.url));
const BUNDLE_PATH = "knowledge-bases/history/bundle.md";
const BYTES = Buffer.concat([
  Buffer.from([0xef, 0xbb, 0xbf]),
  Buffer.from("SYNTHETIC EXPORT TEST BUNDLE - not Epinoic content\r\nSecond line\r\n", "utf8"),
]);
const SHA = createHash("sha256").update(BYTES).digest("hex");

const temps = [];
test.after(() => {
  for (const dir of temps) rmSync(dir, { recursive: true, force: true });
});

function tempDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
}

function git(dir, ...args) {
  return execFileSync("git", ["-C", dir, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function commitAll(dir, message) {
  git(dir, "add", "-A");
  git(dir, "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", "commit", "-q", "-m", message);
  return git(dir, "rev-parse", "HEAD");
}

function makeKbRepo() {
  const dir = tempDir("epinoic-kb-");
  git(dir, "init", "-q");
  git(dir, "config", "user.name", "synthetic-test");
  git(dir, "config", "user.email", "synthetic-test@example.invalid");
  git(dir, "config", "core.autocrlf", "false");
  mkdirSync(join(dir, "knowledge-bases/history"), { recursive: true });
  writeFileSync(join(dir, BUNDLE_PATH), BYTES);
  writeFileSync(join(dir, "README.md"), "synthetic test repository\n");
  const commit = commitAll(dir, "synthetic bundle");
  return { dir, commit };
}

function manifestFor(commit, overrides = {}) {
  return syntheticManifestWith({
    source: { repo: "synthetic/export-test", commit, bundlePath: BUNDLE_PATH },
    kbVersion: "synthetic-kb-1",
    bundleSha256: SHA,
    ...overrides,
  });
}

function refusal(fn, code) {
  assert.throws(fn, (err) => {
    assert.ok(err instanceof ExportRefusal, String(err));
    assert.equal(err.code, code);
    return true;
  });
}

function outPath() {
  return join(tempDir("epinoic-out-"), "dist", "history.bundle.mjs");
}

test("exports exact bytes; the module loads through loadPinnedBundle with BOM and CRLF intact", async () => {
  const { dir, commit } = makeKbRepo();
  const out = outPath();
  const manifest = manifestFor(commit);
  const result = exportBundle({ kbCheckout: dir, commit, slug: "history", bundlePath: BUNDLE_PATH, out, kbVersion: "synthetic-kb-1", manifest });
  assert.equal(result.sha256, SHA);
  assert.equal(result.byteLength, BYTES.length);
  const { BUNDLE } = await import(pathToFileURL(out).href);
  assert.ok(Object.isFrozen(BUNDLE));
  assert.deepEqual(Object.keys(BUNDLE), ["schema", "slug", "sourceRepo", "sourceCommit", "bundlePath", "kbVersion", "sha256", "byteLength", "base64"]);
  assert.equal(BUNDLE.sourceCommit, commit);
  assert.deepEqual(Buffer.from(BUNDLE.base64, "base64"), BYTES);
  const rt = createOfflineTestRuntime({ manifest, gateConfigs: { history: SYNTHETIC_GATE_CONFIG } });
  const verified = await rt.loadPinnedBundle({ slug: "history", bundleModule: BUNDLE, environment: "offline-test" });
  assert.deepEqual(Buffer.from(new TextEncoder().encode(verified.text)), BYTES);
  assert.equal(verified.text.charCodeAt(0), 0xfeff);
});

test("refuses when HEAD differs from --commit", () => {
  const { dir, commit } = makeKbRepo();
  writeFileSync(join(dir, "README.md"), "changed\n");
  const newer = commitAll(dir, "later commit");
  refusal(() => exportBundle({ kbCheckout: dir, commit, slug: "history", bundlePath: BUNDLE_PATH, out: outPath(), manifest: manifestFor(commit) }), "head_mismatch");
  refusal(() => exportBundle({ kbCheckout: dir, commit: newer, slug: "history", bundlePath: BUNDLE_PATH, out: outPath(), manifest: manifestFor(commit) }), "commit_not_pinned");
});

test("refuses a dirty, staged or untracked bundle path", () => {
  const { dir, commit } = makeKbRepo();
  appendFileSync(join(dir, BUNDLE_PATH), "edit\n");
  refusal(() => exportBundle({ kbCheckout: dir, commit, slug: "history", bundlePath: BUNDLE_PATH, out: outPath(), manifest: manifestFor(commit) }), "bundle_path_dirty");
  git(dir, "add", BUNDLE_PATH);
  refusal(() => exportBundle({ kbCheckout: dir, commit, slug: "history", bundlePath: BUNDLE_PATH, out: outPath(), manifest: manifestFor(commit) }), "bundle_path_dirty");

  const other = makeKbRepo();
  writeFileSync(join(other.dir, "knowledge-bases/history/new.md"), "untracked\n");
  const manifest = manifestFor(other.commit, { source: { repo: "synthetic/export-test", commit: other.commit, bundlePath: "knowledge-bases/history/new.md" } });
  refusal(() => exportBundle({ kbCheckout: other.dir, commit: other.commit, slug: "history", bundlePath: "knowledge-bases/history/new.md", out: outPath(), manifest }), "bundle_path_untracked");
});

test("refuses working-tree bytes that differ from the committed blob even when git status looks clean", () => {
  const { dir, commit } = makeKbRepo();
  git(dir, "update-index", "--assume-unchanged", BUNDLE_PATH);
  appendFileSync(join(dir, BUNDLE_PATH), "hidden edit\n");
  assert.equal(git(dir, "status", "--porcelain", "--", BUNDLE_PATH), "");
  refusal(() => exportBundle({ kbCheckout: dir, commit, slug: "history", bundlePath: BUNDLE_PATH, out: outPath(), manifest: manifestFor(commit) }), "worktree_differs_from_commit");
});

test("refuses a SHA-256 that differs from the manifest (default: the pinned RUNTIME_MANIFEST)", () => {
  const { dir, commit } = makeKbRepo();
  const out = outPath();
  refusal(() => exportBundle({ kbCheckout: dir, commit, slug: "history", bundlePath: BUNDLE_PATH, out }), "sha256_mismatch");
  assert.equal(existsSync(out), false, "nothing written");
  refusal(() => exportBundle({ kbCheckout: dir, commit, slug: "history", bundlePath: BUNDLE_PATH, out, manifest: manifestFor(commit, { bundleSha256: "0".repeat(64) }) }), "sha256_mismatch");
});

test("refuses bad arguments and unsafe locations", () => {
  const { dir, commit } = makeKbRepo();
  const m = manifestFor(commit);
  const base = { kbCheckout: dir, commit, slug: "history", bundlePath: BUNDLE_PATH, out: outPath(), manifest: m };
  refusal(() => exportBundle({ ...base, commit: commit.slice(0, 12) }), "commit_invalid");
  refusal(() => exportBundle({ ...base, slug: "economics" }), "unknown_slug");
  refusal(() => exportBundle({ ...base, bundlePath: "../outside.md" }), "bundle_path_invalid");
  refusal(() => exportBundle({ ...base, bundlePath: "/etc/passwd" }), "bundle_path_invalid");
  refusal(() => exportBundle({ ...base, kbVersion: "other-version" }), "kb_version_not_pinned");
  refusal(() => exportBundle({ ...base, kbCheckout: join(dir, "knowledge-bases") }), "checkout_not_git_toplevel");
  refusal(() => exportBundle({ ...base, kbCheckout: tempDir("epinoic-nogit-") }), "checkout_not_git_toplevel");
  refusal(() => exportBundle({ ...base, out: join(dir, "dist", "history.bundle.mjs") }), "out_path_inside_checkout");
  refusal(() => exportBundle({ ...base, out: join(tempDir("epinoic-out-"), "history.bundle.js") }), "out_path_invalid");

  const publicRepo = tempDir("epinoic-public-");
  git(publicRepo, "init", "-q");
  refusal(() => exportBundle({ ...base, out: join(publicRepo, "history.bundle.mjs") }), "out_path_not_ignored");
  writeFileSync(join(publicRepo, ".gitignore"), "dist/\n");
  const ok = exportBundle({ ...base, out: join(publicRepo, "dist", "history.bundle.mjs") });
  assert.equal(ok.sha256, SHA, "an ignored path inside a repository is allowed");
});

test("CLI: refuses with exit 1 and writes nothing; unknown or bypass-style options exit 2", () => {
  const { dir, commit } = makeKbRepo();
  const out = outPath();
  const args = ["--kb-checkout", dir, "--commit", commit, "--slug", "history", "--bundle-path", BUNDLE_PATH, "--out", out];
  const refused = spawnSync(process.execPath, [TOOL, ...args], { encoding: "utf8" });
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /refused: sha256_mismatch/);
  assert.equal(existsSync(out), false);
  for (const extra of [["--force", "yes"], ["--skip-sha", "1"], ["--manifest", "x.js"]]) {
    const r = spawnSync(process.execPath, [TOOL, ...args, ...extra], { encoding: "utf8" });
    assert.equal(r.status, 2, extra[0]);
    assert.match(r.stderr, /unknown option/);
  }
  const missing = spawnSync(process.execPath, [TOOL, "--slug", "history"], { encoding: "utf8" });
  assert.equal(missing.status, 2);
  const dup = spawnSync(process.execPath, [TOOL, ...args, "--slug", "history"], { encoding: "utf8" });
  assert.equal(dup.status, 2);
});
