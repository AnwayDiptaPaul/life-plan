/* ═══════════════════════════════════════════════════════════
   SPRINT OS — update.js
   Real-time routine updates driven by device clock + date.
   Google Drive (gapi) for persistent state backup.
   Google Calendar for scheduling study/work events.
═══════════════════════════════════════════════════════════ */

// ── GOOGLE API CONFIGURATION ────────────────────────────────
// To enable: create a Google Cloud project, enable Drive + Calendar APIs,
// add OAuth 2.0 credentials, and replace the values below.
// Scopes needed:
//   https://www.googleapis.com/auth/drive.appdata
//   https://www.googleapis.com/auth/calendar.events
const GAPI_CONFIG = {
  clientId:     'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  apiKey:       'YOUR_GOOGLE_API_KEY',
  discoveryDocs: [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  ],
  scopes: [
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/calendar.events',
  ].join(' '),
  driveFileName: 'sprint-os-state.json',
  calendarId:    'primary',
};

// ── STATE FILE SCHEMA (stored in Drive appdata folder) ──────
// {
//   version:    1,
//   savedAt:    ISO-string,
//   savings: { bdt: number, monthly: number },
//   milestones: boolean[],   // parallel to MILESTONES array
//   courses:    boolean[],   // parallel to flatCourses()
//   preIelts:   boolean,
//   ieltsTaken: boolean,
//   ieltsTakenDate: string | null,
//   ieltsScore: number | null,
//   settings: {
//     addEventsToCalendar: boolean,
//     calendarReminders: boolean,
//   }
// }

