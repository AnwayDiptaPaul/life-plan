/* ═══════════════════════════════════════════════════════════
   SPRINT OS — update.js  v2
   Real-time engine. Bug fixes from v1:
   - U.init() now fires regardless of gapi load status
   - Clock uses fresh Date() on every call
   - Phase.planMonth() proxy added
   - _highlightCurrentBlock safely handles missing sched-list
   NEW in v2:
   - Web Push Notifications (Notification API)
   - Confetti on major milestone completions
   - PWA install prompt handling
   - Income log integration
   - Weekly review trigger on Sundays
   - Math progress auto-completion detection
   - OU checklist completion detection
═══════════════════════════════════════════════════════════ */

window.U = (function () {

  /* ── 1. CLOCK ────────────────────────────────────────────── */
  const Clock = {
    now()      { return new Date(); },
    hour()     { return this.now().getHours(); },
    minute()   { return this.now().getMinutes(); },
    dow()      { return this.now().getDay(); },   // 0=Sun … 6=Sat
    hhMM()     { return String(this.hour()).padStart(2,'0') + ':' + String(this.minute()).padStart(2,'0'); },
    dateStr()  { return this.now().toISOString().slice(0,10); },           // YYYY-MM-DD
    isSaturday(){ return this.dow() === 6; },
    isSunday()  { return this.dow() === 0; },
    isWeekend() { return this.dow() === 0 || this.dow() === 6; },

    currentBlock(schedule) {
      if (!schedule || !schedule.length) return null;
      const now = this.hour() * 60 + this.minute();
      const toMins = s => {
        if (!s) return 0;
        const [h, m] = s.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };
      for (const row of schedule) {
        const parts = (row.t || '').split('–');
        if (parts.length < 2) continue;
        const start = toMins(parts[0]);
        const end   = toMins(parts[1]);
        if (end < start) { if (now >= start || now < end) return row; }
        else             { if (now >= start && now < end) return row; }
      }
      return null;
    },
  };

  /* ── 2. PHASE ────────────────────────────────────────────── */
  const Phase = {
    isPreIelts()      { return localStorage.getItem('pre_ielts') !== 'false'; },
    setIeltsTaken(s)  {
      localStorage.setItem('pre_ielts',         'false');
      localStorage.setItem('ielts_taken',        'true');
      localStorage.setItem('ielts_taken_date',   Clock.now().toISOString());
      localStorage.setItem('ielts_score',        String(s));
    },
    ieltsTaken()      { return localStorage.getItem('ielts_taken') === 'true'; },
    ieltsScore()      { return parseFloat(localStorage.getItem('ielts_score')) || null; },
    ieltsTakenDate()  { return localStorage.getItem('ielts_taken_date') || null; },
    planMonth()       { return planMonth(); },   // proxy to global
  };

  /* ── 3. ROUTINE ──────────────────────────────────────────── */
  const Routine = {
    todayKey()  { return 'order_day_' + Clock.dateStr(); },
    hasOrder()  { return localStorage.getItem(this.todayKey()) !== 'false'; },
    setOrder(v) { localStorage.setItem(this.todayKey(), String(v)); },

    todaySchedule() {
      return buildSchedule(this.hasOrder(), Phase.isPreIelts(), getTier());
    },
    currentBlock()  { return Clock.currentBlock(this.todaySchedule()); },
    nextBlock() {
      const sched = this.todaySchedule();
      const now   = Clock.hour() * 60 + Clock.minute();
      const toMins = s => { const [h,m] = (s||'0:0').split(':').map(Number); return h*60+(m||0); };
      for (let i = 0; i < sched.length; i++) {
        const parts = (sched[i].t||'').split('–');
        if (parts.length < 2) continue;
        if (now < toMins(parts[1])) return sched[i+1] || null;
      }
      return sched[0] || null;
    },

    greeting() {
      const h = Clock.hour();
      if (h < 5)  return 'Still up late, Anway?';
      if (h < 12) return 'Good morning, Anway.';
      if (h < 17) return 'Good afternoon, Anway.';
      if (h < 21) return 'Good evening, Anway.';
      return 'Late session, Anway.';
    },
    dailyPriority() {
      const edxD   = daysUntil(EDX_DATE);
      const ieltsD = daysUntil(IELTS_DATE);
      if (edxD <= 0)  return '🚨 edX courses have expired — check for extension options.';
      if (edxD <= 7)  return `⚠️ edX expires in ${edxD} days — open a lesson NOW.`;
      if (Phase.isPreIelts()) return `🎯 IELTS in ${ieltsD} days — every session counts.`;
      return `📐 Post-IELTS: push courses + math every day.`;
    },
  };

  /* ── 4. GOOGLE DRIVE ─────────────────────────────────────── */
  const GAPI_CONFIG = {
    clientId:      'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    apiKey:        'YOUR_GOOGLE_API_KEY',
    discoveryDocs: [
      'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
      'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    ],
    scopes: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/calendar.events',
    fileName:    'sprint-os-state.json',
    calendarId:  'primary',
  };

  const Drive = {
    _signedIn: false,
    _fileId:   null,
    _ready:    false,

    buildSnapshot() {
      return {
        version:        2,
        savedAt:        Clock.now().toISOString(),
        savings:        { bdt: S.bdt, monthly: S.monthly },
        milestones:     getMDone(),
        courses:        getCDone(),
        mathDone:       getMathDone(),
        ouDone:         getOUDone(),
        preIelts:       Phase.isPreIelts(),
        ieltsTaken:     Phase.ieltsTaken(),
        ieltsTakenDate: Phase.ieltsTakenDate(),
        ieltsScore:     Phase.ieltsScore(),
        mockScores:     getMockScores(),
        incomeLog:      getIncomeLog(),
        settings: {
          calEvents:    localStorage.getItem('cal_events')    !== 'false',
          calReminders: localStorage.getItem('cal_reminders') !== 'false',
          pushNotifs:   localStorage.getItem('push_notifs')   === 'true',
        },
      };
    },

    applySnapshot(snap) {
      if (!snap || !snap.version) return;
      if (snap.savings)   { S.bdt = snap.savings.bdt; S.monthly = snap.savings.monthly; }
      if (snap.milestones && snap.milestones.length === MILESTONES.length) setMDone(snap.milestones);
      if (snap.courses    && snap.courses.length    === flatCourses().length) setCDone(snap.courses);
      if (snap.mathDone)    localStorage.setItem('math_done',     JSON.stringify(snap.mathDone));
      if (snap.ouDone)      localStorage.setItem('ou_done',       JSON.stringify(snap.ouDone));
      if (snap.mockScores)  localStorage.setItem('mock_scores',   JSON.stringify(snap.mockScores));
      if (snap.incomeLog)   localStorage.setItem('income_log',    JSON.stringify(snap.incomeLog));
      if (snap.ieltsTaken !== undefined) {
        localStorage.setItem('pre_ielts',        String(!snap.ieltsTaken));
        localStorage.setItem('ielts_taken',      String(snap.ieltsTaken));
        if (snap.ieltsTakenDate) localStorage.setItem('ielts_taken_date', snap.ieltsTakenDate);
        if (snap.ieltsScore)     localStorage.setItem('ielts_score',      String(snap.ieltsScore));
      }
      if (snap.settings) {
        localStorage.setItem('cal_events',    String(snap.settings.calEvents));
        localStorage.setItem('cal_reminders', String(snap.settings.calReminders));
        localStorage.setItem('push_notifs',   String(snap.settings.pushNotifs));
      }
    },

    async initGapi() {
      return new Promise((resolve, reject) => {
        if (typeof gapi === 'undefined') { reject(new Error('gapi not loaded')); return; }
        gapi.load('client:auth2', async () => {
          try {
            await gapi.client.init({
              apiKey:        GAPI_CONFIG.apiKey,
              clientId:      GAPI_CONFIG.clientId,
              discoveryDocs: GAPI_CONFIG.discoveryDocs,
              scope:         GAPI_CONFIG.scopes,
            });
            this._ready = true;
            gapi.auth2.getAuthInstance().isSignedIn.listen(v => this._onChange(v));
            this._onChange(gapi.auth2.getAuthInstance().isSignedIn.get());
            resolve();
          } catch (e) { reject(e); }
        });
      });
    },

    _onChange(signedIn) {
      this._signedIn = signedIn;
      document.dispatchEvent(new CustomEvent('gapi:auth', { detail: { isSignedIn: signedIn } }));
      if (signedIn) this.load();
    },

    signIn()     { this._ready && gapi.auth2.getAuthInstance().signIn(); },
    signOut()    { this._ready && gapi.auth2.getAuthInstance().signOut(); },
    isSignedIn() { return this._signedIn; },

    async _findOrCreate() {
      if (this._fileId) return this._fileId;
      const r = await gapi.client.drive.files.list({ spaces:'appDataFolder', q:`name='${GAPI_CONFIG.fileName}'`, fields:'files(id)' });
      if (r.result.files.length) { this._fileId = r.result.files[0].id; }
      else {
        const c = await gapi.client.drive.files.create({ resource:{ name:GAPI_CONFIG.fileName, parents:['appDataFolder'] }, fields:'id' });
        this._fileId = c.result.id;
      }
      return this._fileId;
    },

    async save() {
      if (!this._signedIn) { this._saveLocal(); return; }
      try {
        const id      = await this._findOrCreate();
        const content = JSON.stringify(this.buildSnapshot(), null, 2);
        await gapi.client.request({ path:`https://www.googleapis.com/upload/drive/v3/files/${id}`, method:'PATCH', params:{uploadType:'media'}, headers:{'Content-Type':'application/json'}, body:content });
        _setStatus('saved', 'Saved to Google Drive · ' + new Date().toLocaleTimeString());
      } catch { this._saveLocal(); }
    },

    async load() {
      if (!this._signedIn) return;
      try {
        const id   = await this._findOrCreate();
        const resp = await gapi.client.drive.files.get({ fileId:id, alt:'media' });
        const snap = typeof resp.result === 'string' ? JSON.parse(resp.result) : resp.result;
        this.applySnapshot(snap);
        document.dispatchEvent(new CustomEvent('state:loaded'));
        _setStatus('loaded', 'Loaded from Google Drive · ' + new Date().toLocaleTimeString());
      } catch (e) { console.warn('Drive load:', e); }
    },

    _saveLocal() {
      localStorage.setItem('sprint_snapshot', JSON.stringify(this.buildSnapshot()));
      _setStatus('local', 'Saved locally');
    },
    loadLocal() {
      try {
        const raw = localStorage.getItem('sprint_snapshot');
        if (raw) this.applySnapshot(JSON.parse(raw));
      } catch {}
    },
  };

  function _setStatus(type, msg) {
    document.dispatchEvent(new CustomEvent('sync:status', { detail: { type, msg } }));
    const el = document.getElementById('sync-status');
    if (el) { el.textContent = msg; el.className = 'sync-status sync-' + type; }
  }

  /* ── 5. GOOGLE CALENDAR ──────────────────────────────────── */
  const Cal = {
    enabled()   { return localStorage.getItem('cal_events') !== 'false'; },
    reminders() { return localStorage.getItem('cal_reminders') !== 'false'; },

    _blockColor: { ielts:'11', math:'2', work:'6', study:'9', thesis:'3', life:'5', rest:'8' },

    _buildEvent(block, date) {
      const [ss, es] = block.t.split('–');
      const tz  = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const toISO = (ts, d) => {
        const [h,m] = ts.split(':').map(Number);
        const dt = new Date(d); dt.setHours(h, m, 0, 0);
        if (es === '06:00' && h >= 22) dt.setDate(dt.getDate()+1);
        return dt.toISOString();
      };
      const reminders = this.reminders()
        ? { useDefault:false, overrides:[{ method:'popup', minutes:5 }] }
        : { useDefault:false, overrides:[] };
      return {
        summary:     block.n,
        description: block.d,
        start:       { dateTime:toISO(ss, date), timeZone:tz },
        end:         { dateTime:toISO(es, date), timeZone:tz },
        colorId:     this._blockColor[block.tag] || '8',
        reminders,
        extendedProperties: { private:{ source:'sprint-os', tag:block.tag } },
      };
    },

    async addTodaySchedule() {
      if (!Drive._signedIn || !this.enabled()) return 0;
      const sched = Routine.todaySchedule().filter(b => b.tag !== 'rest');
      let added = 0;
      for (const b of sched) {
        try { await gapi.client.calendar.events.insert({ calendarId:GAPI_CONFIG.calendarId, resource:this._buildEvent(b, Clock.now()) }); added++; }
        catch {}
      }
      return added;
    },

    async addMilestoneEvent(m) {
      if (!Drive._signedIn || !this.enabled() || !m) return;
      const dateMap = { 'TODAY':Clock.dateStr(), 'Before Jun 26':'2026-06-25', 'Jun 2026':'2026-06-30', 'Jul 2026':'2026-07-31', 'Aug 2026':'2026-08-31', 'Oct–Nov 2026':'2026-10-31', 'Dec 2026–Jan 2027':'2026-12-31', 'Feb–Mar 2027':'2027-02-28', 'Mar–Apr 2027':'2027-03-31', 'Jun–Jul 2027':'2027-06-30', 'Jul 2027':'2027-07-31', 'Jan 2027':'2027-01-31', 'Aug–Sep 2027':'2027-08-31', 'Sep 2027':'2027-09-30', 'Sep–Nov 2027':'2027-09-30', '2028':'2028-02-01' };
      const dt = dateMap[m.h]; if (!dt) return;
      try { await gapi.client.calendar.events.insert({ calendarId:GAPI_CONFIG.calendarId, resource:{ summary:'🎯 '+m.t, description:m.s, start:{date:dt}, end:{date:dt}, colorId: m.type==='urgent'?'11':'5', reminders:this.reminders()?{useDefault:false,overrides:[{method:'popup',minutes:1440}]}:{useDefault:false} } }); }
      catch {}
    },

    async addEdxExpiry() {
      if (!Drive._signedIn || !this.enabled()) return;
      try { await gapi.client.calendar.events.insert({ calendarId:GAPI_CONFIG.calendarId, resource:{ summary:'⚠️ edX Courses Expire', description:'Agentic AI + AI for Everyone (IBM) expire today.', start:{date:'2026-06-26'}, end:{date:'2026-06-26'}, colorId:'11' } }); } catch {}
    },

    async addIeltsExam() {
      if (!Drive._signedIn || !this.enabled()) return;
      try { await gapi.client.calendar.events.insert({ calendarId:GAPI_CONFIG.calendarId, resource:{ summary:'📝 IELTS Exam — Target Band 7.0', start:{date:'2026-07-31'}, end:{date:'2026-07-31'}, colorId:'11', reminders:{useDefault:false,overrides:[{method:'popup',minutes:1440},{method:'popup',minutes:10080}]} } }); } catch {}
    },
  };

  /* ── 6. LIVE TICKER ──────────────────────────────────────── */
  const Ticker = {
    _iv:       null,
    _lastDate: '',

    start() {
      this._lastDate = Clock.dateStr();
      this._iv = setInterval(() => this._tick(), 1000);
      this._tick();
    },
    stop() { clearInterval(this._iv); },

    _tick() {
      const now = Clock.dateStr();
      if (now !== this._lastDate) {
        this._lastDate = now;
        document.dispatchEvent(new CustomEvent('routine:refresh'));
      }
      _upd('live-clock',     Clock.hhMM());
      _upd('live-date-full', Clock.now().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}));
      _upd('cnt-edx',   daysUntil(EDX_DATE)   + ' days');
      _upd('cnt-ielts', daysUntil(IELTS_DATE) + ' days');
      _upd('cnt-ou',    daysUntil(OUAPP_DATE) + ' days');
      _upd('edx-days',  String(daysUntil(EDX_DATE)));
      _upd('nb-edx',    daysUntil(EDX_DATE) + 'd edX');
      this._highlightNow();

      // Suggest phase switch if past IELTS date and still pre-IELTS
      if (Clock.now() > IELTS_DATE && Phase.isPreIelts() && !Phase.ieltsTaken()) {
        document.dispatchEvent(new CustomEvent('phase:suggest-switch'));
      }
    },

    _highlightNow() {
      const rows = document.querySelectorAll('.sched-row');
      if (!rows.length) return;
      const sched   = Routine.todaySchedule();
      const current = Clock.currentBlock(sched);
      rows.forEach((row, i) => {
        const isCur = current && sched[i] && sched[i].t === current.t;
        row.classList.toggle('sched-now', isCur);
        const existing = row.querySelector('.now-badge');
        if (isCur && !existing) {
          const b = document.createElement('span');
          b.className = 'now-badge'; b.textContent = '▶ NOW';
          row.querySelector('.sched-body')?.prepend(b);
        } else if (!isCur && existing) existing.remove();
      });
    },
  };

  function _upd(id, text) {
    const el = document.getElementById(id);
    if (el && el.textContent !== text) el.textContent = text;
  }

  /* ── 7. AUTO-SAVE ────────────────────────────────────────── */
  const AutoSave = {
    _t: null, _dirty: false,
    touch() {
      this._dirty = true;
      clearTimeout(this._t);
      this._t = setTimeout(() => this.flush(), 1800);
    },
    async flush() {
      if (!this._dirty) return;
      this._dirty = false;
      await Drive.save();
    },
    async now() { clearTimeout(this._t); this._dirty = false; await Drive.save(); },
  };

  /* ── 8. MILESTONE WATCHER ────────────────────────────────── */
  const MilestoneWatcher = {
    check() {
      const done = getMDone(); let changed = false;
      // Savings baseline (index 16) always done
      if (!done[16]) { done[16] = true; changed = true; }
      // IELTS (index 3) — auto if taken + score ≥ 7
      if (Phase.ieltsTaken() && (Phase.ieltsScore()||0) >= 7.0 && !done[3]) { done[3] = true; changed = true; }
      // 5k EUR (index 11)
      if (S.eur() >= 5000  && !done[11]) { done[11] = true; changed = true; }
      // 10k EUR (index 12)
      if (S.eur() >= 10000 && !done[12]) { done[12] = true; changed = true; }
      if (changed) { setMDone(done); AutoSave.touch(); document.dispatchEvent(new CustomEvent('milestones:updated')); }
    },
  };

  /* ── 9. WEB PUSH NOTIFICATIONS ───────────────────────────── */
  const Notifs = {
    supported() { return 'Notification' in window; },
    enabled()   { return localStorage.getItem('push_notifs') === 'true'; },
    async requestPermission() {
      if (!this.supported()) return false;
      const p = await Notification.requestPermission();
      const ok = p === 'granted';
      localStorage.setItem('push_notifs', String(ok));
      document.dispatchEvent(new CustomEvent('ui:refresh'));
      return ok;
    },
    send(title, body, opts = {}) {
      if (!this.supported() || Notification.permission !== 'granted') return;
      try { new Notification(title, { body, icon:'https://anwaydiptapaul.github.io/life-plan/icon.png', ...opts }); }
      catch {}
    },
    scheduleBlockReminder() {
      if (!this.enabled()) return;
      const nb = Routine.nextBlock();
      if (!nb) return;
      const parts = nb.t.split('–');
      if (!parts.length) return;
      const [h, m] = parts[0].split(':').map(Number);
      const now  = Clock.now();
      const next = new Date(now); next.setHours(h, m, 0, 0);
      if (next <= now) return;
      const msUntil = next - now - 5 * 60 * 1000; // 5 min before
      if (msUntil < 0) return;
      setTimeout(() => this.send('Sprint OS', `Starting in 5 min: ${nb.n}`, { tag:'block-reminder' }), msUntil);
    },
  };

  /* ── 10. CONFETTI ────────────────────────────────────────── */
  function fireConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = [...Array(120)].map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 6,
      color: ['#00e5a0','#ffb020','#ff4444','#4488ff','#aa66ff','#ff7722'][Math.floor(Math.random()*6)],
      rot: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 3,
      vy: 3 + Math.random() * 4,
      vr: (Math.random() - 0.5) * 0.2,
    }));
    let done = 0;
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = 0;
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.12;
        if (p.y < canvas.height + 20) {
          active++;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
          ctx.restore();
        }
      }
      if (active > 0 && done < 180) { done++; requestAnimationFrame(frame); }
      else canvas.remove();
    }
    requestAnimationFrame(frame);
  }

  /* ── 11. PWA INSTALL PROMPT ──────────────────────────────── */
  let _deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    _deferredPrompt = e;
    document.dispatchEvent(new CustomEvent('pwa:installable'));
  });

  /* ── 12. ROUTINE UPDATER ─────────────────────────────────── */
  const RoutineUpdater = {
    run() {
      const t = getTier();
      document.dispatchEvent(new CustomEvent('routine:tier', { detail: t }));
      if (Clock.isSaturday() && Phase.isPreIelts()) document.dispatchEvent(new CustomEvent('routine:saturday-mock'));
      if (daysUntil(EDX_DATE) <= 3) document.dispatchEvent(new CustomEvent('routine:edx-critical'));
      if (Clock.now().getDate() === 1 && S.monthly < 83000) document.dispatchEvent(new CustomEvent('routine:income-gap', { detail:{ gap: 83000 - S.monthly } }));
    },
  };

  /* ── 13. TOAST SYSTEM ────────────────────────────────────── */
  function _toast(id, html, type, duration) {
    if (document.getElementById(id)) return;
    const tc = document.getElementById('toast-container') || document.body;
    const t  = document.createElement('div');
    t.id = id; t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${html}</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
    tc.appendChild(t);
    if (duration > 0) setTimeout(() => t?.remove(), duration);
  }

  /* ── 14. PUBLIC API ──────────────────────────────────────── */
  return {
    Clock, Phase, Routine, Drive, Cal, Ticker, AutoSave, MilestoneWatcher, Notifs,

    async init() {
      // 1. Restore local state immediately (instant UI, no waiting)
      Drive.loadLocal();

      // 2. Auto-completions
      MilestoneWatcher.check();

      // 3. Start live clock
      Ticker.start();

      // 4. Routine logic
      RoutineUpdater.run();

      // 5. Schedule block notification (5min warning)
      if (Notifs.enabled()) Notifs.scheduleBlockReminder();

      // 6. Attempt Google API (non-blocking)
      this._tryGapi();

      // 7. Event listeners
      document.addEventListener('routine:refresh', () => {
        RoutineUpdater.run();
        MilestoneWatcher.check();
        document.dispatchEvent(new CustomEvent('ui:refresh'));
      });
      document.addEventListener('phase:suggest-switch', () => {
        _toast('phase-toast',
          '📅 IELTS date has passed. Did you take it? <a href="milestones.html#ielts-section" class="toast-link">Log score →</a>',
          'warn', 15000);
      });
      document.addEventListener('routine:saturday-mock', () => {
        _toast('sat-toast', '📝 Saturday — full 4-band IELTS mock test today.', 'info', 8000);
      });
      document.addEventListener('routine:edx-critical', () => {
        _toast('edx-toast', `⚠️ edX expires in <strong>${daysUntil(EDX_DATE)} days</strong> — open a lesson now.`, 'danger', 0);
      });
      document.addEventListener('pwa:installable', () => {
        _toast('pwa-toast',
          '📱 Install Sprint OS on your home screen? <a onclick="U.installPWA()" class="toast-link" style="cursor:pointer">Install →</a>',
          'info', 20000);
      });

      // Signal to all pages that init is complete
      document.dispatchEvent(new CustomEvent('ui:refresh'));
    },

    async _tryGapi() {
      try {
        if (typeof gapi === 'undefined') return;
        await Drive.initGapi();
        document.dispatchEvent(new CustomEvent('gapi:ready'));
      } catch (e) {
        console.info('Google API unavailable:', e.message || e);
      }
    },

    // ── Public methods ────────────────────────────────────────
    save() { AutoSave.touch(); },

    markIeltsTaken(score) {
      Phase.setIeltsTaken(score);
      MilestoneWatcher.check();
      if (score >= 7.0) {
        fireConfetti();
        Notifs.send('🎉 IELTS Passed!', `Band ${score} — OU application eligibility unlocked.`);
        _toast('ielts-pass-toast', `🎉 Band <strong>${score}</strong> — OU application now eligible! Renew Coursera next.`, 'ok', 0);
      }
      AutoSave.now();
      document.dispatchEvent(new CustomEvent('ui:refresh'));
      if (Cal.enabled() && Drive._signedIn) {
        gapi.client.calendar.events.insert({ calendarId:GAPI_CONFIG.calendarId, resource:{ summary:`✅ IELTS Score: ${score}`, start:{date:Clock.dateStr()}, end:{date:Clock.dateStr()}, colorId:'2' } }).catch(()=>{});
      }
    },

    updateSavings(bdt, monthly) {
      const prev = S.bdt;
      S.bdt = bdt;
      if (monthly !== undefined) S.monthly = monthly;
      addSavingsEntry(bdt, prev);
      MilestoneWatcher.check();
      AutoSave.touch();
      document.dispatchEvent(new CustomEvent('savings:updated', { detail:{ bdt, monthly } }));
    },

    toggleMilestone(idx) {
      if (MILESTONES[idx]?.type === 'done') return;
      const done = getMDone();
      done[idx] = !done[idx];
      setMDone(done);
      // Confetti on major milestones
      if (done[idx] && (MILESTONES[idx]?.pri || MILESTONES[idx]?.type === 'priority')) {
        fireConfetti();
        Notifs.send('Milestone reached!', MILESTONES[idx].t);
      }
      if (done[idx] && Cal.enabled() && Drive._signedIn) Cal.addMilestoneEvent(MILESTONES[idx]);
      AutoSave.touch();
      document.dispatchEvent(new CustomEvent('milestones:updated'));
    },

    toggleCourse(idx) {
      const flat = flatCourses();
      if (flat[idx]?.fixed || flat[idx]?.drop) return;
      const done = getCDone();
      done[idx] = !done[idx];
      setCDone(done);
      AutoSave.touch();
      document.dispatchEvent(new CustomEvent('courses:updated', { detail:{ idx } }));
    },

    toggleMathChapter(topicIdx, chapIdx) {
      const key = `${topicIdx}_${chapIdx}`;
      const d   = getMathDone();
      d[key]    = !d[key];
      setMathDone(d);
      AutoSave.touch();
      document.dispatchEvent(new CustomEvent('math:updated'));
    },

    toggleOUItem(id) {
      toggleOUItem(id);
      // Confetti when all done
      const d = getOUDone();
      if (OU_CHECKLIST.every(item => d[item.id])) {
        fireConfetti();
        _toast('ou-done-toast','🚀 OU Application Checklist complete! Submit now.','ok',0);
      }
      AutoSave.touch();
      document.dispatchEvent(new CustomEvent('ou:updated'));
    },

    async scheduleToday() {
      if (!Drive._signedIn) { _toast('cal-auth-toast','Sign in to Google to add events to Calendar.','warn',4000); return; }
      const n = await Cal.addTodaySchedule();
      _toast('cal-ok-toast', `✅ Added ${n} events to Google Calendar.`, 'ok', 4000);
    },

    async scheduleAllMilestones() {
      if (!Drive._signedIn) return;
      for (const m of MILESTONES) await Cal.addMilestoneEvent(m);
      await Cal.addEdxExpiry();
      await Cal.addIeltsExam();
      _toast('cal-all-toast', `✅ All milestone dates added to Google Calendar.`, 'ok', 5000);
    },

    async requestNotifications() {
      const ok = await Notifs.requestPermission();
      _toast('notif-toast', ok ? '✅ Notifications enabled.' : '❌ Permission denied.', ok ? 'ok' : 'danger', 4000);
    },

    async installPWA() {
      if (!_deferredPrompt) return;
      _deferredPrompt.prompt();
      const { outcome } = await _deferredPrompt.userChoice;
      _deferredPrompt = null;
      if (outcome === 'accepted') _toast('pwa-ok','✅ Sprint OS installed on home screen.','ok',4000);
    },

    fireConfetti,

    liveSummary() {
      return {
        greeting:      Routine.greeting(),
        dailyPriority: Routine.dailyPriority(),
        currentBlock:  Routine.currentBlock(),
        nextBlock:     Routine.nextBlock(),
        daysToEdx:     daysUntil(EDX_DATE),
        daysToIelts:   daysUntil(IELTS_DATE),
        daysToOuApp:   daysUntil(OUAPP_DATE),
        planMonth:     planMonth(),
        tier:          getTier(),
        savingsPct:    S.pct(),
        savingsEur:    S.eur(),
        mDone:         getMDone().filter(Boolean).length,
        mTotal:        MILESTONES.length,
        cDone:         getCDone().filter(Boolean).length,
        cTotal:        flatCourses().length,
        isPreIelts:    Phase.isPreIelts(),
        isSaturday:    Clock.isSaturday(),
        isSunday:      Clock.isSunday(),
        signedIn:      Drive._signedIn,
        notifEnabled:  Notifs.enabled(),
        notifSupported:Notifs.supported(),
      };
    },
  };
})();

