# Sprint OS — Light Edition

**Anway's 18-month personal command centre for OU MPhys admission.**
A static GitHub Pages site tracking IELTS prep, courses, savings, habits, milestones, and the full roadmap — rebuilt in a clean light theme with ADHD-friendly typography and visuals.

---

## What this is

Sprint OS is a single-person life-operating-system running entirely in the browser. No server, no framework, no build step. Open `index.html` and everything works. All data persists in `localStorage`; Google Drive sync is optional.

The plan it tracks:

- **IELTS Band 7.0** — July 2026 exam (gate to OU and international clients)
- **edX courses** — hard deadline Jun 26 2026 (subscription expiry)
- **LinkedIn → Coursera → Udemy** courses — in strict priority order
- **Savings goal** — 10,000 EUR for OU fees + living costs
- **OU MPhys application** — target November 2027
- **18-month timeline** starting May 29 2026

---

## Pages

| Page | File | Purpose |
|------|------|---------|
| Dashboard | `index.html` | Live clock, Now/Next block, countdowns, stat grid, 18-month timeline, IELTS status |
| Daily Schedule | `daily.html` | Today's time-blocked schedule, weekly grid, Pre/Post-IELTS toggle |
| Courses | `courses.html` | Full course queue by platform (edX → LinkedIn → Coursera → Udemy) with checkboxes |
| Milestones | `milestones.html` | 17 milestones with progress rings and IELTS score logger |
| Savings | `savings.html` | Savings gauge, scenario cards, 4 pace tiers, income log |
| Roadmap | `roadmap.html` | Master 18-month table and 5-period accordion breakdown |
| Habits | `habits.html` | Daily habit tracker, 90-day heatmap, math chapter tracker, OU checklist |
| Weekly Review | `review.html` | Weekly reflection log with form and history |

---

## File structure

```
sprint-os-light/
├── index.html          Dashboard
├── daily.html          Today's schedule
├── courses.html        Course tracker
├── milestones.html     Milestone checklist
├── savings.html        Savings tracker
├── roadmap.html        18-month roadmap
├── habits.html         Habits + math tracker
├── review.html         Weekly review log
├── 404.html            Not-found page
│
├── style.css           Complete light design system (815 lines)
├── data.js             All data, constants, and shared functions (682 lines)
├── update.js           UI updaters, Google Drive/Calendar sync, clock (735 lines)
│
├── sw.js               Service worker (offline support)
├── sw-register.js      Service worker registration
├── manifest.json       PWA manifest
├── icon-192.png        App icon 192×192
├── icon-512.png        App icon 512×512
│
├── plan.md             Design rationale and token reference
└── steps.md            Rebuild checklist (for reference)
```

---

## Design system

### Fonts (Google Fonts — loaded from CDN)

| Role | Family | Where used |
|------|--------|-----------|
| Display / large numbers | DM Serif Display | Page titles, stat values, countdowns |
| Body / UI | Lora | All body text, card labels, checklist items |
| Code / timestamps | JetBrains Mono | Times, tags, badges, nav links |

Base size is **17px** with **1.7 line-height** — deliberately larger than the original 13px monospace for sustained readability.

### Colour tokens

All colours are defined as CSS custom properties in `:root` inside `style.css`. To change the accent colour, edit `--green` and `--green-bg` (and optionally `--teal`).

```css
/* Core surfaces */
--bg:        #FAF8F5   /* warm paper white */
--bg1:       #F5F2EC   /* card background */
--bg2:       #EDEAE3   /* inset / recessed */
--text:      #1C1A18   /* near-black body text */
--text3:     #7A746C   /* muted labels */

/* Accent colours */
--green:     #0D7A5F   /* primary — calm academic teal */
--amber:     #C47B0A   /* urgency / warnings */
--red:       #C0392B   /* danger / deadlines */
--blue:      #1A6DB5   /* info / LinkedIn */
--purple:    #6B4FA6   /* milestones */
--orange:    #C45E12   /* tier indicators */
```