// ═══════════════════════════════════════════════════════════
//  UPDATE ENGINE — runs on every page, exports window.U
// ═══════════════════════════════════════════════════════════
window.U = (function () {

  // ── 1. DEVICE CLOCK ──────────────────────────────────────
  const Clock = {
    now()    { return new Date(); },
    hour()   { return this.now().getHours(); },
    minute() { return this.now().getMinutes(); },
    dow()    { return this.now().getDay(); },        // 0=Sun … 6=Sat
    date()   { return this.now().toDateString(); },
    iso()    { return this.now().toISOString(); },
    weekNum() {
      const d = this.now();
      const jan1 = new Date(d.getFullYear(), 0, 1);
      return Math.ceil(((d - jan1) / 864e5 + jan1.getDay() + 1) / 7);
    },
    isWeekend() { const d = this.dow(); return d === 0 || d === 6; },
    isSaturday() { return this.dow() === 6; },
    isSunday()   { return this.dow() === 0; },
    // Returns e.g. "06:30" for current time
    hhMM() {
      const h = String(this.hour()).padStart(2,'0');
      const m = String(this.minute()).padStart(2,'0');
      return `${h}:${m}`;
    },
    // Which time block are we in right now?
    currentBlock(schedule) {
      const now = this.hour() * 60 + this.minute();
      for (const row of schedule) {
        const [startStr, endStr] = row.t.split('–');
        const toMins = s => {
          const [h, m] = s.split(':').map(Number);
          return h * 60 + (m || 0);
        };
        let start = toMins(startStr);
        let end   = toMins(endStr);
        // Handle overnight (sleep)
        if (end < start) { if (now >= start || now < end) return row; }
        else              { if (now >= start && now < end) return row; }
      }
      return null;
    },
  };

  // ── 2. DATE-DRIVEN PHASE DETECTION ───────────────────────
  const Phase = {
    // Detect pre/post IELTS from localStorage (user sets when they take exam)
    isPreIelts() {
      return localStorage.getItem('pre_ielts') !== 'false';
    },
    setIeltsTaken(score) {
      localStorage.setItem('pre_ielts',         'false');
      localStorage.setItem('ielts_taken',        'true');
      localStorage.setItem('ielts_taken_date',   Clock.iso());
      localStorage.setItem('ielts_score',        String(score));
    },
    ieltsTaken()     { return localStorage.getItem('ielts_taken') === 'true'; },
    ieltsScore()     { return parseFloat(localStorage.getItem('ielts_score')) || null; },
    ieltsTakenDate() { return localStorage.getItem('ielts_taken_date') || null; },

    // Plan month (1–18, auto from device date)
    planMonth() { return planMonth(); }, // from data.js
    // Days since plan start
    daysSinceStart() { return Math.floor((Clock.now() - D.start) / 864e5); },
    // Are we in a Monday–Friday work window?
    isWorkday() { const d = Clock.dow(); return d >= 1 && d <= 5; },
    // What week of the plan is it?
    planWeek() { return Math.max(1, Math.ceil(this.daysSinceStart() / 7)); },
  };

  // ── 3. ROUTINE RESOLVER ───────────────────────────────────
  // Returns the correct schedule for right now, auto-detected from device.
  const Routine = {
    // hasOrder: persisted per-day (resets at midnight)
    todayKey() { return 'order_day_' + Clock.date(); },
    hasOrder()  { return localStorage.getItem(this.todayKey()) !== 'false'; },
    setOrder(v) { localStorage.setItem(this.todayKey(), String(v)); },

    // Full resolved schedule for today
    todaySchedule() {
      return buildSchedule(
        this.hasOrder(),
        Phase.isPreIelts(),
        getTier()
      );
    },
    // Current block (what should you be doing RIGHT NOW)
    currentBlock() {
      return Clock.currentBlock(this.todaySchedule());
    },
    // Next block
    nextBlock() {
      const sched = this.todaySchedule();
      const now   = Clock.hour() * 60 + Clock.minute();
      const toMins = s => { const [h, m] = s.split(':').map(Number); return h * 60 + (m || 0); };
      for (let i = 0; i < sched.length; i++) {
        const [, endStr] = sched[i].t.split('–');
        if (now < toMins(endStr)) return sched[i + 1] || null;
      }
      return sched[0] || null;
    },
    // Days until IELTS exam
    daysToIelts()  { return daysUntil(D.ielts); },
    daysToEdx()    { return daysUntil(D.edx); },
    daysToOuApp()  { return daysUntil(D.ouApp); },

    // Auto-updated greeting
    greeting() {
      const h = Clock.hour();
      if (h < 5)  return 'Still up late, Anway?';
      if (h < 12) return 'Good morning, Anway.';
      if (h < 17) return 'Good afternoon, Anway.';
      if (h < 21) return 'Good evening, Anway.';
      return 'Late session, Anway.';
    },
    // Daily priority message driven by date
    dailyPriority() {
      if (this.daysToEdx() <= 7)  return '⚠️ edX expires in ' + this.daysToEdx() + ' days — open a lesson now.';
      if (Phase.isPreIelts())      return '🎯 IELTS exam in ' + this.daysToIelts() + ' days — every session counts.';
      return '📐 Post-IELTS: push courses + math daily.';
    },
  };

  // ── 4. GOOGLE DRIVE SYNC ──────────────────────────────────
  const Drive = {
    _loaded: false,
    _fileId: null,
    _signedIn: false,

    // Snapshot of full app state
    buildSnapshot() {
      return {
        version:       1,
        savedAt:       Clock.iso(),
        savings:       { bdt: S.bdt, monthly: S.monthly },
        milestones:    getMDone(),
        courses:       getCDone(),
        preIelts:      Phase.isPreIelts(),
        ieltsTaken:    Phase.ieltsTaken(),
        ieltsTakenDate:Phase.ieltsTakenDate(),
        ieltsScore:    Phase.ieltsScore(),
        settings: {
          addEventsToCalendar: localStorage.getItem('cal_events') !== 'false',
          calendarReminders:   localStorage.getItem('cal_reminders') !== 'false',
        },
      };
    },

    // Apply a loaded snapshot back to localStorage
    applySnapshot(snap) {
      if (!snap || snap.version !== 1) return;
      S.bdt     = snap.savings?.bdt     ?? S.bdt;
      S.monthly = snap.savings?.monthly ?? S.monthly;
      S.save();
      if (snap.milestones) setMDone(snap.milestones);
      if (snap.courses)    setCDone(snap.courses);
      if (snap.preIelts  !== undefined) localStorage.setItem('pre_ielts',      String(snap.preIelts));
      if (snap.ieltsTaken !== undefined){
        localStorage.setItem('ielts_taken',      String(snap.ieltsTaken));
        if (snap.ieltsTakenDate) localStorage.setItem('ielts_taken_date', snap.ieltsTakenDate);
        if (snap.ieltsScore != null) localStorage.setItem('ielts_score',  String(snap.ieltsScore));
      }
      if (snap.settings) {
        localStorage.setItem('cal_events',    String(snap.settings.addEventsToCalendar));
        localStorage.setItem('cal_reminders', String(snap.settings.calendarReminders));
      }
    },

    // ── Google API init ─────────────────────────────────────
    async initGapi() {
      return new Promise((resolve, reject) => {
        if (typeof gapi === 'undefined') { reject(new Error('gapi not loaded')); return; }
        gapi.load('client:auth2', async () => {
          try {
            await gapi.client.init({
              apiKey:       GAPI_CONFIG.apiKey,
              clientId:     GAPI_CONFIG.clientId,
              discoveryDocs:GAPI_CONFIG.discoveryDocs,
              scope:        GAPI_CONFIG.scopes,
            });
            gapi.auth2.getAuthInstance().isSignedIn.listen(v => this._onSignInChange(v));
            this._onSignInChange(gapi.auth2.getAuthInstance().isSignedIn.get());
            this._loaded = true;
            resolve();
          } catch (e) { reject(e); }
        });
      });
    },

    _onSignInChange(isSignedIn) {
      this._signedIn = isSignedIn;
      document.dispatchEvent(new CustomEvent('gapi:auth', { detail: { isSignedIn } }));
      if (isSignedIn) this.load();
    },

    signIn()  { if (gapi?.auth2) gapi.auth2.getAuthInstance().signIn(); },
    signOut() { if (gapi?.auth2) gapi.auth2.getAuthInstance().signOut(); },
    isSignedIn() { return this._signedIn; },

    // ── Find or create the state file in Drive appdata ──────
    async _findOrCreate() {
      if (this._fileId) return this._fileId;
      const resp = await gapi.client.drive.files.list({
        spaces: 'appDataFolder',
        q: `name='${GAPI_CONFIG.driveFileName}'`,
        fields: 'files(id)',
      });
      if (resp.result.files.length > 0) {
        this._fileId = resp.result.files[0].id;
      } else {
        const create = await gapi.client.drive.files.create({
          resource: { name: GAPI_CONFIG.driveFileName, parents: ['appDataFolder'] },
          fields: 'id',
        });
        this._fileId = create.result.id;
      }
      return this._fileId;
    },

    // ── Save state to Drive ──────────────────────────────────
    async save() {
      if (!this._signedIn) { this._saveLocal(); return; }
      try {
        const fileId  = await this._findOrCreate();
        const content = JSON.stringify(this.buildSnapshot(), null, 2);
        await gapi.client.request({
          path:   `https://www.googleapis.com/upload/drive/v3/files/${fileId}`,
          method: 'PATCH',
          params: { uploadType: 'media' },
          headers: { 'Content-Type': 'application/json' },
          body:   content,
        });
        this._setStatus('saved', 'Saved to Google Drive · ' + new Date().toLocaleTimeString());
      } catch (e) {
        console.warn('Drive save failed, falling back to localStorage:', e);
        this._saveLocal();
      }
    },

    // ── Load state from Drive ────────────────────────────────
    async load() {
      if (!this._signedIn) { return; }
      try {
        const fileId = await this._findOrCreate();
        const resp   = await gapi.client.drive.files.get({
          fileId, alt: 'media',
        });
        const snap = typeof resp.result === 'string' ? JSON.parse(resp.result) : resp.result;
        this.applySnapshot(snap);
        document.dispatchEvent(new CustomEvent('state:loaded'));
        this._setStatus('loaded', 'Loaded from Google Drive · ' + new Date().toLocaleTimeString());
      } catch (e) {
        console.warn('Drive load failed:', e);
      }
    },

    // ── localStorage fallback ────────────────────────────────
    _saveLocal() {
      localStorage.setItem('sprint_snapshot', JSON.stringify(this.buildSnapshot()));
      this._setStatus('local', 'Saved locally (not signed in)');
    },
    loadLocal() {
      try {
        const raw = localStorage.getItem('sprint_snapshot');
        if (raw) this.applySnapshot(JSON.parse(raw));
      } catch {}
    },

    _setStatus(type, msg) {
      document.dispatchEvent(new CustomEvent('sync:status', { detail: { type, msg } }));
      const el = document.getElementById('sync-status');
      if (el) {
        el.textContent = msg;
        el.className   = 'sync-status sync-' + type;
      }
    },
  };

  // ── 5. GOOGLE CALENDAR INTEGRATION ───────────────────────
  const Cal = {
    enabled() { return localStorage.getItem('cal_events') !== 'false'; },
    reminders() { return localStorage.getItem('cal_reminders') !== 'false'; },

    // Build a calendar event from a schedule block
    _buildEvent(block, date) {
      const [startStr, endStr] = block.t.split('–');
      const toISO = (timeStr, d) => {
        const [h, m] = timeStr.split(':').map(Number);
        const dt = new Date(d);
        dt.setHours(h, m, 0, 0);
        // Handle overnight end (22:00–06:00)
        if (endStr === '06:00' && h >= 22) dt.setDate(dt.getDate() + 1);
        return dt.toISOString();
      };
      const colorMap = {
        ielts:  '11', // Tomato
        math:   '2',  // Sage
        work:   '6',  // Tangerine
        study:  '9',  // Blueberry
        thesis: '3',  // Grape
        life:   '5',  // Banana
        rest:   '8',  // Graphite
      };
      const reminders = this.reminders()
        ? { useDefault: false, overrides: [{ method: 'popup', minutes: 5 }] }
        : { useDefault: false, overrides: [] };
      return {
        summary:     block.n,
        description: block.d,
        start:       { dateTime: toISO(startStr, date), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end:         { dateTime: toISO(endStr,   date), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        colorId:     colorMap[block.tag] || '8',
        reminders,
        extendedProperties: { private: { source: 'sprint-os', tag: block.tag } },
      };
    },

    // Add today's full schedule to Calendar (skips already-added)
    async addTodaySchedule() {
      if (!Drive._signedIn || !this.enabled()) return;
      const today    = Clock.now();
      const schedule = Routine.todaySchedule();
      // Filter out rest/sleep (optional — user can change this)
      const toAdd = schedule.filter(b => b.tag !== 'rest');
      let added = 0;
      for (const block of toAdd) {
        try {
          await gapi.client.calendar.events.insert({
            calendarId: GAPI_CONFIG.calendarId,
            resource:   this._buildEvent(block, today),
          });
          added++;
        } catch (e) {
          console.warn(`Failed to add event "${block.n}":`, e);
        }
      }
      return added;
    },

    // Add a single milestone deadline as a Calendar event
    async addMilestoneEvent(milestone) {
      if (!Drive._signedIn || !this.enabled()) return;
      // Parse horizon string to a rough date
      const horizonDate = this._parseHorizon(milestone.h);
      if (!horizonDate) return;
      try {
        await gapi.client.calendar.events.insert({
          calendarId: GAPI_CONFIG.calendarId,
          resource: {
            summary:     '🎯 ' + milestone.t,
            description: milestone.s,
            start:       { date: horizonDate },
            end:         { date: horizonDate },
            colorId:     milestone.type === 'urgent' ? '11' : '5',
            reminders:   this.reminders()
              ? { useDefault: false, overrides: [{ method: 'popup', minutes: 1440 }] }
              : { useDefault: false },
          },
        });
      } catch (e) { console.warn('Cal event add failed:', e); }
    },

    // Add IELTS exam date
    async addIeltsExam() {
      if (!Drive._signedIn || !this.enabled()) return;
      try {
        await gapi.client.calendar.events.insert({
          calendarId: GAPI_CONFIG.calendarId,
          resource: {
            summary:     '📝 IELTS Exam — Target Band 7.0',
            description: 'IELTS Academic exam. Target: Band 7.0. Unlocks OU MPhys application eligibility.',
            start:       { date: '2026-07-31' },
            end:         { date: '2026-07-31' },
            colorId:     '11',
            reminders:   { useDefault: false, overrides: [
              { method: 'popup',  minutes: 1440 },
              { method: 'popup',  minutes: 10080 },
            ]},
          },
        });
      } catch (e) { console.warn('IELTS cal event failed:', e); }
    },

    // Add edX expiry reminder
    async addEdxExpiry() {
      if (!Drive._signedIn || !this.enabled()) return;
      try {
        await gapi.client.calendar.events.insert({
          calendarId: GAPI_CONFIG.calendarId,
          resource: {
            summary:     '⚠️ edX Courses Expire — Last Day',
            description: 'Agentic AI + AI for Everyone (IBM) expire today on edX.',
            start:       { date: '2026-06-26' },
            end:         { date: '2026-06-26' },
            colorId:     '11',
            reminders:   { useDefault: false, overrides: [
              { method: 'popup', minutes: 1440 },
              { method: 'popup', minutes: 2880 },
            ]},
          },
        });
      } catch (e) { console.warn('edX cal event failed:', e); }
    },

    _parseHorizon(h) {
      // Map horizon strings to approximate ISO dates
      const map = {
        'TODAY':            new Date().toISOString().slice(0, 10),
        'Before Jun 26':    '2026-06-25',
        'Jun 2026':         '2026-06-30',
        'Jul 2026':         '2026-07-31',
        'Aug 2026':         '2026-08-31',
        'Oct–Nov 2026':     '2026-10-31',
        'Dec 2026–Jan 2027':'2026-12-31',
        'Feb–Mar 2027':     '2027-02-28',
        'Mar–Apr 2027':     '2027-03-31',
        'Jun–Jul 2027':     '2027-06-30',
        'Jul 2027':         '2027-07-31',
        'Jan 2027':         '2027-01-31',
        'Aug–Sep 2027':     '2027-08-31',
        'Sep 2027':         '2027-09-30',
        'Sep–Nov 2027':     '2027-09-30',
        '2028':             '2028-02-01',
        'Done ✓':           null,
      };
      return map[h] || null;
    },
  };

  // ── 6. LIVE CLOCK TICKER ──────────────────────────────────
  // Updates the "now" indicator and live countdown chips every second
  const Ticker = {
    _interval: null,
    _lastDate: Clock.date(),

    start() {
      this._interval = setInterval(() => this._tick(), 1000);
      this._tick(); // immediate first run
    },
    stop() { clearInterval(this._interval); },

    _tick() {
      // Midnight rollover — trigger a full routine refresh
      if (Clock.date() !== this._lastDate) {
        this._lastDate = Clock.date();
        document.dispatchEvent(new CustomEvent('routine:refresh'));
      }

      // Update live clock elements
      this._updateEl('live-clock',  Clock.hhMM());
      this._updateEl('live-date-full', Clock.now().toLocaleDateString('en-GB',
        { weekday:'long', day:'numeric', month:'long', year:'numeric' }));

      // Update countdown chips
      const edxD  = daysUntil(D.edx);
      const ieltsD = daysUntil(D.ielts);
      const ouD   = daysUntil(D.ouApp);
      this._updateEl('cnt-edx',   edxD  + ' days');
      this._updateEl('cnt-ielts', ieltsD + ' days');
      this._updateEl('cnt-ou',    ouD   + ' days');
      this._updateEl('edx-days',  String(edxD));
      this._updateEl('nb-edx',    edxD + 'd edX');

      // "Now" indicator on schedule — highlight current block
      this._highlightCurrentBlock();

      // Phase auto-detect from date (not yet taken)
      // If device date is past 2026-08-01 and user hasn't manually set,
      // suggest switching to post-IELTS mode
      if (Clock.now() > D.ielts && Phase.isPreIelts() && !Phase.ieltsTaken()) {
        document.dispatchEvent(new CustomEvent('phase:suggest-switch'));
      }
    },

    _updateEl(id, text) {
      const el = document.getElementById(id);
      if (el && el.textContent !== text) el.textContent = text;
    },

    _highlightCurrentBlock() {
      const rows = document.querySelectorAll('.sched-row');
      if (!rows.length) return;
      const sched  = Routine.todaySchedule();
      const current = Clock.currentBlock(sched);
      rows.forEach((row, i) => {
        if (sched[i] && current && sched[i].t === current.t) {
          row.classList.add('sched-now');
          if (!row.querySelector('.now-badge')) {
            const badge = document.createElement('span');
            badge.className = 'now-badge';
            badge.textContent = '▶ NOW';
            row.querySelector('.sched-body')?.prepend(badge);
          }
        } else {
          row.classList.remove('sched-now');
          row.querySelector('.now-badge')?.remove();
        }
      });
    },
  };

  // ── 7. AUTO-SAVE MANAGER ─────────────────────────────────
  // Debounced save triggered on any state mutation
  const AutoSave = {
    _timer: null,
    _dirty: false,

    touch() {
      this._dirty = true;
      clearTimeout(this._timer);
      this._timer = setTimeout(() => this.flush(), 2000); // 2s debounce
    },

    async flush() {
      if (!this._dirty) return;
      this._dirty = false;
      await Drive.save();
    },

    // Force immediate save
    async now() {
      clearTimeout(this._timer);
      this._dirty = false;
      await Drive.save();
    },
  };

  // ── 8. DAILY ROUTINE UPDATER ─────────────────────────────
  // Called on every page load and at midnight
  const RoutineUpdater = {
    run() {
      // Determine current phase from device date
      const now = Clock.now();

      // Auto-suggest Saturday mock test
      if (Clock.isSaturday() && Phase.isPreIelts()) {
        document.dispatchEvent(new CustomEvent('routine:saturday-mock'));
      }

      // Auto-warn if edX is within 3 days
      if (daysUntil(D.edx) <= 3) {
        document.dispatchEvent(new CustomEvent('routine:edx-critical'));
      }

      // Push pace tier update notification
      const tier = getTier();
      document.dispatchEvent(new CustomEvent('routine:tier', { detail: tier }));

      // Monthly savings pace check (run on 1st of each month)
      if (now.getDate() === 1) {
        const gap = Math.max(0, 83000 - S.monthly);
        if (gap > 0) document.dispatchEvent(new CustomEvent('routine:income-gap', { detail: { gap } }));
      }
    },
  };

  // ── 9. MILESTONE AUTO-COMPLETION CHECK ───────────────────
  // Checks if time-based milestones should be marked automatically
  const MilestoneWatcher = {
    check() {
      const done = getMDone();
      let changed = false;

      // Milestone 16 (index 16): "Savings baseline" — always done
      if (!done[16]) { done[16] = true; changed = true; }

      // If IELTS taken and score ≥ 7.0, auto-complete milestone 3 (IELTS exam)
      if (Phase.ieltsTaken() && (Phase.ieltsScore() || 0) >= 7.0 && !done[3]) {
        done[3] = true; changed = true;
      }

      // If savings ≥ 5000 EUR, auto-complete savings milestone (index 11)
      if (S.eur() >= 5000 && !done[11]) { done[11] = true; changed = true; }
      // If savings ≥ 10000 EUR, auto-complete full savings milestone (index 12)
      if (S.eur() >= 10000 && !done[12]) { done[12] = true; changed = true; }

      if (changed) {
        setMDone(done);
        AutoSave.touch();
        document.dispatchEvent(new CustomEvent('milestones:updated'));
      }
    },
  };

  // ── 10. PUBLIC API ────────────────────────────────────────
  return {
    // Expose sub-modules
    Clock,
    Phase,
    Routine,
    Drive,
    Cal,
    Ticker,
    AutoSave,
    RoutineUpdater,
    MilestoneWatcher,

    // ── Bootstrap — call once on each page ──────────────────
    async init() {
      // 1. Load local fallback immediately (instant UI)
      Drive.loadLocal();

      // 2. Run milestone watchers
      MilestoneWatcher.check();

      // 3. Start live clock
      Ticker.start();

      // 4. Run routine logic
      RoutineUpdater.run();

      // 5. Try Google API (non-blocking — UI works without it)
      this._initGapi();

      // 6. Listen for midnight routine refresh
      document.addEventListener('routine:refresh', () => {
        RoutineUpdater.run();
        MilestoneWatcher.check();
        document.dispatchEvent(new CustomEvent('ui:refresh'));
      });

      // 7. Listen for IELTS phase-switch suggestion
      document.addEventListener('phase:suggest-switch', () => {
        if (document.getElementById('phase-switch-toast')) return;
        this._showToast(
          'phase-switch-toast',
          '📅 IELTS exam date has passed — did you take it? <a href="milestones.html#ielts-status" class="toast-link">Update status</a>',
          'warn', 12000
        );
      });

      // 8. Saturday mock test reminder
      document.addEventListener('routine:saturday-mock', () => {
        this._showToast('sat-mock-toast',
          '📝 Saturday — full 4-band IELTS mock test today. Have you scheduled it?',
          'info', 8000);
      });

      // 9. edX critical warning
      document.addEventListener('routine:edx-critical', () => {
        this._showToast('edx-crit-toast',
          `⚠️ edX expires in <strong>${daysUntil(D.edx)} days</strong> — open a lesson immediately.`,
          'danger', 0);
      });
    },

    async _initGapi() {
      try {
        // Only init if the gapi script is present on the page
        if (typeof gapi === 'undefined') return;
        await Drive.initGapi();
        document.dispatchEvent(new CustomEvent('gapi:ready'));
      } catch (e) {
        console.info('Google API not configured or unavailable:', e.message);
      }
    },

    // ── Trigger a full save (call after any state mutation) ──
    save() { AutoSave.touch(); },

    // ── Mark IELTS as taken ──────────────────────────────────
    markIeltsTaken(score) {
      Phase.setIeltsTaken(score);
      MilestoneWatcher.check();
      AutoSave.now();
      document.dispatchEvent(new CustomEvent('ui:refresh'));
      // Add "Well done" Calendar event
      if (Cal.enabled() && Drive._signedIn) {
        gapi.client.calendar.events.insert({
          calendarId: GAPI_CONFIG.calendarId,
          resource: {
            summary:  `✅ IELTS Taken — Score: ${score}`,
            start:    { date: Clock.iso().slice(0, 10) },
            end:      { date: Clock.iso().slice(0, 10) },
            colorId:  '2',
          },
        }).catch(() => {});
      }
    },

    // ── Update savings ───────────────────────────────────────
    updateSavings(bdt, monthly) {
      S.bdt     = bdt;
      S.monthly = monthly;
      S.save();
      MilestoneWatcher.check();
      AutoSave.touch();
      document.dispatchEvent(new CustomEvent('savings:updated', { detail: { bdt, monthly } }));
    },

    // ── Toggle a milestone ───────────────────────────────────
    toggleMilestone(idx) {
      const done = getMDone();
      if (MILESTONES[idx]?.type === 'done') return;
      done[idx] = !done[idx];
      setMDone(done);
      // If milestone has a horizon date, add to calendar
      if (done[idx] && Cal.enabled() && Drive._signedIn) {
        Cal.addMilestoneEvent(MILESTONES[idx]).catch(() => {});
      }
      AutoSave.touch();
      document.dispatchEvent(new CustomEvent('milestones:updated'));
    },

    // ── Toggle a course ──────────────────────────────────────
    toggleCourse(idx) {
      const flat = flatCourses();
      if (flat[idx]?.fixed) return;
      const done = getCDone();
      done[idx] = !done[idx];
      setCDone(done);
      AutoSave.touch();
      document.dispatchEvent(new CustomEvent('courses:updated', { detail: { idx } }));
    },

    // ── Add today's schedule to Google Calendar ──────────────
    async scheduleToday() {
      if (!Drive._signedIn) {
        this._showToast('cal-toast', 'Sign in to Google to add events to Calendar.', 'warn', 4000);
        return;
      }
      const count = await Cal.addTodaySchedule();
      this._showToast('cal-toast', `✅ Added ${count} events to Google Calendar.`, 'ok', 4000);
    },

    // ── Add all milestone deadlines to Calendar ──────────────
    async scheduleAllMilestones() {
      if (!Drive._signedIn) return;
      let added = 0;
      for (const m of MILESTONES) {
        await Cal.addMilestoneEvent(m).catch(() => {});
        added++;
      }
      await Cal.addIeltsExam().catch(() => {});
      await Cal.addEdxExpiry().catch(() => {});
      this._showToast('cal-all-toast', `✅ Added ${added + 2} milestone events to Google Calendar.`, 'ok', 5000);
    },

    // ── Toast notification ───────────────────────────────────
    _showToast(id, html, type, duration) {
      if (document.getElementById(id)) return;
      const t = document.createElement('div');
      t.id        = id;
      t.className = `toast toast-${type}`;
      t.innerHTML = `<span>${html}</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
      document.getElementById('toast-container')?.appendChild(t) ||
        document.body.appendChild(t);
      if (duration > 0) setTimeout(() => t.remove(), duration);
    },

    // ── Returns live summary for the dashboard ───────────────
    liveSummary() {
      return {
        greeting:        Routine.greeting(),
        dailyPriority:   Routine.dailyPriority(),
        currentBlock:    Routine.currentBlock(),
        nextBlock:       Routine.nextBlock(),
        daysToEdx:       Routine.daysToEdx(),
        daysToIelts:     Routine.daysToIelts(),
        daysToOuApp:     Routine.daysToOuApp(),
        planMonth:       Phase.planMonth(),
        tier:            getTier(),
        savingsPct:      S.pct(),
        savingsEur:      S.eur(),
        mDone:           getMDone().filter(Boolean).length,
        mTotal:          MILESTONES.length,
        cDone:           getCDone().filter(Boolean).length,
        cTotal:          flatCourses().length,
        isPreIelts:      Phase.isPreIelts(),
        isWeekend:       Clock.isWeekend(),
        isSaturday:      Clock.isSaturday(),
        signedIn:        Drive._signedIn,
      };
    },
  };
})();

/* ═══════════════════════════════════════════════════════════
   TOAST STYLES (injected at runtime, no extra CSS file needed)
═══════════════════════════════════════════════════════════ */
(function injectToastStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #toast-container { position:fixed; bottom:24px; right:24px; z-index:9000; display:flex; flex-direction:column; gap:8px; max-width:340px; }
    .toast {
      display:flex; align-items:flex-start; justify-content:space-between; gap:10px;
      padding:12px 14px; border-radius:2px; border:1px solid;
      font-family:var(--font-mono); font-size:11px; line-height:1.6;
      animation: toast-in .25s ease;
      box-shadow: 0 8px 24px rgba(0,0,0,.5);
    }
    @keyframes toast-in { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:none} }
    .toast-ok      { background:rgba(0,229,160,.08); border-color:rgba(0,229,160,.3); color:#80f0cc; }
    .toast-warn    { background:rgba(255,176,32,.08); border-color:rgba(255,176,32,.3); color:#ffe090; }
    .toast-danger  { background:rgba(255,68,68,.08);  border-color:rgba(255,68,68,.3);  color:#ffaaaa; }
    .toast-info    { background:rgba(68,136,255,.08); border-color:rgba(68,136,255,.3); color:#aaccff; }
    .toast-close { background:none; border:none; color:inherit; cursor:pointer; font-size:11px; flex-shrink:0; opacity:.6; padding:0; }
    .toast-close:hover { opacity:1; }
    .toast-link { color:inherit; text-decoration:underline; }
    .sync-status { font-size:9px; letter-spacing:.1em; text-transform:uppercase; color:var(--text3); }
    .sync-saved  { color:var(--green); }
    .sync-local  { color:var(--amber); }
    .sync-loaded { color:var(--blue); }
    .sched-now { background:rgba(0,229,160,.06) !important; border-color:rgba(0,229,160,.25) !important; }
    .now-badge {
      display:inline-block; font-size:8px; letter-spacing:.12em; text-transform:uppercase;
      color:var(--green); border:1px solid rgba(0,229,160,.35); background:rgba(0,229,160,.1);
      padding:1px 6px; border-radius:2px; margin-bottom:4px; font-weight:600;
      animation:now-pulse 1.5s ease infinite;
    }
    @keyframes now-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
    /* Google sign-in button */
    .gapi-btn {
      display:flex; align-items:center; gap:8px;
      padding:8px 14px; border-radius:2px;
      border:1px solid var(--border2); background:var(--bg2);
      font-family:var(--font-mono); font-size:10px; letter-spacing:.1em; text-transform:uppercase;
      color:var(--text3); cursor:pointer; transition:all .15s;
    }
    .gapi-btn:hover { border-color:var(--border3); color:var(--text); }
    .gapi-btn.signed-in { border-color:rgba(0,229,160,.35); color:var(--green); }
    .gapi-btn.signed-in:hover { background:rgba(0,229,160,.08); }
  `;
  document.head.appendChild(style);
  // Inject toast container
  document.addEventListener('DOMContentLoaded', () => {
    const tc = document.createElement('div');
    tc.id = 'toast-container';
    document.body.appendChild(tc);
  });
})();
