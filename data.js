/* ═══════════════════════════════════════════════════════════
   SPRINT OS — Shared Data & Utilities
   All milestones, courses, tiers, schedule logic in one place.
═══════════════════════════════════════════════════════════ */

// ── DATES ──────────────────────────────────────────────────
const D = {
  start:  new Date('2026-05-29'),
  edx:    new Date('2026-06-26'),
  ielts:  new Date('2026-07-31'),
  ouApp:  new Date('2027-11-01'),
  today:  new Date(),
};

function daysUntil(d) { return Math.max(0, Math.ceil((d - D.today) / 864e5)); }
function planMonth()  { return Math.max(1, Math.min(18, Math.ceil((D.today - D.start) / 864e5 / 30.44))); }

// ── SAVINGS STATE ──────────────────────────────────────────
const S = {
  bdt:     parseInt(localStorage.getItem('s_bdt'))     || 50000,
  monthly: parseInt(localStorage.getItem('s_monthly')) || 20000,
  save() {
    localStorage.setItem('s_bdt',     this.bdt);
    localStorage.setItem('s_monthly', this.monthly);
  },
  eur()    { return this.bdt / 130; },
  pct()    { return Math.min(100, this.eur() / 10000 * 100); },
  remEur() { return Math.max(0, 10000 - this.eur()); },
  months() {
    const moEur = this.monthly / 130;
    return moEur > 0 ? Math.ceil(this.remEur() / moEur) : 999;
  },
};

// ── PACE TIERS ─────────────────────────────────────────────
const TIERS = [
  { id:1, name:'Minimum Viable Sprint', icon:'🏃', col:'#ff7722', range:'< 30,000 BDT/mo', min:0, fillPct:25,
    desc:'Baseline sprint. IELTS 1 hr/day. Courses 1.5 hr/day. Math 45 min/day.',
    bullets:['IELTS: 1 hr/day (order) | 2.5 hr (free)','Courses: 1.5 hr/day (order) | 3 hr (free)','Math: 45 min/day (order) | 2 hr (free)','Recreation: 30 min','Thesis: Sat + 1 weekday'],
    warn:'⚠️ Cannot hit 10k EUR in 1.5yr at < 30k/month. Grow income urgently.' },
  { id:2, name:'On-Track Pace', icon:'⚡', col:'#ffb020', range:'30,000–60,000 BDT/mo', min:30000, fillPct:55,
    desc:'Lower feasibility bound. Study matches completion target.',
    bullets:['IELTS: 1.5 hr/day (order) | 3 hr (free)','Courses: 2 hr/day (order) | 4 hr (free)','Math: 1 hr/day (order) | 2.5 hr (free)','Recreation: 20 min','Thesis: Sat + 2 weekdays'],
    warn:'⚠️ Still below 83k/month target. Push income.' },
  { id:3, name:'Accelerated', icon:'🚀', col:'#00e5a0', range:'60,000–90,000 BDT/mo', min:60000, fillPct:80,
    desc:'On savings curve. OU application in ~14 months possible.',
    bullets:['IELTS: 1.5 hr/day (order) | 3.5 hr (free)','Courses: 2.5 hr/day (order) | 4.5 hr (free)','Math: 1 hr/day (order) | 3 hr (free)','Recreation: 20 min','Thesis: Sat + 2 weekdays'],
    warn:'' },
  { id:4, name:'Full Throttle', icon:'🛸', col:'#4488ff', range:'> 90,000 BDT/mo', min:90000, fillPct:100,
    desc:'OU in 12–14 months. Maximum compression. Near-OU-student mode.',
    bullets:['IELTS: 1.5 hr/day (order) | 4 hr (free)','Courses: 3 hr/day (order) | 5 hr (free)','Math: 1.5 hr/day (order) | 3 hr (free)','Recreation: 15 min','Thesis: Sat + 3 weekdays'],
    warn:'' },
];
function getTier() { let t=TIERS[0]; for(const x of TIERS) if(S.monthly>=x.min) t=x; return t; }

// ── TIMELINE EVENTS ────────────────────────────────────────
const TL_EVENTS = {
  1:'IELTS Prep + edX', 2:'IELTS EXAM ★', 3:'Coursera BIM', 4:'Structural',
  5:'Structural', 6:'RCC + Steel', 7:'Geotechnical', 8:'HKUST Math',
  9:'HKUST Math', 10:'FEM + Research', 11:'GIS + Sustain.', 12:'Udemy',
  13:'All Done ✓', 14:'Math Done ✓', 15:'Savings Push', 16:'Thesis Sub.',
  17:'OU Docs', 18:'★ Apply OU',
};

