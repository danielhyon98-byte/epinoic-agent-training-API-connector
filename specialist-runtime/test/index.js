// Entry point for `node --test test/`. Node 22 resolves a directory argument to
// test/index.js rather than expanding it, so this file imports every test
// file. test/index-completeness.test.js fails if a *.test.js file is missing.
import "./exports.test.js";
import "./manifest.test.js";
import "./bundle.test.js";
import "./prepare.test.js";
import "./bridge.test.js";
import "./result.test.js";
import "./gate.test.js";
import "./capabilities.test.js";
import "./redact.test.js";
import "./portable.test.js";
import "./export-bundle.test.js";
import "./extract-codes.test.js";
import "./fixtures.test.js";
import "./integration.test.js";
import "./index-completeness.test.js";
