export const meta = {
  name: 'owned-task-implement-review-fix',
  description: 'One owner implements a Daniel task on its worktree, three read-only reviewers check it, the owner fixes confirmed findings',
  phases: [
    { title: 'Implement', detail: 'single writer on the task worktree; commits and pushes' },
    { title: 'Review', detail: 'three read-only reviewers with distinct lenses' },
    { title: 'Fix', detail: 'owner addresses confirmed findings; tests; push' },
  ],
}

const A = args
const FINDINGS = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
          file: { type: 'string' },
          claim: { type: 'string' },
          evidence: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['severity', 'file', 'claim', 'evidence', 'fix'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['findings', 'summary'],
}
const REPORT = {
  type: 'object',
  properties: {
    head_sha: { type: 'string' },
    commits: { type: 'array', items: { type: 'string' } },
    tests: { type: 'string' },
    pushed: { type: 'boolean' },
    awaiting_decisions: { type: 'array', items: { type: 'string' } },
    not_done: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
  required: ['head_sha', 'commits', 'tests', 'pushed', 'awaiting_decisions', 'not_done', 'summary'],
}

phase('Implement')
const impl = await agent(A.implement, { label: `implement:${A.task}`, phase: 'Implement', schema: REPORT, effort: 'high' })
if (!impl) return { task: A.task, error: 'implementation agent failed' }
log(`${A.task}: implemented at ${impl.head_sha} (${impl.commits.length} commits, pushed=${impl.pushed})`)

phase('Review')
const reviewBase = `You are a READ-ONLY reviewer of Daniel's "${A.task}" task in the git worktree ${A.worktree} (branch ${A.branch}, head ${impl.head_sha}). Do NOT edit, create or delete any file, do not commit, push, fetch or change git state, and make no network or model calls. You may read any file and run read-only commands, including the package's own tests and checks. The implementer's report: ${JSON.stringify(impl)}.
Context and binding sources are listed in the implementer's brief below; read what your lens needs.
--- IMPLEMENTER BRIEF ---
${A.implement}
--- END BRIEF ---
Report only real, evidenced problems (quote file:line or command output). Severity: blocker = wrong against a binding contract/handoff, unsafe, or a test that does not test what it claims; major = materially incomplete or misleading claim; minor = small fix. Do not report style preferences. If you find nothing, return an empty list.`
const reviews = await parallel(A.lenses.map((lens, i) => () =>
  agent(`${reviewBase}\n\nYOUR LENS: ${lens}`, { label: `review:${A.task}:${i + 1}`, phase: 'Review', schema: FINDINGS, effort: 'high' })))
const findings = reviews.filter(Boolean).flatMap((r, i) => r.findings.map((f) => ({ ...f, lens: i + 1 })))
const actionable = findings.filter((f) => f.severity !== 'minor' || true)
log(`${A.task}: ${findings.length} findings (${findings.filter((f) => f.severity === 'blocker').length} blocker, ${findings.filter((f) => f.severity === 'major').length} major)`)
if (findings.length === 0) return { task: A.task, impl, findings: [], fix: null }

phase('Fix')
const fix = await agent(`You are the owner (single writer) of Daniel's "${A.task}" task in the git worktree ${A.worktree} (branch ${A.branch}). Three independent read-only reviewers checked your work at ${impl.head_sha}. For EACH finding below: verify it yourself against the code and the binding sources; if it is real, fix it (blockers and majors must be fixed or explicitly justified; minors fixed when cheap); if it is wrong, say why with evidence. Then run the package's full checks, commit in logical commits (end each message with the two trailer lines from your original brief), and push the branch (no force-push). Same boundaries as your original brief, which follows.
FINDINGS: ${JSON.stringify(actionable)}
--- ORIGINAL BRIEF ---
${A.implement}
--- END ---
In summary, list each finding as fixed / rejected (with reason).`, { label: `fix:${A.task}`, phase: 'Fix', schema: REPORT, effort: 'high' })
return { task: A.task, impl, findings, fix }