/* ── INJECTED STYLES ──────────────────────────────────────── */
(function() {
  const s = document.createElement('style');
  s.textContent = `
    #toast-container{position:fixed;bottom:24px;right:24px;z-index:9000;display:flex;flex-direction:column;gap:8px;max-width:360px}
    .toast{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:12px 14px;border-radius:2px;border:1px solid;font-family:var(--font-mono,monospace);font-size:11px;line-height:1.6;animation:toast-in .25s ease;box-shadow:0 8px 24px rgba(0,0,0,.5)}
    @keyframes toast-in{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
    .toast-ok     {background:rgba(0,229,160,.08);border-color:rgba(0,229,160,.3);color:#80f0cc}
    .toast-warn   {background:rgba(255,176,32,.08);border-color:rgba(255,176,32,.3);color:#ffe090}
    .toast-danger {background:rgba(255,68,68,.08); border-color:rgba(255,68,68,.3); color:#ffaaaa}
    .toast-info   {background:rgba(68,136,255,.08);border-color:rgba(68,136,255,.3);color:#aaccff}
    .toast-close{background:none;border:none;color:inherit;cursor:pointer;font-size:11px;flex-shrink:0;opacity:.6;padding:0}
    .toast-close:hover{opacity:1}
    .toast-link{color:inherit;text-decoration:underline;cursor:pointer}
    .sync-status{font-size:9px;letter-spacing:.1em;text-transform:uppercase}
    .sync-saved{color:#00e5a0}.sync-local{color:#ffb020}.sync-loaded{color:#4488ff}
    .sched-now{background:rgba(0,229,160,.06)!important;border-color:rgba(0,229,160,.25)!important}
    .now-badge{display:inline-block;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:#00e5a0;border:1px solid rgba(0,229,160,.35);background:rgba(0,229,160,.1);padding:1px 6px;border-radius:2px;margin-bottom:4px;font-weight:600;animation:now-pulse 1.5s ease infinite}
    @keyframes now-pulse{0%,100%{opacity:1}50%{opacity:.4}}
    .gapi-btn{display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:2px;border:1px solid var(--border2,#263040);background:var(--bg2,#111620);font-family:var(--font-mono,monospace);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text3,#4a5878);cursor:pointer;transition:all .15s}
    .gapi-btn:hover{border-color:var(--border3,#2e3a50);color:var(--text,#c8d4e8)}
    .gapi-btn.signed-in{border-color:rgba(0,229,160,.35);color:#00e5a0}
  `;
  document.head.appendChild(s);

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('toast-container')) {
      const tc = document.createElement('div');
      tc.id = 'toast-container';
      document.body.appendChild(tc);
    }
  });

  // Guaranteed init: fire U.init() on DOMContentLoaded regardless of gapi
  document.addEventListener('DOMContentLoaded', () => {
    // Small delay to let gapi.js attempt load, then init regardless
    setTimeout(() => {
      if (window.U && typeof window.U.init === 'function') {
        window.U.init().catch(() => {});
        window._sprintInitDone = true;
      }
    }, 300);
  });
})();
