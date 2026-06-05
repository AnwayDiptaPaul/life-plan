/* ═══════════════════════════════════════════════════════════
   SPRINT OS — data.js  v2
   All shared data, state, utilities.
   BUG FIXES v2:
   - daysUntil() uses fresh new Date() not stale D.today
   - planMonth() same fix
   - flatCourses() is memoised correctly
   - buildSchedule() moved fully here so it's available before update.js
   NEW in v2:
   - MATH_TOPICS — chapter-level math progress tracker data
   - MOCK_SCORES — IELTS weekly mock log data/persistence
   - HABITS — daily habit tracker keys
   - OU_CHECKLIST — OU application document checklist
   - INCOME_LOG — monthly income tracking
═══════════════════════════════════════════════════════════ */

// ── CONSTANTS ─────────────────────────────────────────────────
const START_DATE = new Date('2026-05-29T00:00:00');
const EDX_DATE   = new Date('2026-06-26T23:59:59');
const IELTS_DATE = new Date('2026-07-31T00:00:00');
const OUAPP_DATE = new Date('2027-11-01T00:00:00');

// Always fresh — never cached
function today()      { return new Date(); }
function daysUntil(d) { return Math.max(0, Math.ceil((d - today()) / 864e5)); }
function planMonth()  { return Math.max(1, Math.min(18, Math.ceil((today() - START_DATE) / 864e5 / 30.44))); }

// Legacy alias for code that uses D.xxx
const D = {
  get start()  { return START_DATE; },
  get edx()    { return EDX_DATE; },
  get ielts()  { return IELTS_DATE; },
  get ouApp()  { return OUAPP_DATE; },
  get today()  { return today(); },
};

// ── SAVINGS STATE ──────────────────────────────────────────────
const S = {
  get bdt()     { return parseInt(localStorage.getItem('s_bdt'))     || 50000; },
  get monthly() { return parseInt(localStorage.getItem('s_monthly')) || 20000; },
  set bdt(v)    { localStorage.setItem('s_bdt',     String(v)); },
  set monthly(v){ localStorage.setItem('s_monthly', String(v)); },
  save()        { /* setters auto-save */ },
  eur()         { return this.bdt / 130; },
  pct()         { return Math.min(100, this.eur() / 10000 * 100); },
  remEur()      { return Math.max(0, 10000 - this.eur()); },
  months()      { const m = this.monthly / 130; return m > 0 ? Math.ceil(this.remEur() / m) : 999; },
};

// ── PACE TIERS ─────────────────────────────────────────────────
const TIERS = [
  { id:1, name:'Minimum Viable Sprint', icon:'🏃', col:'#ff7722', range:'< 30,000 BDT/mo', min:0, fillPct:25,
    desc:'Baseline sprint. IELTS 1 hr/day. Courses 1.5 hr/day. Math 45 min/day.',
    bullets:['IELTS: 1 hr/day (order) | 2.5 hr (free)','Courses: 1.5 hr/day (order) | 3 hr (free)','Math: 45 min (order) | 2 hr (free)','Recreation: 30 min','Thesis: Sat + 1 weekday'],
    warn:'⚠️ Cannot hit 10k EUR in 1.5yr at < 30k/month. Grow income urgently.' },
  { id:2, name:'On-Track Pace', icon:'⚡', col:'#ffb020', range:'30,000–60,000 BDT/mo', min:30000, fillPct:55,
    desc:'Lower feasibility bound. Study pace matches course-completion target.',
    bullets:['IELTS: 1.5 hr/day (order) | 3 hr (free)','Courses: 2 hr/day (order) | 4 hr (free)','Math: 1 hr (order) | 2.5 hr (free)','Recreation: 20 min','Thesis: Sat + 2 weekdays'],
    warn:'⚠️ Still below 83k/month target. Push income.' },
  { id:3, name:'Accelerated', icon:'🚀', col:'#00e5a0', range:'60,000–90,000 BDT/mo', min:60000, fillPct:80,
    desc:'On savings curve. OU application in ~14 months possible.',
    bullets:['IELTS: 1.5 hr/day (order) | 3.5 hr (free)','Courses: 2.5 hr/day (order) | 4.5 hr (free)','Math: 1 hr (order) | 3 hr (free)','Recreation: 20 min','Thesis: Sat + 2 weekdays'],
    warn:'' },
  { id:4, name:'Full Throttle', icon:'🛸', col:'#4488ff', range:'> 90,000 BDT/mo', min:90000, fillPct:100,
    desc:'OU in 12–14 months. Maximum compression. Near-OU-student mode.',
    bullets:['IELTS: 1.5 hr/day (order) | 4 hr (free)','Courses: 3 hr/day (order) | 5 hr (free)','Math: 1.5 hr (order) | 3 hr (free)','Recreation: 15 min','Thesis: Sat + 3 weekdays'],
    warn:'' },
];
function getTier() { let t = TIERS[0]; for (const x of TIERS) if (S.monthly >= x.min) t = x; return t; }

// ── TIMELINE EVENTS ────────────────────────────────────────────
const TL_EVENTS = {
  1:'IELTS Prep + edX', 2:'IELTS EXAM ★', 3:'Coursera BIM', 4:'Structural',
  5:'Structural',       6:'RCC + Steel',  7:'Geotechnical', 8:'HKUST Math',
  9:'HKUST Math',       10:'FEM + Research', 11:'GIS + Sustain.', 12:'Udemy',
  13:'All Done ✓',      14:'Math Done ✓', 15:'Savings Push', 16:'Thesis Sub.',
  17:'OU Docs',         18:'★ Apply OU',
};

