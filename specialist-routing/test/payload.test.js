import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { canonicalJson, measureClassificationPayload } from "../src/index.js";
import { setup } from "./helpers.js";

const ctx = await setup();
const utf8 = (s) => new TextEncoder().encode(s).length;

describe("measureClassificationPayload", () => {
  test("reports label schema, excerpt and serialized body bytes separately; tokens unverified", () => {
    const m = measureClassificationPayload({ labelSet: ctx.labelSet, excerpt: "Why did the Berlin Wall go up?" });
    assert.deepEqual(Object.keys(m), ["labelCount", "labelSchemaUtf8Bytes", "excerptUtf8Bytes", "excerptCodePoints", "serializedBodyUtf8Bytes", "tokenBound"]);
    assert.equal(m.labelCount, 22);
    assert.equal(m.excerptUtf8Bytes, 30);
    assert.equal(m.tokenBound.status, "unverified");
    assert.ok(Object.isFrozen(m) && Object.isFrozen(m.tokenBound));
    const labels = {
      subjects: ctx.labelSet.subjects,
      families: ctx.labelSet.families,
      flags: ctx.labelSet.flags,
    };
    assert.equal(m.labelSchemaUtf8Bytes, utf8(canonicalJson(labels)));
    assert.equal(m.serializedBodyUtf8Bytes, utf8(canonicalJson({ text: "Why did the Berlin Wall go up?", labels })));
  });

  test("the serialized body is larger than bytes + labels because of quoting and escaping", () => {
    const excerpt = 'He said "no"\n\tthen left \\ — fin';
    const m = measureClassificationPayload({ labelSet: ctx.labelSet, excerpt });
    assert.equal(m.excerptUtf8Bytes, utf8(excerpt));
    const overhead = m.serializedBodyUtf8Bytes - m.labelSchemaUtf8Bytes - m.excerptUtf8Bytes;
    // {"labels":...,"text":"..."} framing plus one escape byte each for the two quotes, the newline, the tab and the backslash.
    assert.equal(overhead, '{"labels":,"text":""}'.length + 5);
  });

  test("counts multi-byte text in bytes and code points", () => {
    const m = measureClassificationPayload({ labelSet: ctx.labelSet, excerpt: "naïve 🌻 中文" });
    assert.equal(m.excerptCodePoints, 10);
    assert.equal(m.excerptUtf8Bytes, 1 + 1 + 2 + 1 + 1 + 1 + 4 + 1 + 3 + 3);
  });

  test("rejects an invalid label set or a non-string excerpt", () => {
    assert.throws(() => measureClassificationPayload({ labelSet: {}, excerpt: "x" }), TypeError);
    assert.throws(() => measureClassificationPayload({ labelSet: ctx.labelSet, excerpt: 3 }), TypeError);
  });
});
