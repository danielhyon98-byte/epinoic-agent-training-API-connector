// Usage: node simulation/tools/harness-stub-run.mjs <harness.js> <args-json> [short]   (short: the first specialist reports a partial read)
// Run the harness script with stub agents and print every agent prompt (JSON lines), to compare versions.
import fs from 'fs'
const [file, argsJson, shortRead] = process.argv.slice(2)
const src = fs.readFileSync(file, 'utf8').replace(/^export const meta/m, 'const meta')
const calls = []
let specialistCalls = 0
const agent = async (prompt, opts = {}) => {
  calls.push({ label: opts.label, model: opts.model, prompt })
  const l = opts.label || ''
  if (l.startsWith('specialist:')) { specialistCalls++; return { answer_written: true, answer_chars: 10, diagnosis: [], bundle_lines_total: 100, bundle_last_line_read: (shortRead && specialistCalls === 1) ? 40 : 100 } }
  if (l.startsWith('deterministic:')) return { ran: true, blocking: false, blockingReasons: [], advisory: [], z3Findings: [] }
  if (l.startsWith('overseer')) return { verdict: l.includes(':r1') ? 'reject' : 'accept', flags: [{ category: 'a_lacking_detail', severity: 'minor' }], summary: 's' }
  if (l.startsWith('curator:')) return { files_changed: [], lessons: [], factual_corrections: [], shared_rule_proposals: [], open_issues: [], check_knowledge_passed: true }
  return {}
}
const parallel = async (ts) => Promise.all(ts.map((t) => t().catch(() => null)))
const pipeline = async (items, ...stages) => Promise.all(items.map(async (it, i) => { let r = it; for (const s of stages) r = await s(r, it, i); return r }))
const fn = new Function('agent', 'parallel', 'pipeline', 'phase', 'log', 'args', 'workflow', 'budget', `return (async () => {\n${src}\n})()`)
const out = await fn(agent, parallel, pipeline, () => {}, (m) => calls.push({ log: m }), JSON.parse(argsJson), async () => ({}), { total: null })
console.log(JSON.stringify({ calls, out }))
