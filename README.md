# Sprint OS · v2

**Anway's 18-month personal command center for OU MPhys admission.**

A fully static, multi-page GitHub Pages site. No framework, no build step, no backend. Works offline as a PWA. Optionally syncs all state to Google Drive and creates Google Calendar events.

Live site: **https://anwaydiptapaul.github.io/life-plan/**

---

## Pages

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `index.html` | Live clock, NOW/NEXT block, countdowns, stats, IELTS logger |
| Daily | `daily.html` | Today's schedule — order/free + pre/post-IELTS toggles + live ▶ NOW |
| Courses | `courses.html` | Full course checklist — 4 platform accordions, ~70 courses |
| Milestones | `milestones.html` | Progress rings, IELTS logger, OU checklist, milestone list |
| Savings | `savings.html` | Arc gauge, savings chart, income log, ETA calculator, scenarios |
| Roadmap | `roadmap.html` | 18-month timeline, month table, period accordions + goal cards |
| Habits | `habits.html` | Daily habit tracker, 84-day heatmap, IELTS mock score log |
| Review | `review.html` | Weekly review form + log, Math/Physics chapter tracker |

---

## File Structure

```
sprint-os/
├── index.html          ← Dashboard
├── daily.html          ← Daily schedule
├── courses.html        ← Course checklist
├── milestones.html     ← Milestone tracker + OU checklist
├── savings.html        ← Savings tracker + income log
├── roadmap.html        ← 18-month roadmap
├── habits.html         ← Habit tracker + mock score log
├── review.html         ← Weekly review + math progress
├── 404.html            ← Offline / not found fallback
├── generate-icons.html ← Open in browser to create PNG icons
├── style.css           ← Complete design system (all components)
├── data.js             ← All data + schedule builder + shared utilities
├── update.js           ← Real-time engine (window.U) + Google sync
├── sw.js               ← Service worker (PWA offline + push)
├── sw-register.js      ← SW registration snippet
├── manifest.json       ← PWA manifest
├── icon-192.png        ← PWA icon (generate with generate-icons.html)
├── icon-512.png        ← PWA icon (generate with generate-icons.html)
├── instructions.md     ← Full project documentation
└── README.md           ← This file
```

---

## Deploy to GitHub Pages

### 1. Generate PWA icons first

Open `generate-icons.html` in any browser. Click each download button. Save `icon-192.png` and `icon-512.png` to the repo root.

### 2. Push and enable Pages

```bash
git add .
git commit -m "Deploy Sprint OS v2"
git push origin main
```

Settings → Pages → Source: **main branch / root** → Save.

Live in ~60 seconds at `https://anwaydiptapaul.github.io/life-plan/`

---

## Google Drive + Calendar Sync (Optional)

### Quick setup

1. [console.cloud.google.com](https://console.cloud.google.com) → New project
2. Enable **Google Drive API** + **Google Calendar API**
3. Credentials → OAuth 2.0 Client ID (Web application)
4. Add authorised origin: `https://anwaydiptapaul.github.io`
5. Create an API Key, restrict to Drive + Calendar APIs
6. In `update.js`, replace at the top:

```js
const GAPI_CONFIG = {
  clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
  apiKey:   'YOUR_API_KEY',
  ...
};
```

7. OAuth consent screen → add yourself as test user → add scopes:
   - `https://www.googleapis.com/auth/drive.appdata`
   - `https://www.googleapis.com/auth/calendar.events`

### What gets saved

All state → single private file `sprint-os-state.json` in Drive appdata (only this app can read it). Includes: savings, milestone states, course states, math progress, OU checklist, IELTS score, mock scores, income log.

---

## PWA Installation

1. Open the live site in Chrome (Android) or Safari (iOS)
2. Android: Menu → "Add to Home Screen"
3. iOS: Share → "Add to Home Screen"
4. Desktop Chrome: install icon in address bar

Works fully offline once installed — all pages cached by service worker.

---

## Push Notifications

Click **Enable Notifications** on the Dashboard. Sprint OS will notify you:
- 5 minutes before each schedule block starts
- When edX expiry is ≤ 3 days away
- Saturday IELTS mock reminder
- Phase-switch suggestion when IELTS date passes

---

## Local Development

```bash
python3 -m http.server 8080
# then open: http://localhost:8080/
```

---

## Architecture

- **No framework.** Pure HTML + CSS + vanilla JS.
- **`window.U`** — global runtime (update.js)
- **`window.S`** — savings state (data.js)
- All data and schedule logic → `data.js`
- All mutation, sync, notifications → `update.js`
- Pages communicate via `document.dispatchEvent`
- State stored in `localStorage`, optionally mirrored to Google Drive
- Service worker caches all shell files on install

See `instructions.md` for the complete technical reference.

---

*Sprint OS v2 · Built May 2026 · Target: OU MPhys Application Nov 2027*
