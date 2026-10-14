export const meta = {
  name: 'real-agent-training-cycle',
  description: 'Train the REAL Epinoic specialists: full-context bundles, deterministic gate + Z3 router, two overseers, revisions, curated knowledge-base edits',
  phases: [
    { title: 'Scenarios', detail: 'original questions per specialist, in scope for its real syllabus gate, dispatched through the Z3 RouterHub' },
    { title: 'Simulate', detail: 'real specialist (full-context bundle, no tools), deterministic gate + Z3 receipt, overseers A and B, revisions on rejection' },
    { title: 'Curate', detail: 'curators edit the real knowledge base in house format; validator must pass; every edit logged' },
  ],
}

const A = args
const WT = A.worktree
const TOOLS = A.tools
const PY = A.z3Python
const N = A.cycle
const Q = A.questionsPerSlug
const MAX_ROUNDS = A.maxRounds
const NAMES = A.names
const MODEL = A.model
if (!MODEL || !WT || !TOOLS) throw new Error('args.model, args.worktree and args.tools are required')
// Model split (owner's instruction, 14 Oct): specialists that produce the answers run on
// SPECIALIST_MODEL (Haiku 5.5); overseers, curators and scenario writers run on JUDGE_MODEL
// (Fable 5.1). The deterministic runner only executes a command.
const SPECIALIST_MODEL = A.specialistModel || MODEL
const JUDGE_MODEL = A.judgeModel || MODEL
// Optional: read the specialist's bundle from another checkout (for example the untouched
// baseline on main) so a same-model before/after comparison is possible.
const BUNDLE_ROOT = A.bundleRoot || null
// mode "train" (default): scenarios -> answers with feedback revisions -> curation.
// mode "retest": a FRESH specialist instance (no feedback, no memory) answers the given
// cycle's questions once from the rebuilt bundle; the same overseers judge it. This shows
// whether the improvement lives in the knowledge documents themselves.
const MODE = A.mode || 'train'

const FLAG = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: ['a_lacking_detail', 'b_logic_or_false', 'c_no_source', 'd_no_evidence'] },
    severity: { type: 'string', enum: ['major', 'minor'] },
    excerpt: { type: 'string' },
    explanation: { type: 'string' },
    required_fix: { type: 'string' },
  },
  required: ['category', 'severity', 'excerpt', 'explanation', 'required_fix'],
}
const OVERSEER_SCHEMA = {
  type: 'object',
  properties: {
    overseer: { type: 'string', enum: ['A', 'B'] },
    verdict: { type: 'string', enum: ['accept', 'reject'] },
    flags: { type: 'array', items: FLAG },
    summary: { type: 'string' },
  },
  required: ['overseer', 'verdict', 'flags', 'summary'],
}
const SCENARIO_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          qid: { type: 'string' },
          kind: { type: 'string' },
          request: { type: 'string' },
          has_supplied_text: { type: 'boolean' },
          route_ok: { type: 'boolean' },
        },
        required: ['qid', 'kind', 'request', 'has_supplied_text', 'route_ok'],
      },
    },
  },
  required: ['questions'],
}
const ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    answer_written: { type: 'boolean' },
    answer_chars: { type: 'integer' },
    diagnosis: {
      type: 'array',
      items: {
        type: 'object',
        properties: { flag: { type: 'string' }, root_cause: { type: 'string' }, change: { type: 'string' } },
        required: ['flag', 'root_cause', 'change'],
      },
    },
  },
  required: ['answer_written', 'answer_chars', 'diagnosis'],
}
const DET_SCHEMA = {
  type: 'object',
  properties: {
    ran: { type: 'boolean' },
    blocking: { type: 'boolean' },
    blockingReasons: { type: 'array', items: { type: 'string' } },
    advisory: { type: 'array', items: { type: 'string' } },
    gateStatus: { type: 'string' },
    z3Status: { type: 'string' },
    z3Findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: { code: { type: 'string' }, severity: { type: 'string' }, claim: { type: 'string' }, message: { type: 'string' } },
        required: ['code', 'severity', 'claim', 'message'],
      },
    },
  },
  required: ['ran', 'blocking', 'blockingReasons', 'advisory', 'gateStatus', 'z3Status', 'z3Findings'],
}
const CURATOR_SCHEMA = {
  type: 'object',
  properties: {
    files_changed: { type: 'array', items: { type: 'string' } },
    lessons: { type: 'array', items: { type: 'string' } },
    factual_corrections: { type: 'array', items: { type: 'string' } },
    shared_rule_proposals: { type: 'array', items: { type: 'string' } },
    open_issues: { type: 'array', items: { type: 'string' } },
    check_knowledge_passed: { type: 'boolean' },
  },
  required: ['files_changed', 'lessons', 'factual_corrections', 'shared_rule_proposals', 'open_issues', 'check_knowledge_passed'],
}


