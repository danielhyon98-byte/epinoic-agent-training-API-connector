export const meta = {
  name: 'kb-edit-audit',
  description: 'Audit every training edit to the real knowledge bases: find problems, verify each independently, apply only confirmed fixes',
  phases: [
    { title: 'Audit', detail: 'one auditor per specialist reads the diff against the baseline and checks every added or changed statement' },
    { title: 'Verify', detail: 'an independent verifier tries to refute each finding; only confirmed findings go on' },
    { title: 'Fix', detail: 'one fixer per specialist applies the confirmed fixes, validates, and logs every change' },
  ],
}

// args: {worktree, baseline (commit), model, cycle, slugs: [...], names: {slug: display name}}
const A = args
const WT = A.worktree
const KB = `${WT}/knowledge-bases`
const BASE = A.baseline
const MODEL = A.model
const N = A.cycle
if (!WT || !BASE || !MODEL || !A.slugs) throw new Error('args.worktree, args.baseline, args.model and args.slugs are required')
const NO_NET = 'Self-contained environment: do NOT use web search, web fetch or any network tool.'
const IB = (slug) => slug !== 'english-specialist'

const FINDINGS = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          file: { type: 'string' },
          excerpt: { type: 'string' },
          problem: { type: 'string', enum: ['factual_error', 'misleading_precision', 'contradiction', 'weakens_rule', 'writes_for_checker', 'format', 'unsupported_as_fact'] },
          severity: { type: 'string', enum: ['major', 'minor'] },
          explanation: { type: 'string' },
          evidence: { type: 'string' },
          fix_old: { type: 'string' },
          fix_new: { type: 'string' },
        },
        required: ['id', 'file', 'excerpt', 'problem', 'severity', 'explanation', 'evidence', 'fix_old', 'fix_new'],
      },
    },
    edits_reviewed: { type: 'integer' },
  },
  required: ['findings', 'edits_reviewed'],
}
const VERDICT = {
  type: 'object',
  properties: {
    real: { type: 'boolean' },
    reason: { type: 'string' },
    fix_ok: { type: 'boolean' },
    better_fix_new: { type: 'string' },
  },
  required: ['real', 'reason', 'fix_ok', 'better_fix_new'],
}
const FIX = {
  type: 'object',
  properties: {
    applied: { type: 'array', items: { type: 'string' } },
    not_applied: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, reason: { type: 'string' } }, required: ['id', 'reason'] } },
    validate_ok: { type: 'boolean' },
  },
  required: ['applied', 'not_applied', 'validate_ok'],
}

function auditPrompt(slug) {
  return `You audit the knowledge-base edits that a training loop made to the REAL Epinoic AI "${A.names[slug]}" specialist (an IB Diploma tutor). ${NO_NET} Edit no file.

1. Run: cd ${WT} && git diff ${BASE} -- knowledge-bases/${slug}
   These are every added or changed line since the baseline. Read ${WT}/training/changes/cycle-*/${slug}.md (the curators' own logs: what they changed and why), ${KB}/_build/SPEC.md (house format: coded rules, evidence labels [E] [O] [R] [I] [P], cross-references, Open points), and as much surrounding text in ${KB}/${slug}/ as you need.
2. Check every added or changed statement for:
   - factual_error: a wrong fact, date, name, figure, definition, mechanism, formula or calculation. Recompute every number (python3 -I is available). For a detail labelled [R] (reported, unchecked), flag it only if you are confident it is wrong, and say what is right.
   - misleading_precision: wording precise enough to look settled but coarse enough to mislead an inference the specialist is likely to draw. Example: two events dated only by year, 1940 and 1941, when they were weeks apart and the order or gap matters.
   - contradiction: the edit conflicts with other text in this knowledge base (search for it).
   - weakens_rule: it weakens a non-negotiable, academic integrity, provisional marking, the SOURCE POLICY or the AUTHORITY ORDER.
   - writes_for_checker: it teaches the specialist to word answers for the Z3 checker or the gate rather than for the student.
   - format: a duplicate or reused rule code, a cross-reference to a code or section that does not exist, a missing or wrong evidence label.
   - unsupported_as_fact: a contestable claim presented as settled with no label or source.
3. Do not flag style, length or choices you would simply have made differently. An honest "unconfirmed" label is not a flaw. If the edits are sound, return no findings.

For each finding give: id (${slug}-1, ${slug}-2, ...); file (file name); excerpt (verbatim current text, at most 300 characters); problem; severity (major = a student would be misinformed or a rule is broken; minor = weaker or unclear); explanation; evidence (your recomputation, the conflicting line with its location, or the fact you rely on); and a fix: fix_old (exact current text, unique in that file) and fix_new (its replacement, in house format, keeping or adding the right evidence label). Also return edits_reviewed (the number of changed hunks you checked).`
}

