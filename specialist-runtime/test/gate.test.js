import test from "node:test";
import assert from "node:assert/strict";
import { HISTORY_GATE_CONFIG, runGate } from "../src/index.js";
import { validateGateConfig } from "../src/gate/config.js";
import { mentionsAward } from "../src/gate/checks/provisional-mark.js";
import { splitSentences } from "../src/gate/text-scan.js";
import { SYNTHETIC_GATE_CONFIG, SYNTHETIC_SOURCES_LINE } from "../fixtures/synthetic/gate-config.js";
import { GOOD_ANSWER, offlineRuntime } from "../fixtures/synthetic/harness.js";

const DISCLAIMER = "Deterministic format and policy heuristics. Not factual, academic or formal verification.";
const offline = offlineRuntime();

function gate(answerText, { finishReason = "stop", userMessage = "", config = SYNTHETIC_GATE_CONFIG } = {}) {
  return offline.runGate({ slug: "history", gateConfig: config, answerText, finishReason, userMessage });
}
const withSources = (body) => `${body}\n${SYNTHETIC_SOURCES_LINE}`;
const check = (g, id) => g.checks.find((c) => c.id === id);

test("a normal answer passes every synthetic check; the result is frozen and carries codes only", () => {
  const g = gate(GOOD_ANSWER);
  assert.equal(g.status, "passed");
  assert.equal(g.kind, "deterministic-format-policy");
  assert.equal(g.version, "history-gate/0.1.0");
  assert.equal(g.configVersion, "synthetic-offline-test/0.1.0");
  assert.equal(g.disclaimer, DISCLAIMER);
  assert.deepEqual(g.checks.map((c) => c.id), ["completeness", "url-policy", "internal-code-leakage", "provisional-mark", "sources-line"]);
  assert.ok(g.checks.every((c) => c.status === "pass"));
  assert.ok(Object.isFrozen(g) && Object.isFrozen(g.checks) && Object.isFrozen(g.checks[0]));
  for (const c of g.checks) assert.deepEqual(Object.keys(c), ["id", "status", "code"]);
  assert.ok(!JSON.stringify(g).includes("Versailles"), "no answer text in the gate result");
  assert.deepEqual(gate(GOOD_ANSWER), g, "deterministic");
});

test("url-policy fails on scheme://, www. and bare domain-with-path (also inside the sources line)", () => {
  for (const body of [
    "Read https://example.org about it.",
    "Read http://example.org.",
    "See ftp://archive.example/x.",
    "Visit www.example.org for more.",
    "See example.org/page for the text.",
    "See bbc.co.uk/history.",
    "Ｗｗｗ.example.org is full-width.",
  ]) {
    const g = gate(withSources(body));
    assert.equal(g.status, "failed", body);
    assert.deepEqual(check(g, "url-policy"), { id: "url-policy", status: "fail", code: "url_present" });
  }
  const inSources = gate("The treaty was signed in 1919.\nSources: https://example.org");
  assert.equal(check(inSources, "url-policy").status, "fail");
  assert.equal(check(inSources, "sources-line").code, "sources_line_invalid");
});

test("url-policy does not flag bare IPs, CIDR, e.g./i.e., U.S., decimals or HL/SL", () => {
  for (const body of [
    "In the networking example the host is 192.168.1.10 on 10.0.0.0/8.",
    "Many states, e.g. Serbia, i.e. a small power, mobilised.",
    "The U.S. entered in 1917. Growth was 3.5 per cent.",
    "HL/SL students answer Paper 1 and Paper 2.",
    "Use kg.m/s? No: speed is in m/s.",
  ]) {
    assert.equal(check(gate(withSources(body)), "url-policy").status, "pass", body);
  }
});