const NO_NET = 'Self-contained environment: do NOT use web search, web fetch or any network tool.'
const KB = `${WT}/knowledge-bases`
const qdirOf = (slug, qid) => `${WT}/training/runs/cycle-${N}/${slug}/${qid}`
const rdirOf = (slug, qid, r) => `${qdirOf(slug, qid)}/${MODE === 'retest' ? `fresh-${A.retestTag}` : `round-${r}`}`
const bundleOf = (slug) => `${BUNDLE_ROOT || KB}/_bundles/${slug}.full-context.txt`

function writerPrompt(slug) {
  const kinds = A.kinds.map((k, i) => `${i + 1}. ${k}`).join('\n')
  return `You are the scenario writer for a self-contained training simulation of the REAL Epinoic AI "${NAMES[slug]}" specialist (folder ${KB}/${slug}). Training cycle ${N}. ${NO_NET}
First read ${KB}/${slug}/master_prompt.txt (its purpose, modes, task gate, syllabus or level gate and non-negotiables) so every question is one this specialist is meant to handle (the English specialist is course-agnostic literary analysis; respect each agent's own scope).

Write exactly ${Q} ORIGINAL synthetic student questions, one of each kind below:
${kinds}

Requirements:
- Each question must need specific detail, sound reasoning, evidence and attribution, so overseers can test (a) detail, (b) logic and factual accuracy, (c) sources for claims, (d) evidence for claims.
- Quantitative subjects (physics, chemistry, mathematics-aa/ai, computer-science, economics, business-management, biology, ess): at least one question gives numbers and needs worked calculation.
- Text-based subjects (history, english-*, language-b-spanish, psychology, geography): at least one includes a short supplied text (80-250 words) the student pastes: an original passage, a clearly fictional source, an invented data table, or public-domain text only. Never in-copyright literature. Spanish B may be in Spanish or English.
- One message as a 16-19 year old would write it (may include "[n marks]" or a word limit). Text only. No official IB papers, markschemes or textbook text; no URLs; no real personal data.
- Do not repeat earlier cycles: read ${WT}/training/scenarios/cycle-*/${slug}.json if they exist.

For each question (qid = c${N}-${slug}-q1, ...) create QDIR = ${WT}/training/runs/cycle-${N}/${slug}/<qid>/ and write:
- QDIR/request.txt: the student's message only (supplied text NOT pasted here; refer to it, e.g. "Source A below").
- QDIR/supplied.json: JSON array of {"document_id","title","text"} ([] if none).
- QDIR/scenario.json: {"qid","slug":"${slug}","cycle":${N},"kind","course_level":"SL"|"HL"|"unknown","request","supplied_texts","strong_answer_must":[...],"pitfalls":[...]} (overseer-only notes).
Then run exactly:
  EPINOIC_Z3_PYTHON=${PY} node ${TOOLS}/simulation/tools/route-request.mjs --slug ${slug} --request QDIR/request.txt --supplied QDIR/supplied.json --out QDIR/explicit-request.json
and check it printed "ok":true (route_ok). Fix and rerun if not.
Finally write ${WT}/training/scenarios/cycle-${N}/${slug}.json = {"slug":"${slug}","cycle":${N},"questions":[all scenario.json objects]}.
Return the questions (qid, kind, request, has_supplied_text, route_ok).`
}