// ── MILESTONES ─────────────────────────────────────────────────
const MILESTONES = [
  { t:'Book IELTS — July 2026 slot',           s:'Do this today. Book the slot, then prep to the date.',                              h:'TODAY',          type:'today',    pri:true  },
  { t:'edX: Agentic AI + AI for Everyone (IBM)', s:'Both expire Jun 26 2026. Open one today alongside IELTS.',                        h:'Before Jun 26',  type:'urgent'             },
  { t:'LinkedIn Learning done',                  s:'BIM Foundations (1h 16m) + Revit Twinmotion (1h 20m). ~2.5 hrs total.',          h:'Jun 2026',       type:'normal'             },
  { t:'IELTS EXAM — Band 7.0',                   s:'July 2026. Sit regardless of mock scores. Unlocks OU + international clients.',   h:'Jul 2026',       type:'priority', pri:true  },
  { t:'Coursera license renewed + BIM started',  s:'Renew immediately after IELTS. Begin NTU BIM course same day.',                  h:'Aug 2026',       type:'normal'             },
  { t:'Coursera Structural cleared',             s:'Georgia Tech (6) + Dartmouth (4) + L&T RCC (3) + L&T Steel (3) = 16 courses.',  h:'Oct–Nov 2026',   type:'normal'             },
  { t:'Coursera Geotechnical + Construction',    s:'L&T Piling (3) + L&T Formwork (3) = 6 courses done.',                           h:'Dec 2026–Jan 2027', type:'normal'           },
  { t:'HKUST Math for Engineers complete',       s:'5 courses: Matrix Algebra → Diff Eq → Vector Calculus → Numerical → Capstone.', h:'Feb–Mar 2027',   type:'normal'             },
  { t:'Coursera queue fully cleared',            s:'All ~50 Coursera courses done.',                                                  h:'Mar–Apr 2027',   type:'normal'             },
  { t:'Udemy queue done (trimmed)',              s:'Drop Cyber Security + Unreal Engine. Keep: Geotechnical, Python, MATLAB, AI A-Z.',h:'Jun–Jul 2027',   type:'normal'             },
  { t:'Math & Physics self-study complete',      s:'Classical Mech → Linear Alg → Geom Algebra → Group Theory → QM I+II → GR.',    h:'Jul 2027',       type:'normal'             },
  { t:'Savings — 5,000 EUR milestone',           s:'Requires 83k+/month. If not on track by Month 6, income must increase.',         h:'Jan 2027',       type:'normal'             },
  { t:'Savings — 10,000 EUR target hit',         s:'Full OU fund secured. Triggers application process.',                            h:'Aug–Sep 2027',   type:'priority', pri:true  },
  { t:'Thesis Paper 1 submitted',                s:'Saturday + weekday sessions. Must be submitted before OU application.',          h:'Sep 2027',       type:'normal'             },
  { t:'OU MPhys Application submitted',          s:'Gate: IELTS ✓ | All courses ✓ | Math ✓ | 10k EUR ✓ | Thesis 1 ✓',             h:'Sep–Nov 2027',   type:'priority', pri:true  },
  { t:'Begin OU MPhys',                          s:'Feb or Oct 2028 intake. The capstone — all streams converge.',                   h:'2028',           type:'normal'             },
  { t:'Savings baseline started — 50,000 BDT',  s:'Already done ✓ — May 2026',                                                      h:'Done ✓',         type:'done',     done:true },
];

function getMDone() {
  try {
    const saved = JSON.parse(localStorage.getItem('m_done'));
    if (!saved || saved.length !== MILESTONES.length) return MILESTONES.map(m => !!m.done);
    return saved;
  } catch { return MILESTONES.map(m => !!m.done); }
}
function setMDone(arr) { localStorage.setItem('m_done', JSON.stringify(arr)); }

// ── MATH PROGRESS TRACKER ──────────────────────────────────────
// Chapter-level checklist from instructions.md Part 13 item 7
const MATH_TOPICS = [
  { subject:'Classical Mechanics', ref:'Goldstein', months:'1–2', chapters:[
    'Ch 1 — Survey of the Elementary Principles',
    'Ch 2 — Variational Principles & Lagrange Equations',
    'Ch 3 — The Two-Body Central Force Problem',
    'Ch 4 — The Kinematics of Rigid Body Motion',
    'Ch 5 — The Rigid Body Equations of Motion',
    'Ch 6 — Oscillations',
    'Ch 7 — The Classical Mechanics of the Special Theory of Relativity',
    'Ch 8 — The Hamilton Equations of Motion',
    'Ch 9 — Canonical Transformations',
    'Ch 10 — Hamilton–Jacobi Theory and Action-Angle Variables',
  ]},
  { subject:'Linear Algebra', ref:'HKUST + Gilbert Strang', months:'3–4', chapters:[
    'Vectors, matrices, and matrix operations',
    'Systems of linear equations — Gaussian elimination',
    'Vector spaces and subspaces',
    'Orthogonality and least squares',
    'Eigenvalues and eigenvectors',
    'Diagonalisation and similarity',
    'Singular Value Decomposition (SVD)',
    'Applications: Fourier series, graph theory',
  ]},
  { subject:'Differential Equations', ref:'HKUST', months:'4–5', chapters:[
    'First-order ODEs — separable, linear, exact',
    'Second-order linear ODEs — homogeneous',
    'Second-order linear ODEs — non-homogeneous',
    'Systems of ODEs',
    'Laplace transforms',
    'Fourier series',
    'Partial differential equations — separation of variables',
    'Boundary value problems',
  ]},
  { subject:'Geometric Algebra', ref:'Macdonald', months:'5–7', chapters:[
    'The geometric product',
    'Bivectors and the outer product',
    'Rotors and rotations in 2D',
    'Rotors and rotations in 3D',
    'Multivectors',
    'Geometric calculus — vector derivative',
    'Spacetime algebra (STA)',
    'Applications to physics',
  ]},
  { subject:'Group Theory', ref:'Self-study + Artin', months:'6–8', chapters:[
    'Groups — definitions, examples, subgroups',
    'Cosets and Lagrange\'s theorem',
    'Normal subgroups and quotient groups',
    'Group homomorphisms and isomorphisms',
    'Cyclic groups and permutation groups',
    'Representation theory — basics',
    'Lie groups — introduction',
    'Symmetry in physics applications',
  ]},
  { subject:'Quantum Mechanics I', ref:'Griffiths', months:'9–10', chapters:[
    'Ch 1 — The Wave Function',
    'Ch 2 — Time-Independent Schrödinger Equation',
    'Ch 3 — Formalism',
    'Ch 4 — Quantum Mechanics in Three Dimensions',
    'Ch 5 — Identical Particles',
  ]},
  { subject:'Quantum Mechanics II', ref:'Griffiths', months:'10–12', chapters:[
    'Ch 6 — Time-Independent Perturbation Theory',
    'Ch 7 — The Variational Principle',
    'Ch 8 — The WKB Approximation',
    'Ch 9 — Time-Dependent Perturbation Theory',
    'Ch 10 — The Adiabatic Approximation',
    'Ch 11 — Scattering',
  ]},
  { subject:'General Relativity', ref:'Carroll', months:'12–14', chapters:[
    'Ch 1 — Special Relativity and Flat Spacetime',
    'Ch 2 — Manifolds',
    'Ch 3 — Curvature',
    'Ch 4 — Gravitation',
    'Ch 5 — The Schwarzschild Solution',
    'Ch 6 — More General Black Holes',
    'Ch 7 — Perturbation Theory and Gravitational Radiation',
    'Ch 8 — Cosmology',
  ]},
  { subject:'Differential Geometry + Topology', ref:'Self-study', months:'14–16', chapters:[
    'Topological spaces — open sets, continuity',
    'Metric spaces and convergence',
    'Compactness and connectedness',
    'Homotopy and the fundamental group',
    'Smooth manifolds',
    'Tangent spaces and vector fields',
    'Differential forms',
    'Integration on manifolds — Stokes\' theorem',
  ]},
];