// ── MILESTONES ─────────────────────────────────────────────
const MILESTONES = [
  { t:'Book IELTS — July 2026 slot', s:'Do this today. Book the slot, then prep to the date.', h:'TODAY', type:'today', pri:true },
  { t:'edX: Agentic AI + AI for Everyone (IBM)', s:'Both expire Jun 26 2026. Open one today alongside IELTS.', h:'Before Jun 26', type:'urgent' },
  { t:'LinkedIn Learning done', s:'BIM Foundations (1h 16m) + Revit Twinmotion (1h 20m). ~2.5 hrs.', h:'Jun 2026', type:'normal' },
  { t:'IELTS EXAM — Band 7.0', s:'July 2026. Sit regardless of mock scores. Unlocks OU + international clients.', h:'Jul 2026', type:'priority', pri:true },
  { t:'Coursera license renewed + BIM started', s:'Renew immediately after IELTS. Begin NTU BIM same day.', h:'Aug 2026', type:'normal' },
  { t:'Coursera Structural category cleared', s:'Georgia Tech (6) + Dartmouth (4) + L&T RCC (3) + L&T Steel (3).', h:'Oct–Nov 2026', type:'normal' },
  { t:'Coursera Geotechnical + Construction done', s:'L&T Piling (3) + L&T Formwork (3) = 6 courses.', h:'Dec 2026–Jan 2027', type:'normal' },
  { t:'HKUST Math for Engineers complete', s:'5 courses: Matrix Algebra → Diff Eq → Vector Calculus → Numerical → Capstone.', h:'Feb–Mar 2027', type:'normal' },
  { t:'Coursera queue fully cleared', s:'All ~50 Coursera courses done.', h:'Mar–Apr 2027', type:'normal' },
  { t:'Udemy queue done (trimmed)', s:'Drop Cyber Security + Unreal Engine. Keep: Geotechnical, Python, MATLAB, AI A-Z.', h:'Jun–Jul 2027', type:'normal' },
  { t:'Math & Physics self-study complete', s:'Classical Mech → Lin Alg → Geom Algebra → Group Theory → QM I+II → GR → Topology.', h:'Jul 2027', type:'normal' },
  { t:'Savings — 5,000 EUR milestone', s:'Requires 83k+/month. If not on track by Month 6, income must increase.', h:'Jan 2027', type:'normal' },
  { t:'Savings — 10,000 EUR target hit', s:'Full OU fund secured. Triggers application.', h:'Aug–Sep 2027', type:'priority', pri:true },
  { t:'Thesis Paper 1 submitted', s:'Saturday + weekday sessions. Submit before OU application.', h:'Sep 2027', type:'normal' },
  { t:'OU MPhys Application submitted', s:'Gate: IELTS ✓ | Courses ✓ | Math ✓ | 10k EUR ✓ | Thesis 1 ✓', h:'Sep–Nov 2027', type:'priority', pri:true },
  { t:'Begin OU MPhys', s:'Feb or Oct 2028 intake. The capstone — all streams converge.', h:'2028', type:'normal' },
  { t:'Savings baseline started — 50,000 BDT', s:'Already done ✓ — May 2026', h:'Done ✓', type:'done', done:true },
];

// Persisted milestone state
function getMDone() {
  try { return JSON.parse(localStorage.getItem('m_done')) || MILESTONES.map(m=>!!m.done); }
  catch { return MILESTONES.map(m=>!!m.done); }
}
function setMDone(arr) { localStorage.setItem('m_done', JSON.stringify(arr)); }