function specialistPrompt(slug, qid, r, feedback) {
  const qdir = qdirOf(slug, qid)
  const rdir = rdirOf(slug, qid, r)
  let p = `Your complete system prompt is the file ${bundleOf(slug)} (the REAL full-context bundle of the Epinoic AI "${NAMES[slug]}" specialist: its master prompt followed by all of its knowledge documents). Read the ENTIRE file before answering: it is about 2,000-3,300 lines, so read lines 1-2000 first, then continue from line 2001 to the end. Then act exactly as that specialist, following its procedure, gates, non-negotiables, SOURCE POLICY and authority order.

This session runs in full-context mode WITHOUT tools: there is no library search, no MyLib/MyBib and no web access, and none was used. Where your instructions rely on the library or MyLib, follow your own rules for when they are unavailable; never claim a library unit, textbook or MyLib result was consulted. ${NO_NET}
Do not read any other file except these for this question: ${qdir}/request.txt (the student's message), ${qdir}/supplied.json (texts the student pasted; may be []), ${qdir}/explicit-request.json (the router's explicit request from the Z3 RouterHub: items, command terms, limits)${r > 1 ? `, and your own previous answer ${rdirOf(slug, qid, r - 1)}/answer.md` : ''}. Never read scenario.json or other run files.

Write your complete answer, exactly what the student would see, to ${rdir}/answer.md (create the folder if needed).`
  if (r > 1) {
    p += `

Your previous answer was REJECTED by the overseers. Their feedback follows: every flagged excerpt with its category ((a) lacking detail, (b) a leap in logic or factually untrue, (c) a claim without a source permitted by your SOURCE POLICY, (d) a claim without evidence), severity, explanation and required fix, plus the deterministic gate and Z3 RouterHub findings.

Feedback function: first identify each issue. For every flag and finding, state the root cause (what in your reasoning or your instructions led to it) and the change you will make, and write that to ${rdir}/diagnosis.json as {"diagnosis":[{"flag":"...","root_cause":"...","change":"..."}]}. Then write a complete improved answer to ${rdir}/answer.md that fixes every major flag and every deterministic blocker, within your own rules.
Never fabricate to satisfy a flag: if no permitted source supports a claim, say so as your SOURCE POLICY directs, qualify it, or remove it. If a flag conflicts with your own non-negotiables, keep your rule and explain why in the diagnosis.

FEEDBACK:
${JSON.stringify(feedback, null, 1)}`
  }
  p += `

Return: answer_written (true once the file exists), answer_chars, and diagnosis (empty for round 1).`
  return p
}

function detPrompt(slug, qid, r) {
  const qdir = qdirOf(slug, qid)
  const rdir = rdirOf(slug, qid, r)
  return `Run exactly this one command and nothing else (do not modify any file):
EPINOIC_Z3_PYTHON=${PY} node ${TOOLS}/simulation/tools/check-answer.mjs --slug ${slug} --request ${qdir}/request.txt --answer ${rdir}/answer.md --supplied ${qdir}/supplied.json --gate-config ${WT}/training/config/gate/${slug}.json --out ${rdir}/deterministic.json
Then return from its JSON output: ran=true, blocking, blockingReasons, advisory, gateStatus (gate.status), z3Status (z3.status), and z3Findings: for each z3.findings entry {code, severity, claim: first entry of claims or "", message: first 300 characters}. If the command fails, return ran=false, blocking=false, and the error text in blockingReasons.`
}