---

## localStorage keys

All user state is stored in `localStorage` under these keys:

| Key | What it stores |
|-----|---------------|
| `c_done` | Course completion flags (JSON array of booleans) |
| `m_done` | Milestone completion flags (JSON array of booleans) |
| `math_done` | Math chapter completion (JSON object) |
| `ou_done` | OU checklist completion (JSON object) |
| `habit_YYYY-MM-DD` | Daily habit check-ins (JSON object per date) |
| `mock_scores` | IELTS mock exam score log (JSON array) |
| `s_bdt` | Current savings amount in BDT |
| `s_monthly` | Monthly income in BDT (determines pace tier) |
| `savings_log` | Savings history entries (JSON array) |
| `income_log` | Income log entries (JSON array) |
| `weekly_reviews` | Weekly review entries (JSON array) |
| `pre_ielts` | Phase toggle — `"true"` = Pre-IELTS mode |
| `has_order` | Schedule toggle — `"true"` = work day |
| `ielts_taken` | Whether IELTS has been sat (`"true"`/`"false"`) |
| `ielts_score` | Recorded overall band score |

To reset everything: open DevTools → Application → Local Storage → Clear All.

---

## Google Drive sync (optional)

Sync is built in but requires a Google Cloud project. To enable:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → enable **Google Drive API** and **Google Calendar API**
3. Create an OAuth 2.0 Client ID (Web application type)
4. Add your GitHub Pages URL to **Authorised JavaScript origins**
5. Open `update.js` and replace the placeholder:

```js
clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
```

Without this step the site works fully — the "Sign in with Google" button simply does nothing.

---

## Deploying to GitHub Pages

1. Unzip `sprint-os-light.zip` into your repository's root (or a subdirectory like `life-plan/`)
2. If using a subdirectory, verify `manifest.json` has the correct `start_url` and `scope`:
   ```json
   "start_url": "/life-plan/index.html",
   "scope": "/life-plan/"
   ```
3. Push to `main` (or `gh-pages`) and enable GitHub Pages in repository Settings → Pages
4. The site will be live at `https://yourusername.github.io/life-plan/`

No build step, no npm install, no dependencies to manage.

---

## Pace tiers

The tier system drives daily schedule intensity and is automatically selected based on monthly income (`s_monthly` in localStorage):

| Tier | Name | Monthly income threshold | Work hours/day |
|------|------|--------------------------|----------------|
| T1 | Foundation | Any (default) | 8 hrs |
| T2 | Momentum | ≥ 50,000 BDT | 8 hrs |
| T3 | Acceleration | ≥ 80,000 BDT | 8 hrs |
| T4 | Full Sprint | ≥ 120,000 BDT | 8 hrs |

Higher tiers unlock more study hours per day. Set your income in Savings → Income field.

---

## Key dates hardcoded in `data.js`

| Constant | Value | What it is |
|----------|-------|------------|
| `START_DATE` | May 29 2026 | Plan start — Month 1 anchor |
| `EDX_DATE` | Jun 26 2026 | edX subscription expiry |
| `IELTS_DATE` | Jul 31 2026 | IELTS target exam date |

To update these, edit the three `const` declarations at the top of `data.js`.

---

## ADHD-friendly design decisions

- **17px Lora serif** — larger base size, humanist letterforms ease sustained reading
- **Left-side accent bars** on cards — colour is directional, not decorative
- **Thick progress bars (6–7px)** — visible without squinting
- **Full-tint alert boxes** — red-on-red-background rather than just coloured text
- **Now/Next panel** always at the top of the dashboard
- **No scanlines, no grid overlay** — zero background noise
- **28px timeline nodes with numbers** — scannable at a glance
- **48px+ tap targets** on habit rows and checklist items
- **Section headers** spaced generously — clear chapter breaks when scrolling fast
- **Single focal point per card** — one large number, one label, one bar

---

*Built May–June 2026. Target: OU MPhys application, November 2027.*
