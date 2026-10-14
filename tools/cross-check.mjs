#!/usr/bin/env node
// Cross-package check: the runtime's real capabilities object is accepted by the
// router, and the router never routes to a specialist the runtime has not enabled.
// Offline only; no model or provider is called.
//
//   node tools/cross-check.mjs

import { readFileSync } from "node:fs";
import * as runtime from "../specialist-runtime/src/index.js";
import * as routing from "../specialist-routing/src/index.js";

const catalogue = JSON.parse(readFileSync(new URL("../specialist-routing/fixtures/catalogue.synthetic.json", import.meta.url), "utf8"));
const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); };

for (const environment of ["production", "staging-pilot"]) {
  const caps = runtime.getCapabilities({ environment });
  const v = routing.validateCapabilities(caps, { catalogue });
  check(v.ok, `${environment}: router rejected runtime capabilities: ${JSON.stringify(v.errors ?? v)}`);
  check(caps.entries.every((e) => e.available === false), `${environment}: runtime reports an enabled entry`);

  const sticky = await routing.selectSticky({ stickySlug: "history", catalogue, capabilities: caps });
  check(sticky.outcome === "unavailable" && sticky.reason === "specialist_unavailable",
    `${environment}: sticky history should be unavailable while disabled, got ${sticky.outcome}/${sticky.reason}`);

  const physics = await routing.selectSticky({ stickySlug: "physics", catalogue, capabilities: caps });
  check(physics.outcome === "unavailable" && physics.slug === null,
    `${environment}: a subject absent from runtime capabilities must not route`);
}

check(runtime.RUNTIME_CONTRACT_VERSION === "epinoic.specialist-runtime.v0.1.0", "runtime contract version changed");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("cross-check passed: runtime capabilities (production, staging-pilot) accepted by the router; nothing routes while every specialist is disabled");
