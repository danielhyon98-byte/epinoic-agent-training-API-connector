/**
 * Prepared request (contract section 6): one bounded, no-tools request with
 * the mandatory bundle first and byte-identical. Nothing is trimmed,
 * summarised or reordered; an input over the bound fails before dispatch.
 * @module prepare
 */

import { PILOT_MODE, SCHEMAS } from "./constants.js";
import { checkVerifiedBundle } from "./bundle.js";
import { resolveEnabledEntry, resolveGateConfig } from "./context.js";
import { validateLimits } from "./limits.js";
import { buildProvenance } from "./provenance.js";
import { codePointLength, isWellFormed, utf8ByteLength } from "./text.js";
import { deepFreeze, hasExactKeys, isPlainObject, unknownKeys } from "./util.js";

/** Version of the runtime notice below. */
export const RUNTIME_NOTICE_VERSION = "pilot-notice/0.1.0";

/**
 * Runtime notice pilot-notice/0.1.0, in full, for review.
 *
 * It is appended as a separate instruction AFTER the mandatory bundle and is
 * never an edit of it. It states operational facts only. Any change to this
 * text requires a new version string and review.
 */
export const RUNTIME_NOTICE_TEXT = [
  "Runtime notice (pilot-notice/0.1.0).",
  "This session is a single turn with no tools: no retrieval, no file or library access and no web browsing are available, and none were used.",
  "Do not claim to have looked up, searched, browsed or consulted any source during this session.",
  "This notice only states these facts. It does not override or change the instructions above it.",
].join("\n");

const PREPARE_KEYS = Object.freeze(["slug", "mode", "environment", "bundle", "message", "priorTurns", "limits"]);

/**
 * @typedef {Readonly<{
 *   schema: "epinoic.prepared-specialist-request.v1",
 *   slug: string, mode: string,
 *   instructions: readonly [
 *     { kind: "mandatory-bundle", text: string, sha256: string },
 *     { kind: "runtime-notice", version: string, text: string }
 *   ],
 *   messages: ReadonlyArray<{ role: "user" | "assistant", text: string }>,
 *   tools: readonly [],
 *   bounds: { preparedInputUtf8Bytes: number, maxOutputTokens: number | null, tokenCount: null, tokenCountStatus: "not-measured" },
 *   provenance: import("./provenance.js").Provenance
 * }>} PreparedRequest
 */

function checkMessage(message, limits) {
  if (typeof message !== "string" || !isWellFormed(message) || message.trim().length === 0) return "message_invalid";
  if (codePointLength(message) > limits.maxMessageCodePoints) return "message_exceeds_bound";
  return null;
}

function checkPriorTurns(priorTurns, limits) {
  if (!Array.isArray(priorTurns)) return { code: "prior_turns_invalid" };
  const list = [];
  let bytes = 0;
  for (const turn of priorTurns) {
    if (!isPlainObject(turn) || !hasExactKeys(turn, ["role", "text"])) return { code: "prior_turns_invalid" };
    if (turn.role !== "user" && turn.role !== "assistant") return { code: "prior_turns_invalid" };
    if (typeof turn.text !== "string" || !isWellFormed(turn.text) || turn.text.trim().length === 0) {
      return { code: "prior_turns_invalid" };
    }
    bytes += utf8ByteLength(turn.text);
    list.push({ role: turn.role, text: turn.text });
  }
  if (list.length > limits.maxPriorTurns || bytes > limits.maxPriorTurnsUtf8Bytes) return { code: "prior_turns_exceed_bound" };
  return { code: null, list };
}

/**
 * Validate every precondition and build the request. Also returns what was
 * resolved, for provenance on failure.
 * @param {import("./context.js").RuntimeContext} ctx
 * @param {unknown} input
 */
export async function prepareInternal(ctx, input) {
  /** @type {{ entry?: any, gateConfig?: any, modeOk?: boolean, limits?: any, runtimeNoticeVersion?: string }} */
  const resolved = {};
  const fail = (code) => ({ ok: false, failure: { stage: "precondition", code }, resolved });

  if (!isPlainObject(input)) return fail("input_invalid");
  if (Object.prototype.hasOwnProperty.call(input, "tools")) return fail("tools_not_supported");
  if (unknownKeys(input, PREPARE_KEYS).length > 0) return fail("unknown_input_field");

  const found = resolveEnabledEntry(ctx, input.environment, input.slug);
  if (found.entry) resolved.entry = found.entry;
  if (found.code !== null) return fail(found.code);
  const entry = found.entry;

  if (input.mode !== PILOT_MODE || !entry.supportedModes.includes(input.mode)) return fail("unsupported_mode");
  resolved.modeOk = true;

  const gate = resolveGateConfig(ctx, entry);
  if (gate.code !== null) return fail(gate.code);
  resolved.gateConfig = gate.gateConfig;

  const checkedLimits = validateLimits(input.limits);
  if (checkedLimits.code !== null) return fail(checkedLimits.code);
  const limits = checkedLimits.limits;
  resolved.limits = limits;

  const messageCode = checkMessage(input.message, limits);
  if (messageCode !== null) return fail(messageCode);
  const turns = checkPriorTurns(input.priorTurns === undefined ? [] : input.priorTurns, limits);
  if (turns.code !== null) return fail(turns.code);

  const bundleCode = await checkVerifiedBundle(ctx, input.bundle, entry, input.environment);
  if (bundleCode !== null) return fail(bundleCode);
  const bundle = input.bundle;

  const messages = [...turns.list, { role: "user", text: input.message }];
  const preparedInputUtf8Bytes =
    bundle.byteLength + utf8ByteLength(RUNTIME_NOTICE_TEXT) + messages.reduce((n, m) => n + utf8ByteLength(m.text), 0);
  if (preparedInputUtf8Bytes > limits.maxPreparedInputUtf8Bytes) return fail("prepared_input_exceeds_bound");

  resolved.runtimeNoticeVersion = RUNTIME_NOTICE_VERSION;
  const request = deepFreeze({
    schema: SCHEMAS.preparedRequest,
    slug: entry.slug,
    mode: PILOT_MODE,
    instructions: [
      { kind: "mandatory-bundle", text: bundle.text, sha256: bundle.sha256 },
      { kind: "runtime-notice", version: RUNTIME_NOTICE_VERSION, text: RUNTIME_NOTICE_TEXT },
    ],
    messages,
    tools: [],
    bounds: {
      preparedInputUtf8Bytes,
      maxOutputTokens: limits.maxOutputTokens,
      tokenCount: null,
      tokenCountStatus: "not-measured",
    },
    provenance: buildProvenance(ctx, resolved),
  });
  return { ok: true, request, resolved };
}

/**
 * Public prepareTurn: `{ ok: true, request }` or
 * `{ ok: false, failure: { stage: "precondition", code } }`, frozen.
 * @param {import("./context.js").RuntimeContext} ctx
 * @param {unknown} input
 */
export async function prepareTurnWith(ctx, input) {
  const out = await prepareInternal(ctx, input);
  return out.ok ? Object.freeze({ ok: true, request: out.request }) : deepFreeze({ ok: false, failure: out.failure });
}
