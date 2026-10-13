/**
 * Size accounting for a classification request. Bytes only; tokens are not measured.
 * @module payload
 */

import { canonicalJson } from "./canonical-json.js";
import { validateLabelSet } from "./label-set.js";
import { deepFreeze, utf8Length } from "./util.js";

/**
 * Measure a proposed classification payload. Synchronous.
 *
 * Reports separately:
 * - `labelSchemaUtf8Bytes`: canonical JSON of the labels part
 *   (`{ subjects, families, flags }`, each `{ label, description }`);
 * - `excerptUtf8Bytes` / `excerptCodePoints`: the raw excerpt text;
 * - `serializedBodyUtf8Bytes`: provider-neutral canonical JSON of
 *   `{ text, labels }`, which includes quoting and escaping overhead and is
 *   therefore larger than the two parts added together;
 * - `tokenBound: { status: "unverified" }`: token fit is never inferred from bytes.
 *
 * The current two-subject request and response limits are not evidence that
 * this payload fits; nothing here is the real Fastino request format.
 *
 * @param {{labelSet: object, excerpt: string}} input
 * @returns {Readonly<{labelCount: number, labelSchemaUtf8Bytes: number, excerptUtf8Bytes: number,
 *   excerptCodePoints: number, serializedBodyUtf8Bytes: number, tokenBound: {status: "unverified", note: string}}>}
 * @throws {TypeError} for an invalid label set or a non-string excerpt
 */
export function measureClassificationPayload({ labelSet, excerpt } = {}) {
  const check = validateLabelSet(labelSet);
  if (!check.ok) throw new TypeError("measureClassificationPayload: invalid label set");
  if (typeof excerpt !== "string") throw new TypeError("measureClassificationPayload: excerpt must be a string");
  const labels = {
    subjects: labelSet.subjects.map(({ label, description }) => ({ label, description })),
    families: labelSet.families.map(({ label, description }) => ({ label, description })),
    flags: labelSet.flags.map(({ label, description }) => ({ label, description })),
  };
  return deepFreeze({
    labelCount: labels.subjects.length + labels.families.length + labels.flags.length,
    labelSchemaUtf8Bytes: utf8Length(canonicalJson(labels)),
    excerptUtf8Bytes: utf8Length(excerpt),
    excerptCodePoints: [...excerpt].length,
    serializedBodyUtf8Bytes: utf8Length(canonicalJson({ text: excerpt, labels })),
    tokenBound: {
      status: "unverified",
      note: "Token counts depend on the provider tokenizer and request format; not measured.",
    },
  });
}
