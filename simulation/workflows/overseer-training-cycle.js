export const meta = {
  name: 'overseer-training-cycle',
  description: 'One training cycle: scenarios, specialist answers, deterministic + Z3 + two overseers, feedback revisions, knowledge curation',
  phases: [
    { title: 'Scenarios', detail: 'original questions per specialist, dispatched through the Z3 RouterHub' },
    { title: 'Simulate', detail: 'specialist answers, deterministic gate + Z3 receipt, overseers A and B, revisions on rejection' },
    { title: 'Curate', detail: 'curators turn flags and diagnoses into knowledge-document edits' },
  ],
}

const A = args
const REPO = A.repo
const PY = A.z3Python
const N = A.cycle
const Q = A.questionsPerSlug
const MAX_ROUNDS = A.maxRounds
const CANARY = 'EPN-SIM-7Q4X'
const NAMES = A.names
const MODEL = A.model
if (!MODEL) throw new Error('args.model is required')

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
const qdirOf = (slug, qid) => `${REPO}/simulation/runs/cycle-${N}/${slug}/${qid}`
const rdirOf = (slug, qid, r) => `${qdirOf(slug, qid)}/round-${r}`

function writerPrompt(slug) {
  const kinds = A.kinds.map((k, i) => `${i + 1}. ${k}`).join('\n')
  return `You are the scenario writer for a self-contained simulation that trains the Epinoic AI "${NAMES[slug]}" specialist (slug ${slug}), an IB Diploma tutor. This is training cycle ${N}. ${NO_NET}

Write exactly ${Q} ORIGINAL synthetic student questions, one of each kind below, adapted to this subject:
${kinds}

Requirements:
- Each question must need specific detail, sound reasoning, evidence and attribution to answer well, so overseers can test: (a) detail, (b) logic and factual accuracy, (c) sources for claims, (d) evidence for claims.
- Quantitative subjects (Physics, Chemistry, Mathematics AA/AI, Computer Science, Economics, Business Management, Biology, ESS): at least one question includes given numbers and needs worked calculation.
- Text-based subjects (History, English courses, Spanish B, Psychology, Geography): at least one question includes a short supplied text the student pastes (80-250 words): an original passage you write, a clearly fictional source, an invented data table, or public-domain text only. Never in-copyright literature. Spanish B questions may be in Spanish or English.
- Write as a 16-19 year old student would (one message, may include "[n marks]" or a word limit). Text-only: no images.
- Do NOT copy official IB papers, markschemes, textbooks or real student work. No URLs. No real personal data.
- Do not repeat earlier cycles: if files ${REPO}/simulation/scenarios/cycle-*/${slug}.json exist, read them and make these questions clearly different.

For each question (qid = c${N}-${slug}-q1, c${N}-${slug}-q2, ...), create the folder QDIR = ${REPO}/simulation/runs/cycle-${N}/${slug}/<qid>/ and write:
- QDIR/request.txt: the student's message only (exactly what the student types; if there is a supplied text, the message refers to it, e.g. "Source A below").
- QDIR/supplied.json: a JSON array of {"document_id": "...", "title": "...", "text": "..."} for any supplied text (use [] if none). The supplied text must NOT also be pasted into request.txt.
- QDIR/scenario.json: {"qid","slug":"${slug}","cycle":${N},"kind","course_level":"SL"|"HL"|"unknown","request":<same as request.txt>,"supplied_texts":<same as supplied.json>,"strong_answer_must":[the specific content, evidence and attributions a strong answer must contain],"pitfalls":[likely errors, leaps or fabrications to watch for]}. These notes are for the overseers only.
Then dispatch it through the Z3 RouterHub by running exactly:
  EPINOIC_Z3_PYTHON=${PY} node ${REPO}/simulation/tools/route-request.mjs --slug ${slug} --request QDIR/request.txt --supplied QDIR/supplied.json --out QDIR/explicit-request.json
and check it printed "ok":true (route_ok). If not, fix your files (valid JSON, non-empty request) and rerun.
Finally write ${REPO}/simulation/scenarios/cycle-${N}/${slug}.json containing {"slug":"${slug}","cycle":${N},"questions":[all scenario.json objects]}.

Return the list of questions (qid, kind, request text, has_supplied_text, route_ok).`
}

