#!/usr/bin/env node
/**
 * Build the routing catalogue (`epinoic.routing-catalogue.v1`) from the
 * hand-curated overlay and the agent roster. Node-only build tool.
 *
 * Synthetic mode (the only mode usable in this repository):
 *   node tools/build-catalogue.mjs --synthetic --overlay catalogue/routing-overlay.json \
 *     --roster ../agents/agents.json --out fixtures/catalogue.synthetic.json
 *   -> synthetic: true, source.commit: null, packageDigests: {}, every evidence: null.
 *
 * Real mode (needs a real Agent-Training checkout):
 *   node tools/build-catalogue.mjs --kb <checkout>/knowledge-bases --commit <40-hex> \
 *     --overlay catalogue/routing-overlay.json --roster ../agents/agents.json --out <file>
 *   Refuses unless: HEAD equals --commit; the working tree is clean (no staged,
 *   unstaged or untracked changes); --kb sits at overlay.source.packagesPath in
 *   that repository; every overlay slug has a directory; every directory is an
 *   overlay slug or listed in overlay.excluded; every package has tracked files
 *   and no symlinks. Per-package digest = SHA-256 over the sorted lines
 *   "relativePath\0sha256(fileBytes)\n" for the package's git-tracked files
 *   (relativePath is relative to the package directory, POSIX separators,
 *   sorted by JavaScript string order).
 *
 * The output is validated with validateCatalogue before it is written. There is
 * no way to ask for a non-synthetic catalogue without a real checkout.
 */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateCatalogue } from "../src/catalogue.js";
import { SCHEMAS } from "../src/version.js";

/** Error that means "refused"; the CLI exits with status 2. */
export class BuildRefused extends Error {
  constructor(message) {
    super(message);
    this.name = "BuildRefused";
  }
}

const OVERLAY_KEYS = ["schema", "overlayVersion", "note", "source", "excluded", "families", "subjects", "overlapPolicies", "taskContextTerms", "unresolvedDecisions"];
const OVERLAY_SUBJECT_KEYS = ["slug", "displayName", "family", "teachingScope", "aliases", "overlapGroups", "isLanguageCourse", "slugStatus"];

/**
 * @param {any} overlay
 * @param {any} roster
 */
function checkOverlayAgainstRoster(overlay, roster) {
  if (!overlay || overlay.schema !== "epinoic.routing-overlay.v1") throw new BuildRefused("overlay: unexpected schema");
  for (const key of Object.keys(overlay)) if (!OVERLAY_KEYS.includes(key)) throw new BuildRefused(`overlay: unknown field ${key}`);
  for (const key of OVERLAY_KEYS) if (!(key in overlay)) throw new BuildRefused(`overlay: missing field ${key}`);
  if (!roster || roster.schema !== "epinoic.agent-roster.v1" || !Array.isArray(roster.agents)) {
    throw new BuildRefused("roster: unexpected schema");
  }
  const agents = new Map(roster.agents.map((a) => [a.slug, a]));
  const slugs = overlay.subjects.map((s) => s.slug);
  if (agents.size !== roster.agents.length) throw new BuildRefused("roster: duplicate slugs");
  for (const slug of agents.keys()) if (!slugs.includes(slug)) throw new BuildRefused(`overlay: roster slug ${slug} is missing`);
  for (const s of overlay.subjects) {
    for (const key of Object.keys(s)) if (!OVERLAY_SUBJECT_KEYS.includes(key)) throw new BuildRefused(`overlay ${s.slug}: unknown field ${key}`);
    const agent = agents.get(s.slug);
    if (!agent) throw new BuildRefused(`overlay: slug ${s.slug} is not in the roster`);
    if (s.slugStatus !== agent.slugSource) throw new BuildRefused(`overlay ${s.slug}: slugStatus ${s.slugStatus} != roster slugSource ${agent.slugSource}`);
    if (s.displayName !== agent.displayName) throw new BuildRefused(`overlay ${s.slug}: displayName differs from the roster`);
    if (s.family !== null && s.family !== agent.family) throw new BuildRefused(`overlay ${s.slug}: family ${s.family} differs from the roster`);
  }
  if (!Array.isArray(overlay.excluded) || !overlay.excluded.every((d) => typeof d === "string" && d.length > 0)) {
    throw new BuildRefused("overlay: excluded must be an array of directory names");
  }
}