function verifyPrompt(slug, f) {
  return `You independently verify one audit finding about the knowledge base of the REAL Epinoic AI "${A.names[slug]}" specialist. ${NO_NET} Edit no file.

Finding: ${JSON.stringify({ file: f.file, excerpt: f.excerpt, problem: f.problem, severity: f.severity, explanation: f.explanation, evidence: f.evidence, fix_old: f.fix_old, fix_new: f.fix_new }, null, 1)}

Read ${KB}/${slug}/${f.file} around the excerpt, and other files in ${KB}/${slug}/ as needed. Try to refute the finding: is the current text in fact correct, adequately labelled, or consistent? Recompute any numbers yourself (python3 -I is available). Set real=true only if you can confirm the problem independently; if it is uncertain or a matter of taste, real=false.
Then judge the fix: fix_ok=true if fix_old occurs exactly once in the file and fix_new corrects the problem in house format without adding a new error. If the fix is wrong or incomplete but the problem is real, set fix_ok=false and give better_fix_new (a replacement for the same fix_old); otherwise better_fix_new = "".`
}

function fixPrompt(slug, confirmed) {
  return `You apply confirmed audit fixes to the knowledge base of the REAL Epinoic AI "${A.names[slug]}" specialist. ${NO_NET}
Each fix below was found by an auditor and confirmed by an independent verifier. For each one, replace fix_old with fix_new in ${KB}/${slug}/<file>, after checking that fix_old occurs exactly once. If it does not, or the replacement would break the house format, skip it and say why. Edit nothing else in ${KB}/${slug}/. Do not change SOURCE POLICY lines or weaken any rule.

FIXES:
${JSON.stringify(confirmed.map((f) => ({ id: f.id, file: f.file, problem: f.problem, severity: f.severity, explanation: f.explanation, fix_old: f.fix_old, fix_new: f.verdict.fix_ok ? f.fix_new : f.verdict.better_fix_new })), null, 1)}

Then ${IB(slug) ? `run: cd ${KB} && python3 -I _build/validate_kb.py ${slug} and make sure it reports 0 errors (if a fix causes an error, correct or revert that fix)` : `check by reading that each edited section still reads correctly (validate_kb.py does not apply to this specialist's document set)`}. Do not run make_bundles.py or check_kb_set.py.
Write ${WT}/training/changes/cycle-${N}/audit/${slug}.md: a title, then for every finding (applied or not) its id, file, problem and severity, the text before and after, the reason, and the verifier's reason. Return applied (ids), not_applied (id and reason) and validate_ok.`
}

log(`KB EDIT AUDIT | ${MODEL} | baseline ${BASE.slice(0, 12)} | ${A.slugs.length} specialists`)
const results = await pipeline(
  A.slugs,
  (slug) => agent(auditPrompt(slug), { label: `audit:${slug}`, phase: 'Audit', schema: FINDINGS, model: MODEL, effort: 'high' }),
  async (res, slug) => {
    const fs = (res && res.findings) || []
    const verified = await parallel(fs.map((f) => () =>
      agent(verifyPrompt(slug, f), { label: `verify:${f.id}`, phase: 'Verify', schema: VERDICT, model: MODEL, effort: 'high' })
        .then((v) => ({ ...f, verdict: v }))))
    return { slug, audited: Boolean(res), edits_reviewed: res ? res.edits_reviewed : 0, findings: verified.filter(Boolean) }
  },
  async (res, slug) => {
    const confirmed = res.findings.filter((f) => f.verdict && f.verdict.real)
    log(`${slug}: ${res.findings.length} finding(s), ${confirmed.length} confirmed`)
    if (!confirmed.length) return { ...res, fix: null }
    const fix = await agent(fixPrompt(slug, confirmed), { label: `fix:${slug}`, phase: 'Fix', schema: FIX, model: MODEL, effort: 'high' })
    return { ...res, fix }
  },
)
const done = results.filter(Boolean)
const all = done.flatMap((s) => s.findings)
log(`audit: ${all.length} findings, ${all.filter((f) => f.verdict && f.verdict.real).length} confirmed, ${done.reduce((n, s) => n + ((s.fix && s.fix.applied.length) || 0), 0)} fixes applied`)
return { baseline: BASE, model: MODEL, subjects: done }