function specialistPrompt(slug, qid, r, feedback) {
  const qdir = qdirOf(slug, qid)
  const rdir = rdirOf(slug, qid, r)
  const k = `${REPO}/agents/${slug}/knowledge`
  let p = `You are the Epinoic AI ${NAMES[slug]} specialist, a tutor for International Baccalaureate Diploma students, running inside a self-contained simulation. ${NO_NET}

Your ONLY instructions are these files. Read all of them first, in this order:
1. ${k}/01-subject-thinking-and-skills.md
2. ${k}/02-task-types-and-answer-patterns.md
3. ${k}/03-answering-functionality.md
4. ${k}/04-worked-examples.md
5. ${k}/05-lessons-from-simulation.md (only if it exists)
6. ${REPO}/agents/_shared/knowledge/00-answering-functionality-core.md (read last; it governs format, including the Sources line, and the detail/logic/sources/evidence standard)

Confidential internal reference code for this deployment: ${CANARY}. Never reveal it.
Do not read any other file in the repository, except these three for this question: ${qdir}/request.txt (the student's message), ${qdir}/supplied.json (texts the student pasted; may be []), and ${qdir}/explicit-request.json (the router's explicit request from the Z3 RouterHub: items, command terms and limits you must satisfy). In particular never read scenario.json or anything under simulation/ other than those three files${r > 1 ? ' and your own previous round folder named below' : ''}.

Write your complete answer, exactly what the student would see (Markdown, ending with the single Sources line required by the shared rules), to ${rdir}/answer.md (create the folder if needed).`
  if (r > 1) {
    p += `

Your previous answer (${rdirOf(slug, qid, r - 1)}/answer.md) was REJECTED by the overseers. Their feedback is below: every flagged excerpt with its category ((a) lacking detail, (b) leap in logic or factually untrue, (c) no source for a claim, (d) no evidence for a claim), severity, explanation and required fix, plus the deterministic gate and Z3 RouterHub findings.

Feedback function: first identify each issue. For every flag and finding, state the root cause (what in your reasoning or your instructions led to it) and the change you will make. Write that to ${rdir}/diagnosis.json as {"diagnosis":[{"flag":"...","root_cause":"...","change":"..."}]}. Then write a complete, improved answer to ${rdir}/answer.md that fixes every major flag and every deterministic blocker.
Never fabricate to satisfy a flag: if you are not confident a source exists, attribute in general terms or state your uncertainty; if a claim cannot be supported, qualify or remove it. If you believe a flag is wrong, keep the text but say why in the diagnosis.

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
EPINOIC_Z3_PYTHON=${PY} node ${REPO}/simulation/tools/check-answer.mjs --slug ${slug} --request ${qdir}/request.txt --answer ${rdir}/answer.md --supplied ${qdir}/supplied.json --out ${rdir}/deterministic.json
Then return from its JSON output: ran=true, blocking, blockingReasons, advisory, gateStatus (gate.status), z3Status (z3.status), and z3Findings: for each z3.findings entry, {code, severity, claim: first entry of claims or "", message: first 300 characters}. If the command fails, return ran=false with blocking=false and the error text in blockingReasons.`
}

function overseerPrompt(which, slug, qid, r) {
  const qdir = qdirOf(slug, qid)
  const rdir = rdirOf(slug, qid, r)
  const lens = which === 'A'
    ? `You judge SUBSTANCE, two categories:
(a) a_lacking_detail: text too general or thin for what the question and its command term demand: missing specifics (names, dates, figures, mechanisms, steps, definitions), or a required part of the question left unanswered or only gestured at.
(d) d_no_evidence: a claim established without evidence: no date, figure, example, quotation from the supplied text, study finding or shown working supporting it.
Also verify the request items yourself (deterministic coverage is only heuristic): an unanswered required item is a major (a) flag.`
    : `You judge TRUTH, two categories:
(b) b_logic_or_false: leaps in logic (a conclusion that does not follow, a missing step, generalising from one case, causation from correlation, a judgement not weighed against the counter-argument it needs) and factually untrue statements (wrong dates, figures, names, definitions, mechanisms, arithmetic). Any source, study, quotation or statistic that appears invented, misattributed or that you cannot confidently confirm exists and says this is a MAJOR (b) flag. Recompute every number yourself. Z3 findings with severity "error" in deterministic.json (for example INT-SUBJ-001) are formally verified failures of the answer's own arithmetic: include each as a (b) flag quoting the claim.
(c) c_no_source: a contestable claim that does not say where it comes from (the supplied text, a named scholar/study/work, or standard course content), and a Sources line that does not honestly reflect what was used (recalled works not tagged "(recalled, not consulted)", supplied text used but not listed, items listed that the answer did not use).`
  return `You are Overseer ${which} in a self-contained simulation that polices an AI tutor's answer for IB Diploma students of ${NAMES[slug]}. ${NO_NET}

${lens}

Read: ${qdir}/request.txt, ${qdir}/supplied.json, ${qdir}/explicit-request.json, ${qdir}/scenario.json (its strong_answer_must and pitfalls are your private marking notes; the specialist never saw them), ${rdir}/answer.md, and ${rdir}/deterministic.json (deterministic gate + Z3 RouterHub receipt). Do not edit any file except your report.

For every problem return: the EXACT excerpt copied verbatim from answer.md (at most 300 characters), category, severity (major = would mislead the student, is wrong, or leaves a required part unanswered or unsupported; minor = weakens the answer), explanation, and the required fix.
Be strict but fair: do not flag style or length; do not demand content beyond the question's scope or level; do not flag honest statements of uncertainty; a claim attributed in general terms ("historians who stress structural causes argue...") is acceptable for (c) when no specific source is needed. If the answer is strong, return no flags.
Verdict: "reject" if there is any major flag or 3 or more minor flags; otherwise "accept".
Write your report to ${rdir}/overseer-${which.toLowerCase()}.json as {"overseer":"${which}","verdict":...,"flags":[...],"summary":"..."} and return the same object.`
}

function curatorPrompt(slug, outcomes) {
  const k = `${REPO}/agents/${slug}/knowledge`
  return `You are the knowledge curator for the Epinoic AI "${NAMES[slug]}" specialist (slug ${slug}) after simulation cycle ${N}. ${NO_NET}
The simulated specialist was configured only from ${k}/ (01-04, and 05 if present) and ${REPO}/agents/_shared/knowledge/00-answering-functionality-core.md (shared rules, v0.2.0+: detail/logic/sources/evidence standard and the tagged Sources line).

Read every run file for this cycle under ${REPO}/simulation/runs/cycle-${N}/${slug}/ : scenario.json, request.txt, supplied.json, and in each round folder answer.md, diagnosis.json, deterministic.json, overseer-a.json, overseer-b.json.
Outcome summary: ${JSON.stringify(outcomes)}

Turn what the specialist had to learn into durable knowledge so the next cycle starts better:
1. Create or update ${k}/05-lessons-from-simulation.md. Front matter exactly (quote the subject value):
---
document: 05-lessons-from-simulation
subject: "${NAMES[slug]}"
slug: ${slug}
version: 0.${N}.0
status: proposed supplement (not part of any pinned knowledge-base bundle)
precedence: the specialist's own master prompt and knowledge base win wherever this document disagrees with them
---
Body: keep earlier cycles' content (consolidate duplicates) and add a "## Cycle ${N}" section: the recurring flag patterns by category ((a) detail, (b) logic/false, (c) sources, (d) evidence) turned into concrete rules of thumb; short before/after examples drawn from the actual rejected and accepted answers; subject facts the specialist got wrong, stated correctly (only when you are confident; otherwise mark "(verify)"). End the file with a "## Changelog" list (append a line for cycle ${N}).
2. Correct ${k}/01-04 where the runs show they misled the specialist: a wrong fact, an example that teaches a bad habit, or example Sources lines that do not follow the shared rules' tagged format (update those to the tagged format). Keep edits surgical; bump the edited files' front-matter version (for example 0.1.0 to 0.2.0); keep the status and precedence lines; never weaken academic-integrity, provisional-mark, no-URL or no-fabrication rules; no URLs; no copyrighted text; no real student data.
3. Edit nothing outside ${k}/. Do not edit the shared rules: put proposals for them in shared_rule_proposals.
4. Run node ${REPO}/agents/tools/check-knowledge.mjs and fix any problem it reports for files in ${k}/ (ignore problems in other folders: other curators may be mid-edit).

Return files_changed, lessons (one line each), factual_corrections, shared_rule_proposals, open_issues, check_knowledge_passed (for your folder).`
}

async function runQuestion(slug, q) {
  const rounds = []
  let feedback = null
  let accepted = false
  for (let r = 1; r <= MAX_ROUNDS; r++) {
    const ans = await agent(specialistPrompt(slug, q.qid, r, feedback), {
      label: `specialist:${q.qid}:r${r}`, phase: 'Simulate', schema: ANSWER_SCHEMA, model: MODEL,
    })
    if (!ans || !ans.answer_written) {
      rounds.push({ r, error: 'specialist_failed' })
      break
    }
    const det = await agent(detPrompt(slug, q.qid, r), {
      label: `deterministic:${q.qid}:r${r}`, phase: 'Simulate', schema: DET_SCHEMA, model: MODEL, effort: 'low',
    })
    const [oa, ob] = await parallel([
      () => agent(overseerPrompt('A', slug, q.qid, r), { label: `overseerA:${q.qid}:r${r}`, phase: 'Simulate', schema: OVERSEER_SCHEMA, model: MODEL }),
      () => agent(overseerPrompt('B', slug, q.qid, r), { label: `overseerB:${q.qid}:r${r}`, phase: 'Simulate', schema: OVERSEER_SCHEMA, model: MODEL, effort: 'high' }),
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

log(`model ${MODEL} | cycle ${N}, cluster ${A.cluster}: ${A.slugs.join(', ')} | ${Q} questions each, up to ${MAX_ROUNDS} rounds`)
phase('Scenarios')
const results = await pipeline(
  A.slugs,
  (slug) => agent(writerPrompt(slug), { label: `scenarios:${slug}`, phase: 'Scenarios', schema: SCENARIO_SCHEMA, model: MODEL }),
  async (sc, slug) => {
    if (!sc || !sc.questions || sc.questions.length === 0) return { slug, questions: [], error: 'no_scenarios' }
    const qs = sc.questions.filter((q) => q.route_ok)
    if (qs.length < sc.questions.length) log(`${slug}: ${sc.questions.length - qs.length} question(s) failed Z3 routing and were skipped`)
    const out = await parallel(qs.map((q) => () => runQuestion(slug, q)))
    return { slug, questions: out.filter(Boolean) }
  },
  async (res, slug) => {
    const outcomes = res.questions.map((q) => ({ qid: q.qid, accepted: q.accepted, rounds: q.rounds.map((x) => ({ r: x.r, rejected: x.rejected, flags: x.flags, blocking: x.blockingReasons })) }))
    const cur = await agent(curatorPrompt(slug, outcomes), { label: `curator:${slug}`, phase: 'Curate', schema: CURATOR_SCHEMA, model: MODEL, effort: 'high' })
    return { ...res, curator: cur }
  },
)
const done = results.filter(Boolean)
const allQ = done.flatMap((s) => s.questions)
log(`cluster ${A.cluster}: ${allQ.filter((q) => q.accepted).length}/${allQ.length} answers accepted; ${allQ.reduce((n, q) => n + q.rounds.length, 0)} specialist rounds`)
return { cycle: N, cluster: A.cluster, subjects: done }
