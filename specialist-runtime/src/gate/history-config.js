/**
 * Pinned History gate configuration.
 *
 * STATUS: pending handoff/04. History's real gate rules (code convention, the
 * provisional-label rule and the sources-line rule) live in Agent-Training's
 * handoff/04, which was not reachable. Those checks are therefore "pending" and
 * report "unsupported", so a History answer can at best be
 * "gate_unverifiable". That is intended: nothing may pass until the real rules
 * and bundle codes are loaded in a reviewed change.
 *
 * The url-policy check runs with the pilot default "forbid_all" (no tools ran,
 * so no URL can have been checked), pending reconciliation with handoff/04.
 * @module gate/history-config
 */

import { SCHEMAS } from "../constants.js";
import { deepFreeze } from "../util.js";

export const HISTORY_GATE_CONFIG = deepFreeze({
  schema: SCHEMAS.gateConfig,
  slug: "history",
  gateVersion: "history-gate/0.1.0",
  configVersion: "history-gate-config/0.1.0-pending-handoff-04",
  configStatus: "pending-handoff-04",
  synthetic: false,
  checks: {
    completeness: {
      status: "active",
      note: "Generic: finishReason must be \"stop\" and the text non-empty.",
    },
    "url-policy": {
      status: "active",
      policy: "forbid_all",
      note: "Pilot default, pending reconciliation with handoff/04.",
    },
    "internal-code-leakage": {
      status: "pending",
      pendingOn:
        "Internal codes extracted from the verified History bundle with tools/extract-codes.mjs, using the code pattern documented in handoff/04.",
    },
    "provisional-mark": {
      status: "pending",
      pendingOn: "The provisional-label rule from handoff/04.",
    },
    "sources-line": {
      status: "pending",
      pendingOn: "The sources-line rule from handoff/04.",
    },
  },
});
