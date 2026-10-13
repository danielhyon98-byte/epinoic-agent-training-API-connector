/**
 * url-policy (policy "forbid_all"): the answer contains no "scheme://",
 * "www.", "mailto:" or bare domain-with-path. No tools ran, so no URL can have
 * been checked. URLs copied from the user's message are not exempt.
 * @module gate/checks/url-policy
 */

import { containsUrl } from "../url-scan.js";

/**
 * @param {{ policy: "forbid_all" }} _cfg
 * @param {{ answerText: string }} input
 * @returns {{ status: "pass" | "fail", code: string }}
 */
export function urlPolicyCheck(_cfg, { answerText }) {
  return containsUrl(answerText) ? { status: "fail", code: "url_present" } : { status: "pass", code: "no_url" };
}
