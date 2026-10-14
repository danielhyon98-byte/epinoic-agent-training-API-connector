// SYNTHETIC TEST FIXTURE: fake `authorizedGenerate` callbacks.
//
// Each factory returns { authorizedGenerate, stats }. `stats.invocations`
// counts calls to the callback; `stats.transport.calls` counts calls to a
// nested fake "transport" (standing in for website 03), so a test can prove a
// decline dispatched nothing. Usage and evidence objects are SYNTHETIC: they
// are not provider observations, prices or measurements.

export function syntheticUsage() {
  return { synthetic: true, inputTokens: 1234, outputTokens: 56, cacheReadTokens: 0, note: "SYNTHETIC usage, not a provider observation" };
}

export function syntheticEvidence() {
  return { synthetic: true, provider: "synthetic-offline", requestId: "synthetic-req-0001", model: "synthetic-model" };
}

function makeFake(behaviour) {
  const stats = { invocations: 0, transport: { calls: 0 }, lastRequest: null, lastOptions: null };
  const transport = () => {
    stats.transport.calls += 1;
  };
  async function authorizedGenerate(request, options) {
    stats.invocations += 1;
    stats.lastRequest = request;
    stats.lastOptions = options;
    return behaviour({ request, options, transport });
  }
  return { authorizedGenerate, stats };
}

/** Completed reply. Defaults: finishReason "stop", synthetic usage and evidence. */
export function completedCallback({ text, finishReason = "stop", usage = syntheticUsage(), providerEvidence = syntheticEvidence() }) {
  return makeFake(({ transport }) => {
    transport();
    return { status: "completed", output: { text, finishReason }, usage, providerEvidence };
  });
}

/** 04 declines before dispatch: the transport is never called. */
export function declinedCallback(reason = "budget_unavailable") {
  return makeFake(() => ({ status: "declined", reason }));
}

/** Dispatched, then 03 reports a normalised failure. */
export function failedCallback({ code = "provider_unavailable", usage = null, providerEvidence = null } = {}) {
  return makeFake(({ transport }) => {
    transport();
    return { status: "failed", error: { code }, usage, providerEvidence };
  });
}

/** Dispatched, then throws (for example a bug in the website wrapper). */
export function throwingCallback() {
  return makeFake(({ transport }) => {
    transport();
    throw new Error("SYNTHETIC callback failure");
  });
}

/** Dispatched, then replies with an arbitrary (malformed) value. */
export function malformedCallback(reply) {
  return makeFake(({ transport }) => {
    transport();
    return reply;
  });
}

/** Dispatched, and the output reports tool calls (forbidden in this mode). */
export function toolCallsCallback() {
  return makeFake(({ transport }) => {
    transport();
    return {
      status: "completed",
      output: { text: "", finishReason: "stop", toolCalls: [{ name: "web_search", arguments: "{}" }] },
      usage: syntheticUsage(),
      providerEvidence: syntheticEvidence(),
    };
  });
}

/** Dispatched; the signal is aborted just before the reply is returned. */
export function abortAfterCallback(controller, reply) {
  return makeFake(({ transport }) => {
    transport();
    controller.abort();
    return reply;
  });
}
