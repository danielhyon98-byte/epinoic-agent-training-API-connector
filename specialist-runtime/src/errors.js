/**
 * Error type thrown by loadPinnedBundle, getCapabilities and
 * createOfflineTestRuntime. Messages carry codes only, never bundle or user text.
 * @module errors
 */

export class RuntimeIntegrityError extends Error {
  /**
   * @param {string} code Stable machine-readable code, e.g. "bundle_checksum_mismatch".
   */
  constructor(code) {
    super(`specialist-runtime: ${code}`);
    this.name = "RuntimeIntegrityError";
    /** @type {string} */
    this.code = code;
  }
}
