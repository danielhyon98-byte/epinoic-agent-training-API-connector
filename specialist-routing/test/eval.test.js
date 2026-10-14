import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";
import { deriveFixtures } from "../tools/build-fixtures.mjs";
import { REPORT_HEADER, evaluate } from "../tools/evaluate.mjs";
import {
  PATHS,
  evidenceFromSynthetic,
  expandCompose,
  headExcerpt,
  itemText,
  loadJsonl,
  splitOfGroup,
} from "../tools/lib/eval-lib.mjs";
import { clone, setup } from "./helpers.js";

const ctx = await setup();
const items = loadJsonl(PATHS.eval).items.map((x) => x.item);
const tmp = mkdtempSync(path.join(os.tmpdir(), "routing-eval-"));
after(() => rmSync(tmp, { recursive: true, force: true }));

/** Write a modified copy of the eval set and evaluate it. */
async function evaluateModified(mutate) {
  const copy = clone(items);
  mutate(copy);
  const file = path.join(tmp, `eval-${Math.random().toString(16).slice(2)}.jsonl`);
  writeFileSync(file, `${copy.map((it) => JSON.stringify(it)).join("\n")}\n`);
  return evaluate({ evalPath: file });
}

/** First group name with this prefix that hashes to the wanted split. */
function groupIn(split, prefix) {
  for (let i = 0; ; i += 1) if (splitOfGroup(`${prefix}-${i}`) === split) return `${prefix}-${i}`;
}

describe("evaluator over the committed synthetic set", () => {
  test("passes, with the verbatim header and the expected size", async () => {
    const { lines, failures, summary } = await evaluate();
    assert.deepEqual(failures, []);
    assert.equal(lines[0], REPORT_HEADER);
    assert.equal(REPORT_HEADER, "POLICY-MECHANICS TEST OVER SYNTHETIC SCORES — NOT PROVIDER OBSERVATIONS, NOT CLASSIFIER ACCURACY. No model was called.");
    assert.ok(summary.items >= 180 && summary.items <= 260, String(summary.items));
    assert.equal(summary.mechanics.fail, 0);
    assert.equal(summary.mechanics.pass + summary.mechanics.notRun, summary.items);
    assert.equal(summary.nearDuplicates, 0);
  });

  test("property: every route over the eval set is a catalogue slug that capabilities mark available", async () => {
    const slugs = new Set(ctx.catalogue.subjects.map((s) => s.slug));
    const available = new Set(ctx.capabilities.entries.filter((e) => e.available).map((e) => e.slug));
    let routes = 0;
    for (const it of items) {
      let r;
      if (it.trusted?.stickySlug !== undefined) {
        r = await ctx.sticky(it.trusted.stickySlug);
      } else if (it.syntheticEvidence) {
        const excerpt = headExcerpt(itemText(it), ctx.harness.excerpt.windowUtf8Bytes);
        const ev = evidenceFromSynthetic(it.syntheticEvidence, {
          ...ctx.ids, labelSetVersion: ctx.labelSet.labelSetVersion, adapter: ctx.harness.adapter, excerptVersion: ctx.harness.excerpt.version, excerpt,
        });
        r = await ctx.select(ev, { trusted: it.trusted?.courseSlugs ? { courseSlugs: it.trusted.courseSlugs } : {} });
      } else continue;
      assert.equal(r.inferencePerformed, false);
      if (r.outcome === "route") {
        routes += 1;
        assert.ok(slugs.has(r.slug) && available.has(r.slug), `${it.id} routed to ${r.slug}`);
      }
    }
    assert.ok(routes > 50);
  });

  test("every item's split is the deterministic split of its group, and groups never cross splits", () => {
    const seen = new Map();
    for (const it of items) {
      assert.equal(it.split, splitOfGroup(it.group), it.id);
      if (seen.has(it.group)) assert.equal(seen.get(it.group), it.split);
      seen.set(it.group, it.split);
    }
  });

  test("the derived fixtures are up to date (npm run build:fixtures would change nothing)", async () => {
    const files = await deriveFixtures();
    for (const [file, text] of Object.entries(files)) assert.equal(readFileSync(file, "utf8"), text, file);
  });

  test("synthetic evidence is labelled as hand-assigned, not provider output", () => {
    for (const it of items) if (it.syntheticEvidence) assert.equal(it.syntheticEvidence.kind, "hand-assigned-synthetic-scores");
  });
});

