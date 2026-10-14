# Repository tools

| Tool | What it checks | Command |
| --- | --- | --- |
| `cross-check.mjs` | The runtime's real `getCapabilities()` output (production and staging-pilot) is accepted by the router's `validateCapabilities`. While every specialist is disabled, neither sticky nor absent subjects route. | `node tools/cross-check.mjs` |

The package-level tools live in each package (`specialist-runtime/tools/`,
`specialist-routing/tools/`) and the agent tools in `agents/tools/`. All of them
are offline. None calls a model, a provider or the network.
