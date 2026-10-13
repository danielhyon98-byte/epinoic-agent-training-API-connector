/**
 * Proposed expanded classification label set (`epinoic.routing-label-set.v1`).
 *
 * NOT compared with the real Fastino contract: `src/router/fastino.js` in the
 * website could not be read. Whether GLiNER-2.5-Decide through the hosted
 * adapter supports this many labels, multi-label output and per-label scores in
 * one request is unverified. The adapter owner must confirm or reject the shape.
 * @module label-set
 */

import { validateCatalogue } from "./catalogue.js";
import { FLAG_LABELS, LABEL_SET_VERSION, SCHEMAS } from "./version.js";
import { ErrorList, checkKeys, deepFreeze, isNonEmptyString, isPlainObject } from "./util.js";

/** Short natural-language descriptions for the four flags. */
export const FLAG_DESCRIPTIONS = Object.freeze({
  out_of_scope: "The message is not about any listed IB subject course, or asks for something other than tutoring.",
  mixed_request: "The message asks about more than one subject, or pairs a listed subject with an unlisted subject or a non-tutoring request.",
  non_english_input: "The message is written mainly in a language other than English.",
  needs_task_context: "The message names an assessment task, such as Paper 1, an essay, source analysis or exam help, without saying which subject.",
});

const LABEL_SET_KEYS = Object.freeze(["schema", "labelSetVersion", "status", "subjects", "families", "flags"]);
/** Status recorded inside every label set this version builds. */
export const LABEL_SET_STATUS = "proposed-unverified-against-provider";

/**
 * Build the proposed label set from a catalogue: one subject label per slug,
 * one family label per family and the four flags, each with a short
 * description. Synchronous; hash it with `labelSetDigest` (async).
 *
 * @param {object} catalogue a catalogue that passes validateCatalogue
 * @returns {Readonly<{schema: string, labelSetVersion: string, status: string,
 *   subjects: {label: string, description: string}[],
 *   families: {label: string, description: string}[],
 *   flags: {label: string, description: string}[]}>}
 * @throws {TypeError} when the catalogue is invalid
 */
export function buildLabelSet(catalogue) {
  const check = validateCatalogue(catalogue);
  if (!check.ok) {
    throw new TypeError(`buildLabelSet: invalid catalogue (${check.errors[0].path}: ${check.errors[0].code})`);
  }
  const byslug = new Map(catalogue.subjects.map((s) => [s.slug, s]));
  return deepFreeze({
    schema: SCHEMAS.labelSet,
    labelSetVersion: LABEL_SET_VERSION,
    status: LABEL_SET_STATUS,
    subjects: catalogue.subjects.map((s) => ({
      label: s.slug,
      description: `${s.displayName}. ${s.teachingScope}`,
    })),
    families: catalogue.families.map((f) => ({
      label: f.id,
      description: `A question about ${f.displayName} that does not say which course: ${f.members
        .map((m) => byslug.get(m).displayName)
        .join(", ")}.`,
    })),
    flags: FLAG_LABELS.map((label) => ({ label, description: FLAG_DESCRIPTIONS[label] })),
  });
}

/**
 * Structural check of a label set (does not compare it with a catalogue).
 * @param {unknown} labelSet
 * @returns {Readonly<{ok: boolean, errors: ReadonlyArray<{path: string, code: string, detail: string | null}>}>}
 */
export function validateLabelSet(labelSet) {
  const errors = new ErrorList();
  if (!isPlainObject(labelSet)) {
    errors.add("$", "type", "expected an object");
    return errors.result();
  }
  checkKeys(labelSet, LABEL_SET_KEYS, [], "$", errors);
  if (labelSet.schema !== SCHEMAS.labelSet) errors.add("$.schema", "schema_mismatch", String(labelSet.schema));
  if (!isNonEmptyString(labelSet.labelSetVersion)) errors.add("$.labelSetVersion", "type", "expected a string");
  if (!isNonEmptyString(labelSet.status)) errors.add("$.status", "type", "expected a string");
  const seen = new Set();
  for (const list of ["subjects", "families", "flags"]) {
    const entries = labelSet[list];
    if (!Array.isArray(entries)) {
      errors.add(`$.${list}`, "type", "expected an array");
      continue;
    }
    entries.forEach((e, i) => {
      const path = `$.${list}[${i}]`;
      if (!isPlainObject(e)) {
        errors.add(path, "type", "expected an object");
        return;
      }
      checkKeys(e, ["label", "description"], [], path, errors);
      if (!isNonEmptyString(e.label)) errors.add(`${path}.label`, "type", "expected a string");
      else if (seen.has(e.label)) errors.add(`${path}.label`, "duplicate_label", e.label);
      else seen.add(e.label);
      if (!isNonEmptyString(e.description)) errors.add(`${path}.description`, "type", "expected a string");
    });
  }
  if (Array.isArray(labelSet.flags)) {
    const flags = labelSet.flags.map((f) => (isPlainObject(f) ? f.label : null));
    if (flags.length !== FLAG_LABELS.length || FLAG_LABELS.some((f, i) => flags[i] !== f)) {
      errors.add("$.flags", "flag_set_mismatch", FLAG_LABELS.join(","));
    }
  }
  return errors.result();
}