// ── COURSES ────────────────────────────────────────────────
const PHASES = [
  { id:'edx', label:'Platform 0 — edX', num:'NOW', headCls:'ph-edx',
    statCls:'phs-urgent', statLabel:'⚠️ Expires Jun 26', when:'May–Jun 2026',
    alertCls:'danger', alertTxt:'<strong>Hard deadline.</strong> Both expire Jun 26 2026. Open one today.',
    groups:[
      { name:'AI — IBM (expiring ⚠️)', month:'NOW', courses:[
        { n:'Agentic AI: Developing AI Agents', plat:'edX', pc:'edx', prog:'0%', pri:true },
        { n:'AI for Everyone', plat:'edX', pc:'edx', prog:'0%', pri:true },
      ]},
    ]},
  { id:'li', label:'Platform 1 — LinkedIn Learning', num:'PH 1', headCls:'ph-li',
    statCls:'phs-active', statLabel:'Active · After edX', when:'Jun 2026',
    alertCls:'info', alertTxt:'<strong>~2.5 hrs total remaining.</strong> Finish in 1–2 evenings before renewing Coursera.',
    groups:[
      { name:'Engineering / BIM', month:'Jun 2026', courses:[
        { n:'BIM Foundations', plat:'LinkedIn', pc:'li', prog:'1h 16m left', pri:true },
        { n:'Revit: Twinmotion Workflow', plat:'LinkedIn', pc:'li', prog:'1h 20m left', pri:true },
      ]},
    ]},
  { id:'coursera', label:'Platform 2 — Coursera', num:'PH 2', headCls:'ph-coursera',
    statCls:'phs-paused', statLabel:'Renew Aug 2026', when:'Aug 2026 – Apr 2027',
    alertCls:'neutral', alertTxt:'<strong>License paused.</strong> Renew after IELTS. 8–9 months to clear ~50 courses at 2–3 hr/day.',
    groups:[
      { name:'Engineering / BIM', month:'Aug–Sep 2026', courses:[
        { n:'BIM Application for Engineers — NTU', plat:'Coursera', pc:'coursera', prog:'14%', pri:true },
        { n:'BIM Fundamentals for Engineers (L&T)', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'BIM Coordination (L&T)', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Field BIM (L&T)', plat:'Coursera', pc:'coursera', prog:'0%' },
      ]},
      { name:'Structural — Georgia Tech (6 courses)', month:'Sep–Oct 2026', courses:[
        { n:'Introduction to Engineering Mechanics', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Applications in Engineering Mechanics', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Mechanics of Materials I: Stress & Strain', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Mechanics of Materials II: Pressure Vessels & Torsion', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Mechanics of Materials III: Beam Bending', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Mechanics of Materials IV: Deflections & Buckling', plat:'Coursera', pc:'coursera', prog:'0%' },
      ]},
      { name:'Structural — Dartmouth (4 courses)', month:'Oct–Nov 2026', courses:[
        { n:'Engineering of Structures: Compression', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Engineering of Structures: Tension & Compression', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Engineering of Structures: Shear & Bending', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Engineering of Structures: Response of Structures', plat:'Coursera', pc:'coursera', prog:'0%' },
      ]},
      { name:'Structural — L&T RCC + Steel (6 courses)', month:'Nov–Dec 2026', courses:[
        { n:'Design Basics of RCC Buildings', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Structural Scheme Setting & ETABS Analysis of RCC', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Design & Detailing of RCC Elements', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Design Basics of Steel Buildings', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Modelling, Analysis & Design of Steel Buildings', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Construction Aspects of Steel Buildings', plat:'Coursera', pc:'coursera', prog:'0%' },
      ]},
      { name:'Seismic', month:'Dec 2026', courses:[
        { n:'Seismology to Earthquake Engineering — École Polytechnique', plat:'Coursera', pc:'coursera', prog:'11%' },
      ]},
      { name:'Geotechnical + Construction (6 courses)', month:'Jan 2027', courses:[
        { n:'Introduction to Pile Foundation (L&T)', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Precast & Advanced Pile Foundation (L&T)', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Grouping, Testing & QC of Pile Foundations (L&T)', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Formwork Systems (L&T)', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Design of Formwork System (L&T)', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Construction Aspects of Formwork (L&T)', plat:'Coursera', pc:'coursera', prog:'0%' },
      ]},
      { name:'Math — HKUST (5 courses)', month:'Feb–Mar 2027', courses:[
        { n:'Matrix Algebra for Engineers', plat:'Coursera', pc:'coursera', prog:'0%', pri:true },
        { n:'Differential Equations for Engineers', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Vector Calculus for Engineers', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Numerical Methods for Engineers', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Mathematics for Engineers: Capstone', plat:'Coursera', pc:'coursera', prog:'0%' },
      ]},
      { name:'Computational + AI Math + Research', month:'Mar 2027', courses:[
        { n:'The Finite Element Method for Problems in Physics — U Michigan', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Foundational Mathematics for AI — Johns Hopkins', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Understanding Research Methods — U London & SOAS', plat:'Coursera', pc:'coursera', prog:'8%' },
      ]},
      { name:'Sustainability + GIS (7 courses)', month:'Mar–Apr 2027', courses:[
        { n:'Comfort in Buildings (L&T)', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Resource & Waste Management in Buildings (L&T)', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Green Building Assessment & Certification (L&T)', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Net-Zero Building Fundamentals — IIHS', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'Fundamentals of GIS — UC Davis', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'GIS Data Formats, Design & Quality — UC Davis', plat:'Coursera', pc:'coursera', prog:'0%' },
        { n:'GIS Applications Across Industries — UC Davis', plat:'Coursera', pc:'coursera', prog:'0%' },
      ]},
      { name:'Enrichment (drop if behind schedule)', month:'Apr 2027', courses:[
        { n:'Making Architecture — IE Business School', plat:'Coursera', pc:'coursera', prog:'0%' },
      ]},
    ]},
  { id:'udemy', label:'Platform 3 — Udemy', num:'PH 3', headCls:'ph-udemy',
    statCls:'phs-later', statLabel:'Apr 2027+', when:'Apr–Jun 2027',
    alertCls:'ok', alertTxt:'<strong>No expiry. No subscription cost.</strong> 3 already done ✅. Drop Cyber Security + Unreal Engine.',
    groups:[
      { name:'Completed ✅', month:'Done', courses:[
        { n:'BIM Fundamentals: The Complete Practical Guide to BIM', plat:'Udemy', pc:'udemy', prog:'100%', fixed:true },
        { n:'Autodesk Revit — Beginner to Advanced Level', plat:'Udemy', pc:'udemy', prog:'100%', fixed:true },
        { n:'The Comprehensive ETABS Professional Course (RCC & Steel)', plat:'Udemy', pc:'udemy', prog:'100%', fixed:true },
      ]},
      { name:'Pending — in priority order', month:'Apr–Jun 2027', courses:[
        { n:'Perform Better Geotechnical Numerical Analysis', plat:'Udemy', pc:'udemy', prog:'0%', pri:true },
        { n:'The Complete Python Bootcamp From Zero to Hero', plat:'Udemy', pc:'udemy', prog:'3%' },
        { n:'MATLAB/SIMULINK Bible — Go From Zero to Hero', plat:'Udemy', pc:'udemy', prog:'0%' },
        { n:'AI A-Z [2026]: Agentic AI, Gen AI, Prompt Eng & RL', plat:'Udemy', pc:'udemy', prog:'1%' },
        { n:'Ultimate Microsoft Office: Excel, Word, PowerPoint', plat:'Udemy', pc:'udemy', prog:'7%' },
        { n:'The Complete Cyber Security Course', plat:'Udemy', pc:'udemy', prog:'0%', drop:true },
        { n:'Unreal Engine 5 C++ Game Development', plat:'Udemy', pc:'udemy', prog:'0%', drop:true },
      ]},
    ]},
];

// Flatten for indexing
function flatCourses() {
  const arr = [];
  PHASES.forEach(p => p.groups.forEach(g => g.courses.forEach(c => arr.push(c))));
  return arr;
}
function getCDone() {
  try {
    const saved = JSON.parse(localStorage.getItem('c_done'));
    if (!saved) return flatCourses().map(c => !!c.fixed);
    return saved;
  } catch { return flatCourses().map(c => !!c.fixed); }
}
function setCDone(arr) { localStorage.setItem('c_done', JSON.stringify(arr)); }

// ── SCHEDULE BUILDER ────────────────────────────────────────
// Returns array of {t, n, d, tag, cls}
// tag = ielts|math|work|study|thesis|life|rest
// cls = row-X

function buildSchedule(order, preIelts, tier) {
  const base = [
    { t:'06:00–06:30', n:'Wake + Morning Basics', d:'Bathroom, freshen up, water, light stretching', tag:'rest', cls:'row-rest' },
    { t:'06:30–07:00', n:'Breakfast', d:'Proper fuel — do not skip, it supports focus all morning', tag:'rest', cls:'row-rest' },
  ];
  if (preIelts && order) {
    const slots = {
      1:[
        {t:'07:00–08:00',n:'🎯 IELTS Daily Block (1 hr)',d:'Listening + reading section. Timed. No distractions.',tag:'ielts',cls:'row-ielts'},
        {t:'08:00–08:30',n:'📐 Math/Physics (30 min)',d:'Daily touch — Classical Mechanics or Linear Algebra',tag:'math',cls:'row-math'},
        {t:'08:30–12:30',n:'Work Block A',d:'ETABS / Revit / SAFE / PLAXIS / BIM — deep focus',tag:'work',cls:'row-work'},
        {t:'12:30–13:15',n:'Lunch + Rest',d:'Proper meal; short rest or prayer',tag:'rest',cls:'row-rest'},
        {t:'13:15–17:15',n:'Work Block B',d:'Structural/BIM work, documentation, client comms',tag:'work',cls:'row-work'},
        {t:'17:15–17:45',n:'Break + Snack + Walk',d:'Hydrate, move, decompress before evening session',tag:'rest',cls:'row-rest'},
        {t:'17:45–19:15',n:'Active Course (1.5 hr)',d:'edX → LinkedIn → Coursera → Udemy in platform order',tag:'study',cls:'row-study'},
        {t:'19:15–20:00',n:'Dinner',d:'Proper meal; family time',tag:'rest',cls:'row-rest'},
        {t:'20:00–20:30',n:'🎯 IELTS Review (30 min)',d:'Review errors from morning; vocabulary flashcards',tag:'ielts',cls:'row-ielts'},
        {t:'20:30–21:00',n:'Literature / Culture',d:'30 min — reading, linguistics, pure enjoyment',tag:'life',cls:'row-life'},
        {t:'21:00–21:30',n:'Plan + Savings Log + Admin',d:'Tomorrow tasks; savings update; Upwork messages',tag:'rest',cls:'row-rest'},
        {t:'21:30–22:00',n:'Wind-down',d:'Low light; no harsh screens; prepare for sleep',tag:'life',cls:'row-life'},
        {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Non-negotiable. Foundation of everything.',tag:'rest',cls:'row-rest'},
      ],
      2:[
        {t:'07:00–08:30',n:'🎯 IELTS Block (1.5 hr)',d:'Two sections or 1 section + writing task. Fully timed.',tag:'ielts',cls:'row-ielts'},
        {t:'08:30–09:00',n:'📐 Math/Physics (30 min)',d:'Daily foundation — never skip',tag:'math',cls:'row-math'},
        {t:'09:00–12:30',n:'Work Block A',d:'ETABS / Revit / PLAXIS / BIM',tag:'work',cls:'row-work'},
        {t:'12:30–13:15',n:'Lunch + Rest',d:'Proper meal',tag:'rest',cls:'row-rest'},
        {t:'13:15–17:15',n:'Work Block B',d:'Structural/BIM, documentation, client comms',tag:'work',cls:'row-work'},
        {t:'17:15–17:35',n:'Break',d:'Short physical reset',tag:'rest',cls:'row-rest'},
        {t:'17:35–19:35',n:'Active Course (2 hr)',d:'Current platform — full pace',tag:'study',cls:'row-study'},
        {t:'19:35–20:15',n:'Dinner',d:'Proper meal',tag:'rest',cls:'row-rest'},
        {t:'20:15–20:35',n:'Recreation (20 min)',d:'Brief culture read or linguistics',tag:'life',cls:'row-life'},
        {t:'20:35–21:05',n:'Plan + Admin',d:'Tasks, savings log, messages — batched',tag:'rest',cls:'row-rest'},
        {t:'21:05–22:00',n:'Wind-down',d:'Low light; light read; prep for sleep',tag:'life',cls:'row-life'},
        {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Non-negotiable.',tag:'rest',cls:'row-rest'},
      ],
      3:[
        {t:'07:00–08:30',n:'🎯 IELTS Block (1.5 hr)',d:'Two sections + writing. Fully timed.',tag:'ielts',cls:'row-ielts'},
        {t:'08:30–09:00',n:'📐 Math/Physics (30 min)',d:'Daily foundation touch',tag:'math',cls:'row-math'},
        {t:'09:00–12:30',n:'Work Block A',d:'ETABS / Revit / PLAXIS / BIM',tag:'work',cls:'row-work'},
        {t:'12:30–13:10',n:'Lunch + Rest',d:'Proper meal',tag:'rest',cls:'row-rest'},
        {t:'13:10–17:15',n:'Work Block B',d:'Structural/BIM, deliverables',tag:'work',cls:'row-work'},
        {t:'17:15–17:30',n:'Break',d:'Short reset',tag:'rest',cls:'row-rest'},
        {t:'17:30–20:00',n:'Active Course (2.5 hr)',d:'Push hard — double-pace if needed',tag:'study',cls:'row-study'},
        {t:'20:00–20:40',n:'Dinner',d:'Proper meal',tag:'rest',cls:'row-rest'},
        {t:'20:40–21:00',n:'Recreation (20 min)',d:'Brief cultural read',tag:'life',cls:'row-life'},
        {t:'21:00–22:00',n:'Plan + Admin + Wind-down',d:'Batched; prep for sleep',tag:'rest',cls:'row-rest'},
        {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Always protected.',tag:'rest',cls:'row-rest'},
      ],
      4:[
        {t:'07:00–08:30',n:'🎯 IELTS Block (1.5 hr)',d:'Full mock section + timed essay + error log',tag:'ielts',cls:'row-ielts'},
        {t:'08:30–09:00',n:'📐 Math/Physics (30 min)',d:'Daily touch — non-negotiable',tag:'math',cls:'row-math'},
        {t:'09:00–12:30',n:'Work Block A',d:'High-value delivery only',tag:'work',cls:'row-work'},
        {t:'12:30–13:00',n:'Lunch + Rest',d:'Proper meal',tag:'rest',cls:'row-rest'},
        {t:'13:00–17:15',n:'Work Block B',d:'Structural/BIM, client deliverables',tag:'work',cls:'row-work'},
        {t:'17:15–17:30',n:'Break',d:'Short reset',tag:'rest',cls:'row-rest'},
        {t:'17:30–20:30',n:'Active Course (3 hr)',d:'Maximum daily course push',tag:'study',cls:'row-study'},
        {t:'20:30–21:05',n:'Dinner',d:'Proper meal',tag:'rest',cls:'row-rest'},
        {t:'21:05–21:20',n:'Recreation (15 min)',d:'Brief read',tag:'life',cls:'row-life'},
        {t:'21:20–22:00',n:'Plan + Admin + Wind-down',d:'Batched tight',tag:'rest',cls:'row-rest'},
        {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Absolute non-negotiable.',tag:'rest',cls:'row-rest'},
      ],
    };
    return [...base, ...slots[tier.id]];
  }
  if (preIelts && !order) {
    return [...base,
      {t:'07:00–09:30',n:'🎯 IELTS Full Block (2.5 hr)',d:'Complete 4-band timed test OR 2 sections + writing + review',tag:'ielts',cls:'row-ielts'},
      {t:'09:30–11:30',n:'📐 Math/Physics Deep (2 hr)',d:'Classical Mechanics, Linear Algebra, or Geometric Algebra',tag:'math',cls:'row-math'},
      {t:'11:30–13:00',n:'Courses — Morning Push (1.5 hr)',d:'Current active course at full pace',tag:'study',cls:'row-study'},
      {t:'13:00–13:45',n:'Lunch + Rest',d:'Proper meal; short rest',tag:'rest',cls:'row-rest'},
      {t:'13:45–15:45',n:'Thesis Writing Block (2 hr)',d:'One paper. Write, edit, or literature review. No interruptions.',tag:'thesis',cls:'row-thesis'},
      {t:'15:45–16:15',n:'Break + Walk',d:'Physical movement essential',tag:'rest',cls:'row-rest'},
      {t:'16:15–18:15',n:'Courses — Afternoon (2 hr)',d:'Second course block — full pace',tag:'study',cls:'row-study'},
      {t:'18:15–18:45',n:'🎯 IELTS Review (30 min)',d:'Review errors; weak-area drill; vocab flashcards',tag:'ielts',cls:'row-ielts'},
      {t:'18:45–19:30',n:'Dinner',d:'Proper meal',tag:'rest',cls:'row-rest'},
      {t:'19:30–20:00',n:'Literature / Linguistics (30 min)',d:'Pure enjoyment — no targets',tag:'life',cls:'row-life'},
      {t:'20:00–21:00',n:'Weekly Review + Plan + Savings',d:'Full assessment; block plan; savings log',tag:'rest',cls:'row-rest'},
      {t:'21:00–22:00',n:'Admin + Wind-down',d:'Upwork, email, banking; then low-light read',tag:'life',cls:'row-life'},
      {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Non-negotiable.',tag:'rest',cls:'row-rest'},
    ];
  }
  if (!preIelts && order) {
    const slots = {
      1:[
        {t:'07:00–07:45',n:'📐 Math/Physics (45 min)',d:'Morning slot: GR, QM, Geometric Algebra — daily chapter',tag:'math',cls:'row-math'},
        {t:'07:45–08:30',n:'Courses — AM Warmup (45 min)',d:'Morning course session before work',tag:'study',cls:'row-study'},
        {t:'08:30–12:30',n:'Work Block A',d:'ETABS / Revit / SAFE / PLAXIS / BIM',tag:'work',cls:'row-work'},
        {t:'12:30–13:15',n:'Lunch + Rest',d:'Proper meal',tag:'rest',cls:'row-rest'},
        {t:'13:15–17:15',n:'Work Block B',d:'Structural/BIM, documentation',tag:'work',cls:'row-work'},
        {t:'17:15–17:45',n:'Break + Snack',d:'Hydrate, walk',tag:'rest',cls:'row-rest'},
        {t:'17:45–19:15',n:'Courses — PM Block (1.5 hr)',d:'Main course session — current platform',tag:'study',cls:'row-study'},
        {t:'19:15–20:00',n:'Dinner',d:'Proper meal',tag:'rest',cls:'row-rest'},
        {t:'20:00–20:35',n:'Thesis / English Review',d:'Thesis writing OR English practice to maintain IELTS level',tag:'thesis',cls:'row-thesis'},
        {t:'20:35–21:05',n:'Literature / Culture (30 min)',d:'Reading, linguistics, enjoyment',tag:'life',cls:'row-life'},
        {t:'21:05–22:00',n:'Plan + Admin + Wind-down',d:'Batched — tasks, savings, messages, wind-down',tag:'rest',cls:'row-rest'},
        {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Non-negotiable.',tag:'rest',cls:'row-rest'},
      ],
      2:[
        {t:'07:00–08:00',n:'📐 Math/Physics (1 hr)',d:'GR, QM, or Geometric Algebra — deeper daily session',tag:'math',cls:'row-math'},
        {t:'08:00–09:00',n:'Courses — AM Block (1 hr)',d:'Morning course push before work',tag:'study',cls:'row-study'},
        {t:'09:00–12:30',n:'Work Block A',d:'ETABS / Revit / PLAXIS / BIM',tag:'work',cls:'row-work'},
        {t:'12:30–13:15',n:'Lunch + Rest',d:'Proper meal',tag:'rest',cls:'row-rest'},
        {t:'13:15–17:15',n:'Work Block B',d:'Structural/BIM, deliverables',tag:'work',cls:'row-work'},
        {t:'17:15–17:35',n:'Break',d:'Short physical reset',tag:'rest',cls:'row-rest'},
        {t:'17:35–19:35',n:'Courses — PM Block (2 hr)',d:'Main course push',tag:'study',cls:'row-study'},
        {t:'19:35–20:15',n:'Dinner',d:'Proper meal',tag:'rest',cls:'row-rest'},
        {t:'20:15–20:50',n:'Thesis (35 min)',d:'Daily thesis — even a few paragraphs counts',tag:'thesis',cls:'row-thesis'},
        {t:'20:50–21:10',n:'Recreation (20 min)',d:'Brief cultural read',tag:'life',cls:'row-life'},
        {t:'21:10–22:00',n:'Plan + Admin + Wind-down',d:'Batched then wind-down',tag:'rest',cls:'row-rest'},
        {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Non-negotiable.',tag:'rest',cls:'row-rest'},
      ],
      3:[
        {t:'07:00–08:00',n:'📐 Math/Physics (1 hr)',d:'Deep daily session — GR derivations, QM formalism',tag:'math',cls:'row-math'},
        {t:'08:00–09:30',n:'Courses — AM Block (1.5 hr)',d:'Morning course push',tag:'study',cls:'row-study'},
        {t:'09:30–12:30',n:'Work Block A',d:'ETABS / Revit / PLAXIS / BIM',tag:'work',cls:'row-work'},
        {t:'12:30–13:10',n:'Lunch + Rest',d:'Proper meal',tag:'rest',cls:'row-rest'},
        {t:'13:10–17:15',n:'Work Block B',d:'Structural/BIM, deliverables',tag:'work',cls:'row-work'},
        {t:'17:15–17:30',n:'Break',d:'Short reset',tag:'rest',cls:'row-rest'},
        {t:'17:30–20:00',n:'Courses — PM Block (2.5 hr)',d:'Double-pace course push',tag:'study',cls:'row-study'},
        {t:'20:00–20:40',n:'Dinner',d:'Proper meal',tag:'rest',cls:'row-rest'},
        {t:'20:40–21:10',n:'Thesis (30 min)',d:'Daily writing — consistency beats intensity',tag:'thesis',cls:'row-thesis'},
        {t:'21:10–22:00',n:'Plan + Admin + Wind-down',d:'Batched',tag:'rest',cls:'row-rest'},
        {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Always protected.',tag:'rest',cls:'row-rest'},
      ],
      4:[
        {t:'07:00–08:30',n:'📐 Math/Physics (1.5 hr)',d:'Heaviest material first — hardest daily slot',tag:'math',cls:'row-math'},
        {t:'08:30–10:00',n:'Courses — AM Block (1.5 hr)',d:'Pre-work course sprint',tag:'study',cls:'row-study'},
        {t:'10:00–12:30',n:'Work Block A',d:'High-value work only',tag:'work',cls:'row-work'},
        {t:'12:30–13:00',n:'Lunch + Rest',d:'Proper meal',tag:'rest',cls:'row-rest'},
        {t:'13:00–17:15',n:'Work Block B',d:'Structural/BIM deliverables',tag:'work',cls:'row-work'},
        {t:'17:15–17:30',n:'Break',d:'Short reset',tag:'rest',cls:'row-rest'},
        {t:'17:30–20:30',n:'Courses — PM Block (3 hr)',d:'Maximum daily course push',tag:'study',cls:'row-study'},
        {t:'20:30–21:00',n:'Dinner',d:'Proper meal',tag:'rest',cls:'row-rest'},
        {t:'21:00–21:15',n:'Recreation (15 min)',d:'Brief read',tag:'life',cls:'row-life'},
        {t:'21:15–22:00',n:'Plan + Admin + Wind-down',d:'Batched tight',tag:'rest',cls:'row-rest'},
        {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Absolute non-negotiable.',tag:'rest',cls:'row-rest'},
      ],
    };
    return [...base, ...slots[tier.id]];
  }
  // Post-IELTS Free Day
  return [...base,
    {t:'07:00–09:30',n:'📐 Math/Physics Deep (2.5 hr)',d:'Hardest material: QM proofs, GR derivations, Geometric Algebra',tag:'math',cls:'row-math'},
    {t:'09:30–11:30',n:'Courses — Morning Push (2 hr)',d:'Full pace — ride the morning focus window',tag:'study',cls:'row-study'},
    {t:'11:30–13:00',n:'Courses — Continued (1.5 hr)',d:'Second block or double-pace single course',tag:'study',cls:'row-study'},
    {t:'13:00–13:45',n:'Lunch + Rest',d:'Proper meal; short rest',tag:'rest',cls:'row-rest'},
    {t:'13:45–16:15',n:'Thesis Writing Block (2.5 hr)',d:'Serious session — one paper, uninterrupted',tag:'thesis',cls:'row-thesis'},
    {t:'16:15–16:45',n:'Break + Walk',d:'Physical movement essential',tag:'rest',cls:'row-rest'},
    {t:'16:45–19:15',n:'Courses — Afternoon (2.5 hr)',d:'Third course block — clear the queue',tag:'study',cls:'row-study'},
    {t:'19:15–20:00',n:'Dinner',d:'Proper meal',tag:'rest',cls:'row-rest'},
    {t:'20:00–20:30',n:'Literature / Culture (30 min)',d:'Reading, linguistics, pure enjoyment',tag:'life',cls:'row-life'},
    {t:'20:30–21:00',n:'Weekly Review + Plan + Savings',d:'Full assessment; block plan; savings log',tag:'rest',cls:'row-rest'},
    {t:'21:00–22:00',n:'Admin + Wind-down',d:'Upwork, email, banking; low-light read',tag:'life',cls:'row-life'},
    {t:'22:00–06:00',n:'Sleep (8 hrs)',d:'Non-negotiable.',tag:'rest',cls:'row-rest'},
  ];
}

// ── SHARED UTILITIES ───────────────────────────────────────
function buildNavHTML(activePage) {
  const pages = [
    { href:'index.html',     label:'Dashboard' },
    { href:'daily.html',     label:'Daily' },
    { href:'courses.html',   label:'Courses' },
    { href:'milestones.html',label:'Milestones' },
    { href:'savings.html',   label:'Savings' },
    { href:'roadmap.html',   label:'Roadmap' },
  ];
  const today = D.today;
  const edxDays = daysUntil(D.edx);
  const pm = planMonth();
  const links = pages.map(p =>
    `<a class="nav-link${p.href === activePage ? ' active' : ''}" href="${p.href}">${p.label}</a>`
  ).join('');
  return `
<div class="alert-bar danger" id="alert-bar">
  <span><span class="ab-dot"></span>edX expires in <strong id="edx-days">${edxDays}</strong> days · Jun 26 2026</span>
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
    <span id="nav-date">${today.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
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
  <span>Target: OU Application by Nov 2027 · Built May 2026</span>
</footer>`;
}

function buildTimelineHTML() {
  const pm = planMonth();
  const items = [...Array(18)].map((_,i) => {
    const m = i + 1;
    const d = new Date(D.start.getFullYear(), D.start.getMonth() + m - 1, 1);
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
  document.getElementById('nav-links').classList.toggle('mobile-open');
}