function overseerPrompt(which, slug, qid, r) {
  const qdir = qdirOf(slug, qid)
  const rdir = rdirOf(slug, qid, r)
  const lens = which === 'A'
    ? `You judge SUBSTANCE, two categories:
(a) a_lacking_detail: text too general or thin for what the question, its command term and its marks demand: missing specifics (names, dates, figures, mechanisms, steps, definitions), or a required part left unanswered or only gestured at.
(d) d_no_evidence: a claim established without evidence: no date, figure, example, quotation from the supplied text, study finding or shown working supporting it.
Also verify the request items yourself (deterministic coverage is heuristic): an unanswered required item is a major (a) flag.`
    : `You judge TRUTH, two categories:
(b) b_logic_or_false: leaps in logic (a conclusion that does not follow, a missing step, generalising from one case, causation from correlation, a judgement not weighed against the counter-argument it needs) and factually untrue statements (wrong dates, figures, names, definitions, mechanisms, arithmetic). Any source, study, quotation, statistic, historian's view, page number, edition, library unit, textbook or MyLib/MyBib result that appears invented, misattributed or not actually available in this no-tools session is a MAJOR (b) flag. Recompute every number. Z3 findings with severity "error" in deterministic.json (for example INT-SUBJ-001) are formally verified failures of the answer's own arithmetic: include each as a (b) flag quoting the claim.
(c) c_no_source: a contestable claim that is not backed by a source the specialist's own SOURCE POLICY permits (read it in ${KB}/${slug}/master_prompt.txt: conversation material, course-standard knowledge presented as such, the library when available, MyLib for referencing only) or that is not flagged as unverified when it should be; and any "Sources:" line that does not follow that policy and audit 02 section 5 (in a no-tools run it may name supplied material or course-standard knowledge, never library units or MyLib guides).
Also judge marking against the specialist's own rules (its non-negotiables and Assessment K32): any mark, band, level or grade the answer AWARDS to student work must be labelled provisional as those rules require; a missing label is a major (b) flag. A header stating what a question is worth (for example "Question - to what extent - 15 marks") is not an awarded mark.`
  return `You are Overseer ${which} in a self-contained training simulation that polices an answer by the REAL Epinoic AI "${NAMES[slug]}" specialist for IB Diploma students. ${NO_NET}

${lens}

Read: ${KB}/${slug}/master_prompt.txt (the specialist's own rules: judge against them, and do not penalise the specialist for following its non-negotiables, for example labelling marks provisional, asking a gate question, or refusing to write coursework), ${qdir}/request.txt, ${qdir}/supplied.json, ${qdir}/explicit-request.json, ${qdir}/scenario.json (strong_answer_must and pitfalls are your private notes; the specialist never saw them), ${rdir}/answer.md and ${rdir}/deterministic.json (deterministic gate + Z3 RouterHub receipt). Edit no file except your report.

For every problem return the EXACT excerpt copied verbatim from answer.md (at most 300 characters), category, severity (major = misleading, wrong, or leaves a required part unanswered or unsupported; minor = weakens the answer), explanation and the required fix. Be strict but fair: no style or length flags; nothing beyond the question's scope or level; honest uncertainty is not a flaw. If the answer is strong, return no flags.
Verdict: "reject" if any major flag or 3 or more minor flags; otherwise "accept".
Write your report to ${rdir}/overseer-${which.toLowerCase()}.json as {"overseer":"${which}","verdict":...,"flags":[...],"summary":"..."} and return the same object.`
}

function curatorPrompt(slug, outcomes) {
  const dir = `${KB}/${slug}`
  return `You are the knowledge-base curator for the REAL Epinoic AI "${NAMES[slug]}" specialist after training cycle ${N}. ${NO_NET}
The specialist ran from its full-context bundle (its master prompt and knowledge documents in ${dir}/). Read every run file for this cycle under ${WT}/training/runs/cycle-${N}/${slug}/ (scenario.json, request.txt, supplied.json, and per round answer.md, diagnosis.json, deterministic.json, overseer-a.json, overseer-b.json).
Outcome summary: ${JSON.stringify(outcomes)}
Notes on the evidence: deterministic.json files are authoritative (they were re-scored after a gate false positive on question-value headers was fixed; any "provisional_label_missing" in the outcome summary above is that false positive, not an agent fault). A Z3 finding INT-SUBJ-001 on a line where the specialist QUOTES a student's wrong arithmetic in order to correct it is a checker artefact; do not teach the agent to avoid correcting errors, but you may teach it to state the correct relation rather than restating the wrong equation as its own.

Your job: change the REAL knowledge base so the next cycle starts better, in the house format.
1. Read ${KB}/_build/SPEC.md (house format: file roster, coded rules with evidence labels [E] [O] [R] [I] [P], cross-reference style, Open points, word-count bounds) and the files you edit.
2. Edit only files in ${dir}/ (master_prompt.txt and the seven .md documents). Make surgical, well-placed edits that fix what the runs show: a rule that was missing or unclear, a correction-table row, an example or pattern-not-to-imitate in examples.md, a quality-test item, a corrected fact. New or changed rules must carry the [P] label (proposed from simulation) unless the evidence supports another label, and follow the document's own code numbering (next free code; no reuse). Prefer the .md documents; edit master_prompt.txt only for a mandatory rule that must be in the instruction channel.
3. NEVER: weaken a non-negotiable, the academic-integrity or provisional-marking rules, or the AUTHORITY ORDER; change the verbatim SOURCE POLICY lines; add URLs; add copyrighted text, past-paper text or real student data; invent facts (mark anything uncertain as [R] with an interim rule, per the house format).
4. Run: cd ${KB} && python3 -I _build/validate_kb.py ${slug} — fix until it reports 0 errors (keep warnings at 0 if possible; report any). Do NOT run make_bundles.py or check_kb_set.py (the coordinator rebuilds bundles once for all subjects).
5. Write ${WT}/training/changes/cycle-${N}/${slug}.md: for every edit, the file and rule code, what changed (before -> after, short), why (which flags/diagnoses/runs motivated it, by qid and round), and its evidence label. Also list proposals you did NOT make (for example changes that belong in the shared SOURCE POLICY or need the owner).

Return files_changed, lessons (one line each), factual_corrections, shared_rule_proposals (cross-subject or owner-level), open_issues, check_knowledge_passed (true when validate_kb.py reports 0 errors).`
}