/**
 * Assemble the catalogue object (not yet validated).
 * @param {any} overlay
 * @param {{synthetic: boolean, commit: string | null, packageDigests: Record<string, string>}} source
 */
function assemble(overlay, { synthetic, commit, packageDigests }) {
  const packagesPath = overlay.source.packagesPath;
  return {
    schema: SCHEMAS.catalogue,
    catalogueVersion: overlay.overlayVersion,
    synthetic,
    source: { repo: overlay.source.repo, commit, packagesPath, packageDigests },
    families: overlay.families.map((f) => ({
      id: f.id, displayName: f.displayName, members: [...f.members],
      genericAliases: [...f.genericAliases], resolution: f.resolution,
    })),
    subjects: overlay.subjects.map((s) => ({
      slug: s.slug,
      displayName: s.displayName,
      family: s.family,
      teachingScope: s.teachingScope,
      aliases: [...s.aliases],
      overlapGroups: [...s.overlapGroups],
      isLanguageCourse: s.isLanguageCourse,
      slugStatus: s.slugStatus,
      evidence: synthetic ? null : { path: `${packagesPath}/${s.slug}`, sha256: packageDigests[s.slug] },
    })),
    overlapPolicies: overlay.overlapPolicies.map((p) => ({ id: p.id, members: [...p.members], rule: p.rule })),
    taskContextTerms: [...overlay.taskContextTerms],
    unresolvedDecisions: overlay.unresolvedDecisions.map((d) => ({
      id: d.id, question: d.question, interim: d.interim, owners: [...d.owners],
    })),
  };
}