test("internal-code-leakage: exact, boundary-matched codes fail; dash variants are folded", () => {
  for (const body of ["Rule HXR-101 applies.", "Rule HXR–215 applies.", "(HXR-102)", "HXR-101-style answers"]) {
    assert.deepEqual(check(gate(withSources(body)), "internal-code-leakage"), {
      id: "internal-code-leakage",
      status: "fail",
      code: "internal_code_present",
    }, body);
  }
  for (const body of ["Rule HXR-1010 is not a code.", "XHXR-101 is not a code.", "hxr-101 differs in case."]) {
    assert.equal(check(gate(withSources(body)), "internal-code-leakage").status, "pass", body);
  }
});

test("internal-code-leakage excludes codes present in the user's own message (quoted user material)", () => {
  const userMessage = 'My teacher wrote "HXR-101" on my essay. What does it mean?';
  const answer = withSources('Your teacher\'s note "HXR-101" is not something I can interpret.');
  assert.equal(check(gate(answer, { userMessage }), "internal-code-leakage").status, "pass");
  assert.equal(check(gate(withSources("HXR-101 and HXR-102."), { userMessage }), "internal-code-leakage").status, "fail", "other codes still count");
});

test("provisional-mark: awarded marks, bands, levels and grades need the label in the same sentence", () => {
  const fails = [
    "I would award this essay 12/15.",
    "Mark: 5/7.",
    "I'd give this 5 out of 7.",
    "This sits in markband 7-9.",
    "This is band 4.",
    "Grade 6 for this essay.",
    "You would get 9 marks here.",
    "This is band 4. It is provisional.",
    "Criterion A: achievement level 5.",
    "It scored 18 overall.",
  ];
  for (const body of fails) {
    assert.deepEqual(check(gate(withSources(body)), "provisional-mark"), {
      id: "provisional-mark",
      status: "fail",
      code: "provisional_label_missing",
    }, body);
  }
  const passes = [
    "Provisional mark: 5/7.",
    "I'd give this 5 out of 7 (provisional).",
    "This sits in markband 7-9 (provisional).",
    "Band 4 (provisional).",
    "Grade 6 for this essay, as a PROVISIONAL estimate.",
  ];
  for (const body of passes) {
    const c = check(gate(withSources(body)), "provisional-mark");
    assert.equal(c.status, "pass", body);
    assert.equal(c.code, "provisional_labels_present", body);
  }
});

const BENIGN = [
  // Contract section 8 and the acceptance list
  "Paper 1 and Paper 2 both reward source analysis.",
  "HL/SL students sit different papers; Higher Level adds Paper 3.",
  "The war lasted from 1914–1918, with a crisis in 1917/18.",
  "Lenin returned (1917) and the U.S. entered the war.",
  "Consider, e.g., the Somme, i.e. the 1916 offensive.",
  "By c. 1900 the alliance system had formed (see p. 45).",
  "Industrial output grew by 3.5 per cent.",
  "This question is worth 15 marks.",
  "It is a 15-mark question, so plan for 45 minutes.",
  "Section B [15 marks] asks for a comparison.",
  // Reviewer additions: STEM and general text
  "Test at the 5% significance level.",
  "Use a significance level of 0.05.",
  "Check your course and level.",
  "Python is a high-level language.",
  "Broadband internet reached rural areas later.",
  "Store it in the grade field in the database table.",
  "In working, 1/2 + 1/4 = 3/4.",
  "So x = 3/4.",
  "Sea level rose 0.2 m.",
  "Open level 3 of the menu.",
  "The date 03/12/1917 is in day/month order.",
];

test("benign counterexamples pass every check (no awarded-mark, URL or code false positives)", () => {
  for (const body of BENIGN) {
    const g = gate(withSources(body));
    assert.equal(g.status, "passed", `${body} -> ${JSON.stringify(g.checks)}`);
    assert.equal(mentionsAward(body), false, body);
  }
  const all = gate(withSources(BENIGN.join(" ")));
  assert.equal(all.status, "passed", JSON.stringify(all.checks));
});