async function runQuestion(slug, q, maxRounds = MAX_ROUNDS) {
  const rounds = []
  let feedback = null
  let accepted = false
  for (let r = 1; r <= maxRounds; r++) {
    const ans = await agent(specialistPrompt(slug, q.qid, r, feedback), {
      label: `specialist:${q.qid}:r${r}`, phase: 'Simulate', schema: ANSWER_SCHEMA, model: SPECIALIST_MODEL,
    })
    if (!ans || !ans.answer_written) {
      rounds.push({ r, error: 'specialist_failed' })
      break
    }
    const det = await agent(detPrompt(slug, q.qid, r), {
      label: `deterministic:${q.qid}:r${r}`, phase: 'Simulate', schema: DET_SCHEMA, model: 'haiku', effort: 'low',
    })
    const [oa, ob] = await parallel([
      () => agent(overseerPrompt('A', slug, q.qid, r), { label: `overseerA:${q.qid}:r${r}`, phase: 'Simulate', schema: OVERSEER_SCHEMA, model: JUDGE_MODEL }),
      () => agent(overseerPrompt('B', slug, q.qid, r), { label: `overseerB:${q.qid}:r${r}`, phase: 'Simulate', schema: OVERSEER_SCHEMA, model: JUDGE_MODEL, effort: 'high' }),
    ])
    const flags = [...((oa && oa.flags) || []), ...((ob && ob.flags) || [])]
    const count = (cat, sev) => flags.filter((f) => f.category === cat && (!sev || f.severity === sev)).length
    const detBlocking = det ? det.blocking : null
    const rejected = Boolean(detBlocking) || !oa || !ob || oa.verdict === 'reject' || ob.verdict === 'reject'
    rounds.push({
      r,
      detBlocking,
      blockingReasons: det ? det.blockingReasons : ['deterministic_agent_failed'],
      z3Errors: det ? det.z3Findings.filter((f) => f.severity === 'error').map((f) => f.code) : [],
      verdictA: oa ? oa.verdict : 'missing',
      verdictB: ob ? ob.verdict : 'missing',
      flags: {
        a: count('a_lacking_detail'), b: count('b_logic_or_false'), c: count('c_no_source'), d: count('d_no_evidence'),
        major: flags.filter((f) => f.severity === 'major').length,
      },
      diagnosed: r > 1 ? ans.diagnosis.length : null,
      rejected,
    })
    if (!rejected) { accepted = true; break }
    feedback = {
      deterministic: det ? { blockingReasons: det.blockingReasons, z3Findings: det.z3Findings, advisory: det.advisory } : 'deterministic check failed to run',
      overseerA: oa ? { verdict: oa.verdict, flags: oa.flags, summary: oa.summary } : 'overseer A returned no report',
      overseerB: ob ? { verdict: ob.verdict, flags: ob.flags, summary: ob.summary } : 'overseer B returned no report',
    }
  }
  return { qid: q.qid, kind: q.kind, accepted, rounds }
}