function getMathDone() {
  try {
    const saved = JSON.parse(localStorage.getItem('math_done'));
    if (!saved) return {};
    return saved;
  } catch { return {}; }
}
function setMathDone(obj) { localStorage.setItem('math_done', JSON.stringify(obj)); }

// ── IELTS MOCK SCORE LOG ───────────────────────────────────────
// From instructions.md Part 13 item 1
function getMockScores() {
  try { return JSON.parse(localStorage.getItem('mock_scores')) || []; } catch { return []; }
}
function addMockScore(entry) {
  // entry = { date, week, listening, reading, writing, speaking, overall }
  const scores = getMockScores();
  scores.push(entry);
  localStorage.setItem('mock_scores', JSON.stringify(scores));
}
function deleteMockScore(idx) {
  const scores = getMockScores();
  scores.splice(idx, 1);
  localStorage.setItem('mock_scores', JSON.stringify(scores));
}

// ── DAILY HABIT TRACKER ────────────────────────────────────────
// From instructions.md Part 13 item 2
const HABIT_KEYS = ['ielts', 'math', 'thesis', 'courses', 'exercise'];
const HABIT_LABELS = { ielts:'IELTS Study', math:'Math/Physics', thesis:'Thesis Writing', courses:'Courses', exercise:'Physical Activity' };

function getHabits(dateStr) {
  // dateStr = YYYY-MM-DD
  try { return JSON.parse(localStorage.getItem('habit_' + dateStr)) || {}; } catch { return {}; }
}
function setHabits(dateStr, obj) { localStorage.setItem('habit_' + dateStr, JSON.stringify(obj)); }
function toggleHabit(dateStr, key) {
  const h = getHabits(dateStr);
  h[key] = !h[key];
  setHabits(dateStr, h);
  return h;
}
// Get habit data for last N days (for heatmap)
function getHabitHistory(days) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    const h  = getHabits(ds);
    const count = HABIT_KEYS.filter(k => h[k]).length;
    result.push({ date: ds, habits: h, count, pct: Math.round(count / HABIT_KEYS.length * 100) });
  }
  return result;
}

// ── INCOME LOG ─────────────────────────────────────────────────
// From instructions.md Part 13 item 4
function getIncomeLog() {
  try { return JSON.parse(localStorage.getItem('income_log')) || []; } catch { return []; }
}
function addIncomeEntry(entry) {
  // entry = { month: 'Jun 2026', income_bdt, savings_bdt, notes }
  const log = getIncomeLog();
  log.unshift(entry);
  localStorage.setItem('income_log', JSON.stringify(log.slice(0, 36)));
}

// ── OU APPLICATION CHECKLIST ───────────────────────────────────
// From instructions.md Part 13 item 10
const OU_CHECKLIST = [
  { id:'ielts_cert',     label:'IELTS Certificate (Band 7.0+)',              cat:'Documents' },
  { id:'transcripts',    label:'Official BUET transcripts',                  cat:'Documents' },
  { id:'degree_cert',    label:'Degree certificate (attested)',               cat:'Documents' },
  { id:'personal_stmt',  label:'Personal Statement written and reviewed',     cat:'Application' },
  { id:'references',     label:'Two academic/professional references secured', cat:'Application' },
  { id:'ref1_sent',      label:'Reference 1 — submitted to OU',              cat:'Application' },
  { id:'ref2_sent',      label:'Reference 2 — submitted to OU',              cat:'Application' },
  { id:'app_form',       label:'OU online application form completed',        cat:'Application' },
  { id:'app_fee',        label:'Application fee paid',                        cat:'Application' },
  { id:'portfolio',      label:'Engineering portfolio / CV attached',          cat:'Application' },
  { id:'savings_ready',  label:'10,000 EUR savings confirmed and accessible',  cat:'Financial' },
  { id:'bank_statement', label:'Bank statement showing 10k EUR equivalent',    cat:'Financial' },
  { id:'visa_check',     label:'Confirmed study visa requirements (if needed)', cat:'Admin' },
  { id:'accommodation',  label:'Accommodation plan confirmed',                 cat:'Admin' },
  { id:'submitted',      label:'★ APPLICATION SUBMITTED',                     cat:'Final' },
];

function getOUDone() {
  try { return JSON.parse(localStorage.getItem('ou_done')) || {}; } catch { return {}; }
}
function setOUDone(obj) { localStorage.setItem('ou_done', JSON.stringify(obj)); }
function toggleOUItem(id) {
  const d = getOUDone(); d[id] = !d[id]; setOUDone(d);
}

// ── SAVINGS LOG ────────────────────────────────────────────────
function getSavingsLog() {
  try { return JSON.parse(localStorage.getItem('savings_log')) || []; } catch { return []; }
}
function addSavingsEntry(bdt, prev) {
  const log  = getSavingsLog();
  const eur  = Math.round(bdt / 130);
  const diff = bdt - (prev || 0);
  log.unshift({ date: today().toLocaleDateString('en-GB'), bdt, eur, diff, ts: Date.now() });
  localStorage.setItem('savings_log', JSON.stringify(log.slice(0, 50)));
}