/** @param {string[]} args @param {string} cwd */
function git(args, cwd) {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

/** @param {Buffer | string} bytes */
function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Verify a real checkout and compute per-package digests.
 * @param {any} overlay
 * @param {string} kb
 * @param {string} commit
 * @returns {Record<string, string>}
 */
function digestCheckout(overlay, kb, commit) {
  if (typeof commit !== "string" || !/^[0-9a-f]{40}$/.test(commit)) throw new BuildRefused("--commit must be 40 lower-case hex");
  let kbReal;
  try {
    kbReal = realpathSync(kb);
    if (!lstatSync(kbReal).isDirectory()) throw new Error("not a directory");
  } catch {
    throw new BuildRefused(`--kb ${kb} is not a readable directory`);
  }
  let top;
  let head;
  let status;
  try {
    top = realpathSync(git(["rev-parse", "--show-toplevel"], kbReal).trim());
    head = git(["rev-parse", "HEAD"], kbReal).trim();
    status = git(["status", "--porcelain", "--untracked-files=all"], top);
  } catch (error) {
    throw new BuildRefused(`--kb is not inside a usable git checkout (${error.message.split("\n")[0]})`);
  }
  if (head !== commit) throw new BuildRefused(`HEAD ${head} does not equal --commit ${commit}`);
  if (status.trim() !== "") throw new BuildRefused("working tree is not clean");
  const relKb = path.relative(top, kbReal).split(path.sep).join("/");
  if (relKb !== overlay.source.packagesPath) {
    throw new BuildRefused(`--kb is at "${relKb}", expected overlay.source.packagesPath "${overlay.source.packagesPath}"`);
  }

  const slugs = overlay.subjects.map((s) => s.slug);
  const dirs = readdirSync(kbReal, { withFileTypes: true }).filter((d) => d.isDirectory() || d.isSymbolicLink());
  for (const d of dirs) {
    if (d.isSymbolicLink()) throw new BuildRefused(`symlinked directory ${d.name} in --kb`);
    if (!slugs.includes(d.name) && !overlay.excluded.includes(d.name)) {
      throw new BuildRefused(`directory ${d.name} is neither an overlay slug nor in overlay.excluded`);
    }
  }
  const dirNames = new Set(dirs.map((d) => d.name));
  const digests = {};
  for (const slug of slugs) {
    if (!dirNames.has(slug)) throw new BuildRefused(`overlay slug ${slug} has no directory in --kb`);
    const listing = git(["ls-files", "-z", "--", `${relKb}/${slug}`], top).split("\0").filter(Boolean);
    if (listing.length === 0) throw new BuildRefused(`package ${slug} has no tracked files`);
    const lines = listing.map((repoPath) => {
      const abs = path.join(top, ...repoPath.split("/"));
      const st = lstatSync(abs);
      if (!st.isFile()) throw new BuildRefused(`${repoPath} is not a regular file`);
      const rel = repoPath.slice(`${relKb}/${slug}/`.length);
      return `${rel}\0${sha256(readFileSync(abs))}\n`;
    });
    lines.sort();
    digests[slug] = sha256(lines.join(""));
  }
  return digests;
}

/**
 * Build and validate a catalogue. Throws BuildRefused on any refusal.
 * @param {{synthetic?: boolean, overlay: any, roster: any, kb?: string, commit?: string}} input
 * @returns {object} the validated catalogue
 */
export function buildCatalogue({ synthetic = false, overlay, roster, kb, commit }) {
  checkOverlayAgainstRoster(overlay, roster);
  let catalogue;
  if (synthetic) {
    if (kb !== undefined || commit !== undefined) throw new BuildRefused("--synthetic cannot be combined with --kb or --commit");
    catalogue = assemble(overlay, { synthetic: true, commit: null, packageDigests: {} });
  } else {
    if (kb === undefined || commit === undefined) {
      throw new BuildRefused("a non-synthetic catalogue needs --kb <knowledge-bases dir> and --commit <40-hex> from a real checkout");
    }
    const packageDigests = digestCheckout(overlay, kb, commit);
    catalogue = assemble(overlay, { synthetic: false, commit, packageDigests });
  }
  const check = validateCatalogue(catalogue);
  if (!check.ok) {
    throw new BuildRefused(`catalogue does not validate: ${check.errors.map((e) => `${e.path} ${e.code} ${e.detail ?? ""}`).join("; ")}`);
  }
  return catalogue;
}

/** @param {string[]} argv */
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--synthetic") out.synthetic = true;
    else if (["--overlay", "--roster", "--out", "--kb", "--commit"].includes(arg)) {
      if (i + 1 >= argv.length) throw new BuildRefused(`${arg} needs a value`);
      out[arg.slice(2)] = argv[(i += 1)];
    } else throw new BuildRefused(`unknown argument ${arg}`);
  }
  for (const required of ["overlay", "roster", "out"]) if (!out[required]) throw new BuildRefused(`--${required} is required`);
  return out;
}

/** @param {string[]} argv */
export function main(argv) {
  try {
    const args = parseArgs(argv);
    const overlay = JSON.parse(readFileSync(args.overlay, "utf8"));
    const roster = JSON.parse(readFileSync(args.roster, "utf8"));
    const catalogue = buildCatalogue({ synthetic: args.synthetic === true, overlay, roster, kb: args.kb, commit: args.commit });
    writeFileSync(args.out, `${JSON.stringify(catalogue, null, 2)}\n`);
    process.stdout.write(
      `wrote ${args.out}: ${catalogue.synthetic ? "SYNTHETIC" : `commit ${catalogue.source.commit}`}, ` +
        `${catalogue.subjects.length} subjects, ${catalogue.families.length} families\n`,
    );
    return 0;
  } catch (error) {
    if (error instanceof BuildRefused) {
      process.stderr.write(`REFUSED: ${error.message}\n`);
      return 2;
    }
    process.stderr.write(`ERROR: ${error.message}\n`);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  process.exitCode = main(process.argv.slice(2));
}