if (MODE === 'curate') {
  // Finish a cycle from files already on disk: run any missing overseer reports, then curate.
  log(`REAL AGENTS | CURATE | judges ${JUDGE_MODEL} | cycle ${N}: ${A.slugs.join(', ')}`)
  phase('Simulate')
  await parallel((A.missing || []).flatMap((m) => [
    () => agent(overseerPrompt('A', m.slug, m.qid, m.r), { label: `overseerA:${m.qid}:r${m.r}`, phase: 'Simulate', schema: OVERSEER_SCHEMA, model: JUDGE_MODEL }),
    () => agent(overseerPrompt('B', m.slug, m.qid, m.r), { label: `overseerB:${m.qid}:r${m.r}`, phase: 'Simulate', schema: OVERSEER_SCHEMA, model: JUDGE_MODEL, effort: 'high' }),
  ]))
  phase('Curate')
  const cur = await parallel(A.slugs.map((slug) => () =>
    agent(curatorPrompt(slug, (A.outcomes || {})[slug] || []), { label: `curator:${slug}`, phase: 'Curate', schema: CURATOR_SCHEMA, model: JUDGE_MODEL, effort: 'high' })
      .then((c) => ({ slug, curator: c }))))
  return { cycle: N, mode: 'curate', curated: cur.filter(Boolean) }
}

if (MODE === 'retest') {
  if (!A.retestTag || !A.questions) throw new Error('retest needs args.retestTag and args.questions {slug: [{qid, kind}]}')
  log(`REAL AGENTS | FRESH-INSTANCE RETEST ${A.retestTag} | specialists ${SPECIALIST_MODEL}${BUNDLE_ROOT ? ' (baseline bundle)' : ''}, judges ${JUDGE_MODEL} | cycle ${N}, cluster ${A.cluster}: ${A.slugs.join(', ')}`)
  phase('Simulate')
  const fresh = await pipeline(
    A.slugs,
    async (slug) => {
      const qs = A.questions[slug] || []
      const out = await parallel(qs.map((q) => () => runQuestion(slug, q, 1)))
      return { slug, questions: out.filter(Boolean) }
    },
  )
  return { cycle: N, cluster: A.cluster, mode: 'retest', retestTag: A.retestTag, subjects: fresh.filter(Boolean) }
}
log(`REAL AGENTS | specialists ${SPECIALIST_MODEL}, judges ${JUDGE_MODEL} | cycle ${N}, cluster ${A.cluster}: ${A.slugs.join(', ')} | ${Q} questions each, up to ${MAX_ROUNDS} rounds`)
phase('Scenarios')
const results = await pipeline(
  A.slugs,
  (slug) => agent(writerPrompt(slug), { label: `scenarios:${slug}`, phase: 'Scenarios', schema: SCENARIO_SCHEMA, model: JUDGE_MODEL }),
  async (sc, slug) => {
    if (!sc || !sc.questions || sc.questions.length === 0) return { slug, questions: [], error: 'no_scenarios' }
    const qs = sc.questions.filter((q) => q.route_ok)
    if (qs.length < sc.questions.length) log(`${slug}: ${sc.questions.length - qs.length} question(s) failed Z3 routing and were skipped`)
    const out = await parallel(qs.map((q) => () => runQuestion(slug, q)))
    return { slug, questions: out.filter(Boolean) }
  },
  async (res, slug) => {
    const outcomes = res.questions.map((q) => ({ qid: q.qid, accepted: q.accepted, rounds: q.rounds.map((x) => ({ r: x.r, rejected: x.rejected, flags: x.flags, blocking: x.blockingReasons })) }))
    const cur = await agent(curatorPrompt(slug, outcomes), { label: `curator:${slug}`, phase: 'Curate', schema: CURATOR_SCHEMA, model: JUDGE_MODEL, effort: 'high' })
    return { ...res, curator: cur }
  },
)
const done = results.filter(Boolean)
const allQ = done.flatMap((s) => s.questions)
log(`cluster ${A.cluster}: ${allQ.filter((q) => q.accepted).length}/${allQ.length} answers accepted; ${allQ.reduce((n, q) => n + q.rounds.length, 0)} specialist rounds`)
return { cycle: N, cluster: A.cluster, subjects: done }