// ── WEEKLY REVIEW LOG ──────────────────────────────────────────
// From instructions.md Part 13 item 3
function getWeeklyReviews() {
  try { return JSON.parse(localStorage.getItem('weekly_reviews')) || []; } catch { return []; }
}
function saveWeeklyReview(review) {
  // review = { week, date, done, missed, plan, savings_update, notes }
  const reviews = getWeeklyReviews();
  reviews.unshift(review);
  localStorage.setItem('weekly_reviews', JSON.stringify(reviews.slice(0, 52)));
}

// ── COURSES ────────────────────────────────────────────────────
const PHASES = [
  { id:'edx', label:'Platform 0 — edX', num:'NOW', headCls:'ph-edx',
    statCls:'phs-urgent', statLabel:'⚠️ Expires Jun 26', when:'May–Jun 2026',
    alertCls:'danger', alertTxt:'<strong>Hard deadline.</strong> Both expire Jun 26 2026. Open one today alongside IELTS.',
    groups:[
      { name:'AI — IBM (expiring ⚠️)', month:'NOW', courses:[
        { n:'Agentic AI: Developing AI Agents', plat:'edX', pc:'edx', prog:'0%', pri:true  },
        { n:'AI for Everyone',                  plat:'edX', pc:'edx', prog:'0%', pri:true  },
      ]},
    ]},
  { id:'li', label:'Platform 1 — LinkedIn Learning', num:'PH 1', headCls:'ph-li',
    statCls:'phs-active', statLabel:'Active · After edX', when:'Jun 2026',
    alertCls:'info', alertTxt:'<strong>~2.5 hrs total remaining.</strong> Finish in 1–2 evenings. Do before renewing Coursera.',
    groups:[
      { name:'Engineering / BIM', month:'Jun 2026', courses:[
        { n:'BIM Foundations',            plat:'LinkedIn', pc:'li', prog:'1h 16m left', pri:true },
        { n:'Revit: Twinmotion Workflow', plat:'LinkedIn', pc:'li', prog:'1h 20m left', pri:true },
      ]},
    ]},
  { id:'coursera', label:'Platform 2 — Coursera', num:'PH 2', headCls:'ph-coursera',
    statCls:'phs-paused', statLabel:'Renew Aug 2026', when:'Aug 2026 – Apr 2027',
    alertCls:'neutral', alertTxt:'<strong>License paused.</strong> Renew after IELTS. 8–9 months, 2–3 hr/day.',
    groups:[
      { name:'Engineering / BIM', month:'Aug–Sep 2026', courses:[
        { n:'BIM Application for Engineers — NTU',   plat:'Coursera', pc:'coursera', prog:'14%', pri:true },
        { n:'BIM Fundamentals for Engineers (L&T)',   plat:'Coursera', pc:'coursera', prog:'0%'  },
        { n:'BIM Coordination (L&T)',                 plat:'Coursera', pc:'coursera', prog:'0%'  },
        { n:'Field BIM (L&T)',                        plat:'Coursera', pc:'coursera', prog:'0%'  },
      ]},
      { name:'Structural — Georgia Tech (6)', month:'Sep–Oct 2026', courses:[
        { n:'Introduction to Engineering Mechanics',                  plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Applications in Engineering Mechanics',                  plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Mechanics of Materials I: Stress & Strain',              plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Mechanics of Materials II: Pressure Vessels & Torsion',  plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Mechanics of Materials III: Beam Bending',               plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Mechanics of Materials IV: Deflections & Buckling',      plat:'Coursera', pc:'coursera', prog:'0%' },
      ]},
      { name:'Structural — Dartmouth (4)', month:'Oct–Nov 2026', courses:[
        { n:'Engineering of Structures: Compression',          plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Engineering of Structures: Tension & Compression',plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Engineering of Structures: Shear & Bending',     plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Engineering of Structures: Response of Structures',plat:'Coursera', pc:'coursera', prog:'0%' },
      ]},
      { name:'Structural — L&T RCC + Steel (6)', month:'Nov–Dec 2026', courses:[
        { n:'Design Basics of RCC Buildings',                     plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Structural Scheme Setting & ETABS Analysis of RCC',  plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Design & Detailing of RCC Elements',                 plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Design Basics of Steel Buildings',                   plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Modelling, Analysis & Design of Steel Buildings',    plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Construction Aspects of Steel Buildings',            plat:'Coursera', pc:'coursera', prog:'0%' },
      ]},
      { name:'Seismic', month:'Dec 2026', courses:[
        { n:'Seismology to Earthquake Engineering — École Polytechnique', plat:'Coursera', pc:'coursera', prog:'11%' },
      ]},
      { name:'Geotechnical + Construction (6)', month:'Jan 2027', courses:[
        { n:'Introduction to Pile Foundation (L&T)',            plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Precast & Advanced Pile Foundation (L&T)',         plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Grouping, Testing & QC of Pile Foundations (L&T)',plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Formwork Systems (L&T)',                           plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Design of Formwork System (L&T)',                  plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Construction Aspects of Formwork (L&T)',           plat:'Coursera', pc:'coursera', prog:'0%' },
      ]},
      { name:'Math — HKUST (5)', month:'Feb–Mar 2027', courses:[
        { n:'Matrix Algebra for Engineers',        plat:'Coursera', pc:'coursera', prog:'0%', pri:true },
        { n:'Differential Equations for Engineers',plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Vector Calculus for Engineers',       plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Numerical Methods for Engineers',     plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Mathematics for Engineers: Capstone', plat:'Coursera', pc:'coursera', prog:'0%' },
      ]},
      { name:'Computational + AI Math + Research', month:'Mar 2027', courses:[
        { n:'The Finite Element Method for Problems in Physics — U Michigan', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Foundational Mathematics for AI — Johns Hopkins',               plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Understanding Research Methods — U London & SOAS',              plat:'Coursera', pc:'coursera', prog:'8%' },
      ]},
      { name:'Sustainability + GIS (7)', month:'Mar–Apr 2027', courses:[
        { n:'Comfort in Buildings (L&T)',                    plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Resource & Waste Management in Buildings (L&T)',plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Green Building Assessment & Certification (L&T)',plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Net-Zero Building Fundamentals — IIHS',         plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Fundamentals of GIS — UC Davis',                plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'GIS Data Formats, Design & Quality — UC Davis', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'GIS Applications Across Industries — UC Davis', plat:'Coursera', pc:'coursera', prog:'0%' },
      ]},
      { name:'Enrichment (drop if behind)', month:'Apr 2027', courses:[
        { n:'Making Architecture — IE Business School', plat:'Coursera', pc:'coursera', prog:'0%' },
      ]},
    ]},
  { id:'udemy', label:'Platform 3 — Udemy', num:'PH 3', headCls:'ph-udemy',
    statCls:'phs-later', statLabel:'Apr 2027+', when:'Apr–Jun 2027',
    alertCls:'ok', alertTxt:'<strong>No expiry. No subscription cost.</strong> 3 already done ✅. Drop Cyber Security + Unreal Engine.',
    groups:[
      { name:'Completed ✅', month:'Done', courses:[
        { n:'BIM Fundamentals: The Complete Practical Guide to BIM',          plat:'Udemy', pc:'udemy', prog:'100%', fixed:true },
        { n:'Autodesk Revit — Beginner to Advanced Level',                    plat:'Udemy', pc:'udemy', prog:'100%', fixed:true },
        { n:'The Comprehensive ETABS Professional Course (RCC & Steel)',       plat:'Udemy', pc:'udemy', prog:'100%', fixed:true },
      ]},
      { name:'Pending — in priority order', month:'Apr–Jun 2027', courses:[
        { n:'Perform Better Geotechnical Numerical Analysis',              plat:'Udemy', pc:'udemy', prog:'0%',  pri:true },
        { n:'The Complete Python Bootcamp From Zero to Hero',              plat:'Udemy', pc:'udemy', prog:'3%'  },
        { n:'MATLAB/SIMULINK Bible — Go From Zero to Hero',               plat:'Udemy', pc:'udemy', prog:'0%'  },
        { n:'AI A-Z [2026]: Agentic AI, Gen AI, Prompt Eng & RL',         plat:'Udemy', pc:'udemy', prog:'1%'  },
        { n:'Ultimate Microsoft Office: Excel, Word, PowerPoint & Access', plat:'Udemy', pc:'udemy', prog:'7%'  },
        { n:'The Complete Cyber Security Course',                          plat:'Udemy', pc:'udemy', prog:'0%',  drop:true },
        { n:'Unreal Engine 5 C++ Game Development',                       plat:'Udemy', pc:'udemy', prog:'0%',  drop:true },
      ]},
    ]},
];

// Flat course array — memoised per session (PHASES never mutates at runtime)
let _flatCache = null;
function flatCourses() {
  if (_flatCache) return _flatCache;
  _flatCache = [];
  PHASES.forEach(p => p.groups.forEach(g => g.courses.forEach(c => _flatCache.push(c))));
  return _flatCache;
}

function getCDone() {
  try {
    const saved = JSON.parse(localStorage.getItem('c_done'));
    const flat  = flatCourses();
    if (!saved || saved.length !== flat.length) return flat.map(c => !!c.fixed);
    return saved;
  } catch { return flatCourses().map(c => !!c.fixed); }
}
function setCDone(arr) { localStorage.setItem('c_done', JSON.stringify(arr)); }

// ── SCHEDULE BUILDER ───────────────────────────────────────────
function buildSchedule(order, preIelts, tier) {
  const base = [
    { t:'06:00–06:30', n:'Wake + Morning Basics',  d:'Bathroom, freshen up, water, light stretching',     tag:'rest',  cls:'row-rest' },
    { t:'06:30–07:00', n:'Breakfast',              d:'Proper fuel — do not skip. Supports morning focus.', tag:'rest',  cls:'row-rest' },
  ];

  // PRE-IELTS, ORDER DAY
  if (preIelts && order) {
    const slots = {
      1:[
        {t:'07:00–08:00',n:'🎯 IELTS Daily Block (1 hr)',d:'Listening + reading section. Timed. No distractions.',tag:'ielts',cls:'row-ielts'},
        {t:'08:00–08:30',n:'📐 Math/Physics (30 min)',d:'Daily touch — Classical Mechanics or Linear Algebra',tag:'math',cls:'row-math'},
        {t:'08:30–12:30',n:'Work Block A',d:'ETABS / Revit / SAFE / PLAXIS / BIM — deep focus',tag:'work',cls:'row-work'},
        {t:'12:30–13:15',n:'Lunch + Rest',d:'Proper meal. Short rest or prayer.',tag:'rest',cls:'row-rest'},
        {t:'13:15–17:15',n:'Work Block B',d:'Structural/BIM — documentation, client comms',tag:'work',cls:'row-work'},
        {t:'17:15–17:45',n:'Break + Snack + Walk',d:'Hydrate. Move. Decompress before evening study.',tag:'rest',cls:'row-rest'},
        {t:'17:45–19:15',n:'Active Course (1.5 hr)',d:'edX → LinkedIn → Coursera → Udemy in platform order',tag:'study',cls:'row-study'},
        {t:'19:15–20:00',n:'Dinner',d:'Proper meal. Family time.',tag:'rest',cls:'row-rest'},
        {t:'20:00–20:30',n:'🎯 IELTS Review (30 min)',d:'Review errors from morning. Vocabulary flashcards.',tag:'ielts',cls:'row-ielts'},
        {t:'20:30–21:00',n:'Literature / Culture',d:'30 min — reading, linguistics. No targets. Pure enjoyment.',tag:'life',cls:'row-life'},
        {t:'21:00–21:30',n:'Plan + Savings Log + Admin',d:'Tomorrow tasks. Savings update. Upwork messages.',tag:'rest',cls:'row-rest'},
        {t:'21:30–22:00',n:'Wind-down',d:'Low light. No harsh screens. Prepare for sleep.',tag:'life',cls:'row-life'},
        {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Non-negotiable. Foundation of everything.',tag:'rest',cls:'row-rest'},
      ],
      2:[
        {t:'07:00–08:30',n:'🎯 IELTS Block (1.5 hr)',d:'Two sections or 1 section + writing task. Fully timed.',tag:'ielts',cls:'row-ielts'},
        {t:'08:30–09:00',n:'📐 Math/Physics (30 min)',d:'Daily foundation — never skip.',tag:'math',cls:'row-math'},
        {t:'09:00–12:30',n:'Work Block A',d:'ETABS / Revit / PLAXIS / BIM',tag:'work',cls:'row-work'},
        {t:'12:30–13:15',n:'Lunch + Rest',d:'Proper meal.',tag:'rest',cls:'row-rest'},
        {t:'13:15–17:15',n:'Work Block B',d:'Structural/BIM — documentation, client comms',tag:'work',cls:'row-work'},
        {t:'17:15–17:35',n:'Break',d:'Short physical reset.',tag:'rest',cls:'row-rest'},
        {t:'17:35–19:35',n:'Active Course (2 hr)',d:'Current platform course — full pace.',tag:'study',cls:'row-study'},
        {t:'19:35–20:15',n:'Dinner',d:'Proper meal.',tag:'rest',cls:'row-rest'},
        {t:'20:15–20:35',n:'Recreation (20 min)',d:'Brief culture read or linguistics.',tag:'life',cls:'row-life'},
        {t:'20:35–21:05',n:'Plan + Admin',d:'Tasks, savings log, messages — all batched.',tag:'rest',cls:'row-rest'},
        {t:'21:05–22:00',n:'Wind-down',d:'Low light. Light read. Prep for sleep.',tag:'life',cls:'row-life'},
        {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Non-negotiable.',tag:'rest',cls:'row-rest'},
      ],
      3:[
        {t:'07:00–08:30',n:'🎯 IELTS Block (1.5 hr)',d:'Two sections + writing. Fully timed.',tag:'ielts',cls:'row-ielts'},
        {t:'08:30–09:00',n:'📐 Math/Physics (30 min)',d:'Daily foundation touch.',tag:'math',cls:'row-math'},
        {t:'09:00–12:30',n:'Work Block A',d:'ETABS / Revit / PLAXIS / BIM',tag:'work',cls:'row-work'},
        {t:'12:30–13:10',n:'Lunch + Rest',d:'Proper meal.',tag:'rest',cls:'row-rest'},
        {t:'13:10–17:15',n:'Work Block B',d:'Structural/BIM — deliverables',tag:'work',cls:'row-work'},
        {t:'17:15–17:30',n:'Break',d:'Short reset.',tag:'rest',cls:'row-rest'},
        {t:'17:30–20:00',n:'Active Course (2.5 hr)',d:'Push hard — double-pace if needed.',tag:'study',cls:'row-study'},
        {t:'20:00–20:40',n:'Dinner',d:'Proper meal.',tag:'rest',cls:'row-rest'},
        {t:'20:40–21:00',n:'Recreation (20 min)',d:'Brief cultural read.',tag:'life',cls:'row-life'},
        {t:'21:00–22:00',n:'Plan + Admin + Wind-down',d:'Batched. Prep for sleep.',tag:'rest',cls:'row-rest'},
        {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Always protected.',tag:'rest',cls:'row-rest'},
      ],
      4:[
        {t:'07:00–08:30',n:'🎯 IELTS Block (1.5 hr)',d:'Full mock section + timed essay + error log.',tag:'ielts',cls:'row-ielts'},
        {t:'08:30–09:00',n:'📐 Math/Physics (30 min)',d:'Daily touch — non-negotiable.',tag:'math',cls:'row-math'},
        {t:'09:00–12:30',n:'Work Block A',d:'High-value delivery only. No low-priority tasks.',tag:'work',cls:'row-work'},
        {t:'12:30–13:00',n:'Lunch + Rest',d:'Proper meal.',tag:'rest',cls:'row-rest'},
        {t:'13:00–17:15',n:'Work Block B',d:'Structural/BIM — client deliverables',tag:'work',cls:'row-work'},
        {t:'17:15–17:30',n:'Break',d:'Short reset.',tag:'rest',cls:'row-rest'},
        {t:'17:30–20:30',n:'Active Course (3 hr)',d:'Maximum daily course push.',tag:'study',cls:'row-study'},
        {t:'20:30–21:05',n:'Dinner',d:'Proper meal.',tag:'rest',cls:'row-rest'},
        {t:'21:05–21:20',n:'Recreation (15 min)',d:'Brief read.',tag:'life',cls:'row-life'},
        {t:'21:20–22:00',n:'Plan + Admin + Wind-down',d:'Batched tight.',tag:'rest',cls:'row-rest'},
        {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Absolute non-negotiable.',tag:'rest',cls:'row-rest'},
      ],
    };
    return [...base, ...slots[tier.id]];
  }

  // PRE-IELTS, FREE DAY
  if (preIelts && !order) {
    return [...base,
      {t:'07:00–09:30',n:'🎯 IELTS Full Block (2.5 hr)',d:'Complete 4-band timed test OR 2 sections + writing + full review.',tag:'ielts',cls:'row-ielts'},
      {t:'09:30–11:30',n:'📐 Math/Physics Deep (2 hr)',d:'Classical Mechanics, Linear Algebra, or Geometric Algebra.',tag:'math',cls:'row-math'},
      {t:'11:30–13:00',n:'Courses — Morning Push (1.5 hr)',d:'Current active course at full pace.',tag:'study',cls:'row-study'},
      {t:'13:00–13:45',n:'Lunch + Rest',d:'Proper meal. Short rest.',tag:'rest',cls:'row-rest'},
      {t:'13:45–15:45',n:'Thesis Writing Block (2 hr)',d:'One paper. Write, edit, or literature review. No interruptions.',tag:'thesis',cls:'row-thesis'},
      {t:'15:45–16:15',n:'Break + Walk',d:'Physical movement essential.',tag:'rest',cls:'row-rest'},
      {t:'16:15–18:15',n:'Courses — Afternoon (2 hr)',d:'Second course block — full pace.',tag:'study',cls:'row-study'},
      {t:'18:15–18:45',n:'🎯 IELTS Review (30 min)',d:'Review errors. Weak-area drill. Vocab flashcards.',tag:'ielts',cls:'row-ielts'},
      {t:'18:45–19:30',n:'Dinner',d:'Proper meal.',tag:'rest',cls:'row-rest'},
      {t:'19:30–20:00',n:'Literature / Linguistics (30 min)',d:'Reading or language study. Pure enjoyment.',tag:'life',cls:'row-life'},
      {t:'20:00–21:00',n:'Weekly Review + Plan + Savings',d:'Full assessment. Block plan. Savings log.',tag:'rest',cls:'row-rest'},
      {t:'21:00–22:00',n:'Admin + Wind-down',d:'Upwork, email, banking. Then low-light read.',tag:'life',cls:'row-life'},
      {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Non-negotiable.',tag:'rest',cls:'row-rest'},
    ];
  }

  // POST-IELTS, ORDER DAY
  if (!preIelts && order) {
    const slots = {
      1:[
        {t:'07:00–07:45',n:'📐 Math/Physics (45 min)',d:'Morning slot: GR, QM, Geometric Algebra — daily chapter.',tag:'math',cls:'row-math'},
        {t:'07:45–08:30',n:'Courses — AM Warmup (45 min)',d:'Morning course session before work.',tag:'study',cls:'row-study'},
        {t:'08:30–12:30',n:'Work Block A',d:'ETABS / Revit / SAFE / PLAXIS / BIM.',tag:'work',cls:'row-work'},
        {t:'12:30–13:15',n:'Lunch + Rest',d:'Proper meal.',tag:'rest',cls:'row-rest'},
        {t:'13:15–17:15',n:'Work Block B',d:'Structural/BIM — documentation, client comms.',tag:'work',cls:'row-work'},
        {t:'17:15–17:45',n:'Break + Snack',d:'Hydrate. Walk.',tag:'rest',cls:'row-rest'},
        {t:'17:45–19:15',n:'Courses — PM Block (1.5 hr)',d:'Main course session — current platform.',tag:'study',cls:'row-study'},
        {t:'19:15–20:00',n:'Dinner',d:'Proper meal.',tag:'rest',cls:'row-rest'},
        {t:'20:00–20:35',n:'Thesis / English Review',d:'Thesis writing OR English practice to maintain IELTS level.',tag:'thesis',cls:'row-thesis'},
        {t:'20:35–21:05',n:'Literature / Culture (30 min)',d:'Reading, linguistics, enjoyment.',tag:'life',cls:'row-life'},
        {t:'21:05–22:00',n:'Plan + Admin + Wind-down',d:'Batched — tasks, savings, messages, wind-down.',tag:'rest',cls:'row-rest'},
        {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Non-negotiable.',tag:'rest',cls:'row-rest'},
      ],
      2:[
        {t:'07:00–08:00',n:'📐 Math/Physics (1 hr)',d:'GR, QM, or Geometric Algebra — deeper session.',tag:'math',cls:'row-math'},
        {t:'08:00–09:00',n:'Courses — AM Block (1 hr)',d:'Morning course push before work.',tag:'study',cls:'row-study'},
        {t:'09:00–12:30',n:'Work Block A',d:'ETABS / Revit / PLAXIS / BIM.',tag:'work',cls:'row-work'},
        {t:'12:30–13:15',n:'Lunch + Rest',d:'Proper meal.',tag:'rest',cls:'row-rest'},
        {t:'13:15–17:15',n:'Work Block B',d:'Structural/BIM — deliverables.',tag:'work',cls:'row-work'},
        {t:'17:15–17:35',n:'Break',d:'Short physical reset.',tag:'rest',cls:'row-rest'},
        {t:'17:35–19:35',n:'Courses — PM Block (2 hr)',d:'Main course push.',tag:'study',cls:'row-study'},
        {t:'19:35–20:15',n:'Dinner',d:'Proper meal.',tag:'rest',cls:'row-rest'},
        {t:'20:15–20:50',n:'Thesis (35 min)',d:'Daily thesis — even a few paragraphs counts.',tag:'thesis',cls:'row-thesis'},
        {t:'20:50–21:10',n:'Recreation (20 min)',d:'Brief cultural read.',tag:'life',cls:'row-life'},
        {t:'21:10–22:00',n:'Plan + Admin + Wind-down',d:'Batched then wind-down.',tag:'rest',cls:'row-rest'},
        {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Non-negotiable.',tag:'rest',cls:'row-rest'},
      ],
      3:[
        {t:'07:00–08:00',n:'📐 Math/Physics (1 hr)',d:'Deep daily session — GR derivations, QM formalism.',tag:'math',cls:'row-math'},
        {t:'08:00–09:30',n:'Courses — AM Block (1.5 hr)',d:'Morning course push.',tag:'study',cls:'row-study'},
        {t:'09:30–12:30',n:'Work Block A',d:'ETABS / Revit / PLAXIS / BIM.',tag:'work',cls:'row-work'},
        {t:'12:30–13:10',n:'Lunch + Rest',d:'Proper meal.',tag:'rest',cls:'row-rest'},
        {t:'13:10–17:15',n:'Work Block B',d:'Structural/BIM — deliverables.',tag:'work',cls:'row-work'},
        {t:'17:15–17:30',n:'Break',d:'Short reset.',tag:'rest',cls:'row-rest'},
        {t:'17:30–20:00',n:'Courses — PM Block (2.5 hr)',d:'Double-pace course push.',tag:'study',cls:'row-study'},
        {t:'20:00–20:40',n:'Dinner',d:'Proper meal.',tag:'rest',cls:'row-rest'},
        {t:'20:40–21:10',n:'Thesis (30 min)',d:'Daily writing — consistency beats intensity.',tag:'thesis',cls:'row-thesis'},
        {t:'21:10–22:00',n:'Plan + Admin + Wind-down',d:'Batched.',tag:'rest',cls:'row-rest'},
        {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Always protected.',tag:'rest',cls:'row-rest'},
      ],
      4:[
        {t:'07:00–08:30',n:'📐 Math/Physics (1.5 hr)',d:'Heaviest material first — hardest daily slot.',tag:'math',cls:'row-math'},
        {t:'08:30–10:00',n:'Courses — AM Block (1.5 hr)',d:'Pre-work course sprint.',tag:'study',cls:'row-study'},
        {t:'10:00–12:30',n:'Work Block A',d:'High-value work only.',tag:'work',cls:'row-work'},
        {t:'12:30–13:00',n:'Lunch + Rest',d:'Proper meal.',tag:'rest',cls:'row-rest'},
        {t:'13:00–17:15',n:'Work Block B',d:'Structural/BIM deliverables.',tag:'work',cls:'row-work'},
        {t:'17:15–17:30',n:'Break',d:'Short reset.',tag:'rest',cls:'row-rest'},
        {t:'17:30–20:30',n:'Courses — PM Block (3 hr)',d:'Maximum daily course push.',tag:'study',cls:'row-study'},
        {t:'20:30–21:00',n:'Dinner',d:'Proper meal.',tag:'rest',cls:'row-rest'},
        {t:'21:00–21:15',n:'Recreation (15 min)',d:'Brief read.',tag:'life',cls:'row-life'},
        {t:'21:15–22:00',n:'Plan + Admin + Wind-down',d:'Batched tight.',tag:'rest',cls:'row-rest'},
        {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Absolute non-negotiable.',tag:'rest',cls:'row-rest'},
      ],
    };
    return [...base, ...slots[tier.id]];
  }

  // POST-IELTS, FREE DAY
  return [...base,
    {t:'07:00–09:30',n:'📐 Math/Physics Deep (2.5 hr)',d:'Hardest material: QM proofs, GR derivations, Geometric Algebra.',tag:'math',cls:'row-math'},
    {t:'09:30–11:30',n:'Courses — Morning Push (2 hr)',d:'Full pace — ride the morning focus window.',tag:'study',cls:'row-study'},
    {t:'11:30–13:00',n:'Courses — Continued (1.5 hr)',d:'Second block or double-pace single course.',tag:'study',cls:'row-study'},
    {t:'13:00–13:45',n:'Lunch + Rest',d:'Proper meal. Short rest.',tag:'rest',cls:'row-rest'},
    {t:'13:45–16:15',n:'Thesis Writing Block (2.5 hr)',d:'Serious session — one paper, uninterrupted.',tag:'thesis',cls:'row-thesis'},
    {t:'16:15–16:45',n:'Break + Walk',d:'Physical movement essential.',tag:'rest',cls:'row-rest'},
    {t:'16:45–19:15',n:'Courses — Afternoon (2.5 hr)',d:'Third course block — clear the queue.',tag:'study',cls:'row-study'},
    {t:'19:15–20:00',n:'Dinner',d:'Proper meal.',tag:'rest',cls:'row-rest'},
    {t:'20:00–20:30',n:'Literature / Culture (30 min)',d:'Reading, linguistics, pure enjoyment.',tag:'life',cls:'row-life'},
    {t:'20:30–21:00',n:'Weekly Review + Plan + Savings',d:'Full assessment. Block plan. Savings log.',tag:'rest',cls:'row-rest'},
    {t:'21:00–22:00',n:'Admin + Wind-down',d:'Upwork, email, banking. Low-light read.',tag:'life',cls:'row-life'},
    {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Non-negotiable.',tag:'rest',cls:'row-rest'},
  ];
}

// ── SHARED UI BUILDERS ─────────────────────────────────────────
function buildNavHTML(activePage) {
  const pages = [
    { href:'index.html',      label:'Dashboard' },
    { href:'daily.html',      label:'Daily' },
    { href:'courses.html',    label:'Courses' },
    { href:'milestones.html', label:'Milestones' },
    { href:'savings.html',    label:'Savings' },
    { href:'roadmap.html',    label:'Roadmap' },
    { href:'habits.html',     label:'Habits' },
    { href:'review.html',     label:'Review' },
  ];
  const edxDays = daysUntil(EDX_DATE);
  const pm = planMonth();
  const links = pages.map(p =>
    `<a class="nav-link${p.href === activePage ? ' active' : ''}" href="${p.href}">${p.label}</a>`
  ).join('');
  return `
<div class="alert-bar${edxDays <= 0 ? ' warn' : ' danger'}" id="alert-bar">
  <span><span class="ab-dot"></span>${edxDays > 0 ? `edX expires in <strong id="edx-days">${edxDays}</strong> days · Jun 26 2026` : '🚨 edX courses have EXPIRED — check for extension'}</span>
  <span>★ Book IELTS July 2026 slot — do it today</span>
</div>
<nav class="nav">
  <div class="nav-brand">
    <div class="nav-logo">S</div>
    <div class="nav-title">SPRINT<span>OS</span></div>
  </div>
  <div class="nav-links" id="nav-links">${links}</div>
  <div class="nav-right">
    <span class="nav-badge red" id="nb-edx">${edxDays}d edX</span>
    <span class="nav-badge amber">M${pm}/18</span>
    <span class="nav-badge green">${Math.round(S.pct())}% saved</span>
    <span id="nav-date">${today().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
  </div>
  <div class="nav-hamburger" id="hamburger" onclick="toggleMobileNav()">
    <span></span><span></span><span></span>
  </div>
</nav>`;
}

function buildFooterHTML() {
  return `
<footer class="site-footer">
  <span><span class="footer-brand">SPRINT OS</span> · Anway's 18-Month OU MPhys Plan</span>
  <span>Target: OU Application by Nov 2027 · <a href="instructions.md" style="color:var(--green)">Docs</a> · Built May 2026</span>
</footer>`;
}

function buildTimelineHTML() {
  const pm = planMonth();
  const items = [...Array(18)].map((_,i) => {
    const m = i + 1;
    const d = new Date(START_DATE.getFullYear(), START_DATE.getMonth() + m - 1, 1);
    const state = m < pm ? 'done' : m === pm ? 'current' : 'future';
    const nodeContent = m < pm ? '✓' : m === pm ? '●' : m;
    return `<div class="tl-item ${state}">
      <div class="tl-line"></div>
      <div class="tl-node">${nodeContent}</div>
      <div class="tl-mlabel">M${m}<br>${d.toLocaleDateString('en-GB',{month:'short'})}</div>
      ${TL_EVENTS[m] ? `<div class="tl-event">${TL_EVENTS[m]}</div>` : ''}
    </div>`;
  }).join('');
  return `<div class="timeline-scroll"><div class="timeline">${items}</div></div>`;
}

function toggleMobileNav() {
  document.getElementById('nav-links')?.classList.toggle('mobile-open');
}