test("documented heuristic limits stay as documented in the README", () => {
  // Fail closed: treated as awards, so the label is required.
  assert.equal(mentionsAward("Paper 2 is out of 30 marks."), true);
  assert.equal(mentionsAward("Grade 6 students learn this."), true);
  // Fail open: not detected without an assessment cue.
  assert.equal(mentionsAward("Your essay: 5/7."), false);
  assert.equal(mentionsAward("This is a level 4 response."), false);
  // url-policy: only the three contract forms.
  const url = (body) => check(gate(withSources(body)), "url-policy").status;
  assert.equal(url("St.Petersburg/Petrograd was renamed."), "fail");
  assert.equal(url("Write to a@example.org or mailto:a@example.org."), "pass");
  assert.equal(url("The site example.org has no path here."), "pass");
});

test("sentence splitting keeps abbreviations and decimals inside one sentence", () => {
  assert.deepEqual(splitSentences("E.g. the U.S. in c. 1900 grew 3.5 per cent. Next point."), [
    "E.g. the U.S. in c. 1900 grew 3.5 per cent.",
    "Next point.",
  ]);
  assert.deepEqual(splitSentences("Line one\nLine two"), ["Line one", "Line two"]);
});

test("sources-line: missing, duplicated, wrong value, URL value or decorated prefix fail", () => {
  const cases = [
    ["The treaty was signed in 1919.", "sources_line_missing"],
    [`${GOOD_ANSWER}\n${SYNTHETIC_SOURCES_LINE}`, "sources_line_duplicate"],
    ["Text.\nSources: Taylor (1961), p. 45", "sources_line_invalid"],
    ["Text.\nSources: none", "sources_line_invalid"],
    ["Text.\n**Sources:** none consulted (no retrieval in this session)", "sources_line_missing"],
  ];
  for (const [text, code] of cases) {
    assert.deepEqual(check(gate(text), "sources-line"), { id: "sources-line", status: "fail", code }, text);
  }
  assert.equal(check(gate(`Text.\n  ${SYNTHETIC_SOURCES_LINE}  `), "sources-line").status, "pass", "surrounding whitespace is fine");
});

test("completeness: unknown is unsupported; other finish reasons fail; unrecognised is unsupported", () => {
  assert.deepEqual(check(gate(GOOD_ANSWER, { finishReason: "unknown" }), "completeness"), { id: "completeness", status: "unsupported", code: "finish_reason_unknown" });
  assert.equal(gate(GOOD_ANSWER, { finishReason: "unknown" }).status, "unverifiable");
  assert.equal(check(gate(GOOD_ANSWER, { finishReason: "length" }), "completeness").code, "finish_length");
  assert.equal(check(gate("", { finishReason: "stop" }), "completeness").code, "empty_output");
  assert.deepEqual(check(gate(GOOD_ANSWER, { finishReason: "weird" }), "completeness"), { id: "completeness", status: "unsupported", code: "finish_reason_unrecognised" });
});

test("pinned HISTORY_GATE_CONFIG: pending checks report unsupported and the gate never passes", () => {
  const g = runGate({ slug: "history", gateConfig: HISTORY_GATE_CONFIG, answerText: GOOD_ANSWER, finishReason: "stop", userMessage: "" });
  assert.equal(g.status, "unverifiable");
  assert.equal(g.configVersion, "history-gate-config/0.1.0-pending-handoff-04");
  assert.deepEqual(g.checks, [
    { id: "completeness", status: "pass", code: "complete" },
    { id: "url-policy", status: "pass", code: "no_url" },
    { id: "internal-code-leakage", status: "unsupported", code: "rule_pending" },
    { id: "provisional-mark", status: "unsupported", code: "rule_pending" },
    { id: "sources-line", status: "unsupported", code: "rule_pending" },
  ]);
  const corpus = [GOOD_ANSWER, "Plain text.", "Sources: none", ...BENIGN, "x", "Provisional mark: 5/7.", "A".repeat(500)];
  for (const answerText of corpus) {
    for (const finishReason of ["stop", "unknown", "length"]) {
      const r = runGate({ slug: "history", gateConfig: HISTORY_GATE_CONFIG, answerText, finishReason, userMessage: "" });
      assert.notEqual(r.status, "passed", answerText);
    }
  }
  const url = runGate({ slug: "history", gateConfig: HISTORY_GATE_CONFIG, answerText: "See www.example.org", finishReason: "stop" });
  assert.equal(url.status, "failed", "url-policy forbid_all is active in the pilot default");
});