describe("evaluator detects faults", () => {
  test("a wrong expectation fails the mechanics", async () => {
    const { failures } = await evaluateModified((c) => {
      const it = c.find((x) => x.expected.outcome === "route" && x.syntheticEvidence);
      it.expected = { outcome: "clarify", reason: "generic_family", candidates: ["english-a-literature"] };
    });
    assert.ok(failures.some((f) => f.startsWith("mechanics:")));
  });

  test("a split that does not match SHA-256(group) fails", async () => {
    const { failures } = await evaluateModified((c) => {
      c[0].split = c[0].split === "tune" ? "holdout" : "tune";
    });
    assert.ok(failures.some((f) => f.includes("SHA-256(group)")));
  });

  test("a near-duplicate across splits fails", async () => {
    const { failures } = await evaluateModified((c) => {
      const src = c.find((x) => x.split === "tune" && x.text && x.text.split(" ").length > 8);
      const group = groupIn("holdout", "dup-probe");
      c.push({ ...clone(src), id: `${group}-1`, group, split: "holdout", text: `${src.text} please` });
    });
    assert.ok(failures.some((f) => f.startsWith("near-duplicate")));
  });

  test("coverage below the minimum fails", async () => {
    const { failures } = await evaluateModified((c) => {
      for (let i = c.length - 1; i >= 0; i -= 1) {
        if (c[i].split === "holdout" && c[i].tags.includes("prompt-injection")) c.splice(i, 1);
      }
    });
    assert.ok(failures.some((f) => f.includes("tag prompt-injection")));
    const { failures: subjectFailures } = await evaluateModified((c) => {
      for (let i = c.length - 1; i >= 0; i -= 1) {
        const e = c[i].expected;
        if (c[i].split === "tune" && (e.slug === "psychology" || e.candidates?.[0] === "psychology")) c.splice(i, 1);
      }
    });
    assert.ok(subjectFailures.some((f) => f.includes("subject psychology")));
  });

  test("schema violations fail: unknown field, smuggled evidence field, unknown tag, bad expectation", async () => {
    const { failures } = await evaluateModified((c) => {
      c[0].route = "physics";
      c[1].syntheticEvidence = { ...c[1].syntheticEvidence, route: "physics" };
      c[2].tags = [...c[2].tags, "not-a-tag"];
      c[3].expected = { outcome: "route", reason: "generic_family", slug: "history" };
    });
    assert.ok(failures.some((f) => f.includes("unknown field route")));
    assert.ok(failures.some((f) => f.includes("syntheticEvidence: unknown field route")));
    assert.ok(failures.some((f) => f.includes("unknown tag not-a-tag")));
    assert.ok(failures.some((f) => f.includes("is not valid for route")));
  });

  test("an edited eval set makes the fixture calibration identity stale", async () => {
    const { failures } = await evaluateModified((c) => {
      c[0].rationale += " (edited)";
    });
    assert.ok(failures.some((f) => f.includes("dataset digests are stale")));
  });
});

describe("eval harness helpers", () => {
  test("headExcerpt cuts on whole code points within the byte window", () => {
    assert.deepEqual(headExcerpt("abc", 3), { text: "abc", utf8Bytes: 3, codePoints: 3, truncated: false });
    assert.deepEqual(headExcerpt("abcd", 3), { text: "abc", utf8Bytes: 3, codePoints: 3, truncated: true });
    assert.deepEqual(headExcerpt("ab—", 4), { text: "ab", utf8Bytes: 2, codePoints: 2, truncated: true });
    assert.deepEqual(headExcerpt("a🌻", 4), { text: "a", utf8Bytes: 1, codePoints: 1, truncated: true });
    assert.deepEqual(headExcerpt("a🌻", 5), { text: "a🌻", utf8Bytes: 5, codePoints: 2, truncated: false });
  });

  test("compose expands deterministically and rejects malformed specs", () => {
    assert.equal(expandCompose({ segments: [{ text: "ab", repeat: 3 }, { text: "!", repeat: 1 }] }), "ababab!");
    for (const bad of [{}, { segments: [] }, { segments: [{ text: "", repeat: 1 }] }, { segments: [{ text: "a", repeat: 0 }] },
      { segments: [{ text: "a", repeat: 2, extra: 1 }] }, { segments: [{ text: "x".repeat(1000), repeat: 1000 }] }, { segments: [{ text: "a", repeat: 1 }], mode: "x" }]) {
      assert.throws(() => expandCompose(bad), TypeError);
    }
  });

  test("long-message items put their cue beyond the excerpt window where they say so", () => {
    const late = items.find((it) => it.id === "long-late-cue-history-1");
    const text = itemText(late);
    const excerpt = headExcerpt(text, ctx.harness.excerpt.windowUtf8Bytes);
    assert.ok(excerpt.truncated);
    assert.ok(text.includes("Berlin Blockade") && !excerpt.text.includes("Berlin Blockade"));
  });
});
