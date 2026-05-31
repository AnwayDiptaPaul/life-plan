# Sprint OS

**A personal life management and accountability system built as a static multi-page GitHub Pages website.**

Live 18-month countdown dashboard, interactive checklists, savings tracker, daily schedule generator, and Google Drive/Calendar sync — all running in the browser with no backend.

---

## 🚀 Deploying to GitHub Pages

### 1. Create a repository

```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/sprint-os.git
```

### 2. Copy all files into the repo root

The site is fully static — no build step, no Node.js, no dependencies to install.

```
sprint-os/
├── index.html        ← Dashboard (home page)
├── daily.html        ← Daily schedule
├── courses.html      ← Course checklist
├── milestones.html   ← Milestone tracker
├── savings.html      ← Savings tracker + ETA
├── roadmap.html      ← 18-month roadmap
├── style.css         ← Shared design system
├── data.js           ← All data + shared utilities
├── update.js         ← Real-time engine + Google sync
├── instructions.md   ← Full project documentation
└── README.md         ← This file
```

### 3. Push and enable GitHub Pages

```bash
git add .
git commit -m "Initial deploy"
git push -u origin main
```

Then go to **Settings → Pages → Source → main branch / root** and save.

Your site will be live at `https://YOUR_USERNAME.github.io/sprint-os/`

---

## 🔑 Enabling Google Drive + Calendar Sync (Optional)

The site works fully offline using `localStorage`. To enable cloud sync:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project → enable **Google Drive API** and **Google Calendar API**
3. Create **OAuth 2.0 credentials** (Web application type)
4. Add your GitHub Pages URL to **Authorized JavaScript origins**
5. Copy your **Client ID** and **API Key**
6. Open `update.js` and replace:

```js
const GAPI_CONFIG = {
  clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  apiKey:   'YOUR_GOOGLE_API_KEY',
  ...
};
```

7. Commit and push.

When signed in, all state (course completions, milestone checks, savings updates) is saved to a private file in the user's Google Drive **appdata** folder (invisible to other apps) and calendar events are created in their primary Google Calendar.

---

## 📁 File Reference

| File | Purpose |
|------|---------|
| `index.html` | Live dashboard: greeting, NOW/NEXT block, countdowns, stats row, timeline, IELTS status panel |
| `daily.html` | Today's schedule with order/free toggle, pre/post-IELTS toggle, tier display, weekly grid |
| `courses.html` | Full course checklist across all 4 platforms with collapsible phase accordions |
| `milestones.html` | Milestone tracker with SVG progress rings, IELTS score logger, category progress bars |
| `savings.html` | Arc gauge savings tracker, log table, ETA calculator, scenario grid, pace tier cards |
| `roadmap.html` | 18-month timeline, month-by-month table, period accordions with clickable goal cards |
| `style.css` | Complete design token system, all component styles, responsive breakpoints |
| `data.js` | All static data (courses, milestones, tiers, schedule builder), shared utilities, `buildNavHTML()`, `buildFooterHTML()`, `buildTimelineHTML()` |
| `update.js` | `window.U` — real-time engine: device clock, phase detection, Google Drive sync, Google Calendar integration, auto-save manager, toast system |

---

## ⚙️ How It Works

- **No framework, no build step.** Pure HTML + CSS + vanilla JS.
- **State** is stored in `localStorage` and optionally synced to Google Drive appdata.
- **`window.U`** is the global update engine, available on every page.
- **`window.S`** is the savings state object (bdt, monthly, save(), eur(), pct()).
- **`getTier()`**, **`buildSchedule()`**, **`PHASES`**, **`MILESTONES`** etc. are all available globally from `data.js`.
- The **live clock** (`U.Ticker`) updates every second, highlighting the current schedule block and updating countdowns.
- **Google sync** is entirely non-blocking — the UI works instantly from localStorage and Drive loads asynchronously.