test("the pinned runGate refuses synthetic configs; mismatched or invalid configs are unverifiable", () => {
  const synthetic = runGate({ slug: "history", gateConfig: SYNTHETIC_GATE_CONFIG, answerText: GOOD_ANSWER, finishReason: "stop" });
  assert.equal(synthetic.status, "unverifiable");
  assert.ok(synthetic.checks.every((c) => c.status === "unsupported" && c.code === "synthetic_config_refused"));
  const slug = offline.runGate({ slug: "economics", gateConfig: SYNTHETIC_GATE_CONFIG, answerText: GOOD_ANSWER, finishReason: "stop" });
  assert.ok(slug.checks.every((c) => c.code === "gate_config_slug_mismatch"));
  const invalid = runGate({ slug: "history", gateConfig: { schema: "x" }, answerText: GOOD_ANSWER, finishReason: "stop" });
  assert.equal(invalid.status, "unverifiable");
  assert.equal(invalid.version, null);
  assert.ok(invalid.checks.every((c) => c.code === "gate_config_invalid"));
  const badInput = runGate({ slug: "history", gateConfig: HISTORY_GATE_CONFIG, answerText: 42, finishReason: "stop" });
  assert.ok(badInput.checks.every((c) => c.code === "gate_input_invalid"));
  assert.equal(runGate(null).status, "unverifiable");
});

test("gate config validation refuses vacuous or unsafe rules", () => {
  const withCheck = (id, cfg) => ({ ...SYNTHETIC_GATE_CONFIG, checks: { ...SYNTHETIC_GATE_CONFIG.checks, [id]: cfg } });
  const codesOf = (config) => validateGateConfig(config).errors.map((e) => e.code);
  assert.equal(validateGateConfig(SYNTHETIC_GATE_CONFIG).ok, true);
  assert.equal(validateGateConfig(HISTORY_GATE_CONFIG).ok, true);
  assert.ok(codesOf(withCheck("internal-code-leakage", { status: "active", codes: [] })).includes("codes_invalid"));
  assert.ok(codesOf(withCheck("internal-code-leakage", { status: "active", codes: ["HXR-101", "Paper 1"] })).includes("code_is_benign_token"));
  assert.ok(codesOf(withCheck("internal-code-leakage", { status: "active", codes: ["HL"] })).includes("code_is_benign_token"));
  assert.ok(codesOf(withCheck("internal-code-leakage", { status: "active", codes: ["A", "A"] })).includes("codes_duplicate"));
  assert.ok(codesOf(withCheck("provisional-mark", { status: "active", labelPattern: { source: "x*", flags: "" } })).includes("label_pattern_invalid"));
  assert.ok(codesOf(withCheck("provisional-mark", { status: "active", labelPattern: { source: "prov", flags: "g" } })).includes("label_pattern_invalid"));
  assert.ok(codesOf(withCheck("url-policy", { status: "active", policy: "allow_all" })).includes("url_policy_unsupported"));
  assert.ok(codesOf(withCheck("sources-line", { status: "active", prefix: "Sources:", required: true, allowedValues: ["https://x.org/a"] })).includes("allowed_values_invalid"));
  assert.ok(codesOf(withCheck("sources-line", { status: "off" })).includes("check_status_invalid"));
  assert.ok(codesOf(withCheck("completeness", { status: "pending" })).includes("pending_on_invalid"));
  const missing = { ...SYNTHETIC_GATE_CONFIG, checks: { ...SYNTHETIC_GATE_CONFIG.checks } };
  delete missing.checks["sources-line"];
  assert.ok(codesOf(missing).includes("check_missing"), "a check cannot be switched off by omission");
  assert.ok(codesOf({ ...SYNTHETIC_GATE_CONFIG, label: "unlabelled" }).includes("synthetic_label_missing"));
});

