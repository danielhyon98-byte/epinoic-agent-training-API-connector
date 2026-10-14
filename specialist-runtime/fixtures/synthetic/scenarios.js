// SYNTHETIC TEST FIXTURE: one scenario per turn path, used by the bridge,
// property and integration tests. Every scenario runs through the offline
// test runtime with fake callbacks; nothing here is a provider observation.

import { HISTORY_GATE_CONFIG } from "../../src/index.js";
import {
  abortAfterCallback,
  completedCallback,
  declinedCallback,
  failedCallback,
  malformedCallback,
  syntheticEvidence,
  syntheticUsage,
  throwingCallback,
  toolCallsCallback,
} from "./callbacks.js";
import { SYNTHETIC_SOURCES_LINE } from "./gate-config.js";
import {
  CLARIFYING_ANSWER,
  GOOD_ANSWER,
  SYNTHETIC_LIMITS,
  loadSyntheticBundle,
  offlineRuntime,
  turnInput,
} from "./harness.js";

const withSources = (body) => `${body}\n${SYNTHETIC_SOURCES_LINE}`;

async function run(fake, overrides = {}, runtime = offlineRuntime()) {
  const bundle = await loadSyntheticBundle(offlineRuntime());
  const result = await runtime.runSpecialistTurn(turnInput(bundle, fake.authorizedGenerate, overrides));
  return { result, stats: fake.stats };
}

/** @type {Array<{ name: string, outcome: string, run: () => Promise<{ result: any, stats: any }> }>} */
export const SCENARIOS = [
  { name: "normal answer", outcome: "answer", run: () => run(completedCallback({ text: GOOD_ANSWER })) },
  { name: "specialist clarifying question", outcome: "answer", run: () => run(completedCallback({ text: CLARIFYING_ANSWER })) },
  {
    name: "missing limits",
    outcome: "precondition_failed",
    run: () => run(completedCallback({ text: GOOD_ANSWER }), { limits: undefined }),
  },
  {
    name: "prepared input over bound",
    outcome: "precondition_failed",
    run: () => run(completedCallback({ text: GOOD_ANSWER }), { limits: { ...SYNTHETIC_LIMITS, maxPreparedInputUtf8Bytes: 100 } }),
  },
  {
    name: "tools passed",
    outcome: "precondition_failed",
    run: () => run(completedCallback({ text: GOOD_ANSWER }), { tools: [{ name: "web_search" }] }),
  },
  {
    name: "unknown slug",
    outcome: "precondition_failed",
    run: () => run(completedCallback({ text: GOOD_ANSWER }), { slug: "economics" }),
  },
  {
    name: "environment refused",
    outcome: "precondition_failed",
    run: () => run(completedCallback({ text: GOOD_ANSWER }), { environment: "production" }),
  },
  { name: "declined", outcome: "declined", run: () => run(declinedCallback("budget_unavailable")) },
  {
    name: "aborted before dispatch",
    outcome: "cancelled",
    run: () => {
      const controller = new AbortController();
      controller.abort();
      return run(completedCallback({ text: GOOD_ANSWER }), { signal: controller.signal });
    },
  },
  {
    name: "aborted after callback returned",
    outcome: "cancelled",
    run: () => {
      const controller = new AbortController();
      const reply = { status: "completed", output: { text: GOOD_ANSWER, finishReason: "stop" }, usage: syntheticUsage(), providerEvidence: syntheticEvidence() };
      return run(abortAfterCallback(controller, reply), { signal: controller.signal });
    },
  },
  { name: "callback throws", outcome: "failed", run: () => run(throwingCallback()) },
  { name: "malformed reply", outcome: "failed", run: () => run(malformedCallback({ status: "completed", output: { text: 42 } })) },
  { name: "tool-call output", outcome: "failed", run: () => run(toolCallsCallback()) },
  {
    name: "normalised failure",
    outcome: "failed",
    run: () => run(failedCallback({ code: "provider_unavailable", usage: syntheticUsage(), providerEvidence: syntheticEvidence() })),
  },
  { name: "refusal", outcome: "refusal", run: () => run(completedCallback({ text: "I can't help with that.", finishReason: "refusal" })) },
  { name: "content filter", outcome: "refusal", run: () => run(completedCallback({ text: "", finishReason: "content_filter" })) },
  { name: "length", outcome: "incomplete", run: () => run(completedCallback({ text: "The Treaty of", finishReason: "length" })) },
  { name: "empty text", outcome: "incomplete", run: () => run(completedCallback({ text: "   ", finishReason: "stop" })) },
  {
    name: "oversize",
    outcome: "oversize",
    run: () => run(completedCallback({ text: withSources("A".repeat(9000)) })),
  },
  {
    name: "gate: URL",
    outcome: "gate_failed",
    run: () => run(completedCallback({ text: withSources("Read more at https://example.org/versailles.") })),
  },
  {
    name: "gate: leaked code",
    outcome: "gate_failed",
    run: () => run(completedCallback({ text: withSources("Following rule HXR-215, I label marks.") })),
  },
  {
    name: "gate: unlabelled mark",
    outcome: "gate_failed",
    run: () => run(completedCallback({ text: withSources("I would award this essay 12/15.") })),
  },
  {
    name: "gate: bad sources line",
    outcome: "gate_failed",
    run: () => run(completedCallback({ text: "The treaty was signed in 1919.\nSources: Smith (2010), p. 45" })),
  },
  {
    name: "unknown finish reason",
    outcome: "gate_unverifiable",
    run: () => run(completedCallback({ text: GOOD_ANSWER, finishReason: "unknown" })),
  },
  {
    name: "pinned History gate config (pending rules)",
    outcome: "gate_unverifiable",
    run: () => run(completedCallback({ text: GOOD_ANSWER }), {}, offlineRuntime(HISTORY_GATE_CONFIG)),
  },
];