test("sources-line tagged-list mode: tagged items pass; untagged items, URLs and too many items fail", () => {
  const cfg = structuredClone(SYNTHETIC_GATE_CONFIG);
  cfg.checks["sources-line"] = {
    status: "active", prefix: "Sources:", required: true, mode: "tagged-list",
    allowedValues: ["none consulted (no retrieval in this session)"],
    itemTags: ["supplied text", "course notes", "recalled, not consulted"],
  };
  assert.deepEqual(validateGateConfig(cfg), { ok: true, errors: [] });
  const g = (line) => check(gate(`The treaty was signed in 1919.\n${line}`, { config: cfg }), "sources-line");
  assert.equal(g("Sources: none consulted (no retrieval in this session)").status, "pass");
  assert.equal(g("Sources: Source A extract (supplied text); Fischer, Germany's Aims in the First World War (1961) (recalled, not consulted)").status, "pass");
  assert.equal(g("Sources: course notes on the July Crisis (course notes)").status, "pass");
  assert.deepEqual(g("Sources: Fischer (1961)"), { id: "sources-line", status: "fail", code: "sources_line_untagged_item" });
  assert.deepEqual(g("Sources: Fischer (1961) (recalled, not consulted); Clark (2012)"), { id: "sources-line", status: "fail", code: "sources_line_untagged_item" });
  assert.deepEqual(g("Sources: (recalled, not consulted)"), { id: "sources-line", status: "fail", code: "sources_line_untagged_item" });
  assert.deepEqual(g("Sources: Fischer (1961) (consulted online)"), { id: "sources-line", status: "fail", code: "sources_line_untagged_item" });
  assert.deepEqual(g("Sources: https://example.org/fischer (recalled, not consulted)"), { id: "sources-line", status: "fail", code: "sources_line_invalid" });
  const many = Array.from({ length: 21 }, (_, i) => `Item ${i} (course notes)`).join("; ");
  assert.deepEqual(g(`Sources: ${many}`), { id: "sources-line", status: "fail", code: "sources_line_untagged_item" });
});

test("sources-line config: mode and itemTags are validated; exact mode keeps its old behaviour", () => {
  const base = { status: "active", prefix: "Sources:", required: true, allowedValues: ["none consulted (no retrieval in this session)"] };
  const codes = (sl) => {
    const cfg = structuredClone(SYNTHETIC_GATE_CONFIG);
    cfg.checks["sources-line"] = sl;
    return validateGateConfig(cfg).errors.map((e) => e.code);
  };
  assert.ok(codes({ ...base, mode: "loose" }).includes("mode_invalid"));
  assert.ok(codes({ ...base, mode: "tagged-list" }).includes("item_tags_invalid"));
  assert.ok(codes({ ...base, mode: "tagged-list", itemTags: [] }).includes("item_tags_invalid"));
  assert.ok(codes({ ...base, mode: "tagged-list", itemTags: ["a (b)"] }).includes("item_tags_invalid"));
  assert.ok(codes({ ...base, mode: "tagged-list", itemTags: ["x", "x"] }).includes("item_tags_invalid"));
  assert.ok(codes({ ...base, itemTags: ["supplied text"] }).includes("item_tags_need_tagged_list_mode"));
  assert.deepEqual(codes({ ...base, mode: "exact" }), []);
  assert.equal(check(gate("Text.\nSources: Fischer (1961) (recalled, not consulted)"), "sources-line").code, "sources_line_invalid");
});
