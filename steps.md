# Sprint OS Light — Step-by-Step Rebuild

## Step 0 — Setup
- [x] Read all original files: index, daily, courses, milestones, savings, roadmap, habits, review, style.css, data.js, update.js
- [x] Read routine master markdown
- [x] Define design system in plan.md

## Step 1 — style.css (FIRST — all pages depend on it)
Build the complete light CSS:
- CSS custom properties (tokens) for light palette
- Typography: DM Serif Display + Lora + JetBrains Mono
- Reset and base (body 17px, line-height 1.7)
- Navigation (.nav) — cream background, shadow
- Alert bar (.alert-bar)
- Cards (.card, .card-accent on LEFT not top, thick micro-bar 6px)
- Stat grid
- Section headers (.sec-head)
- Buttons (.btn variants)
- Form inputs (.field)
- Timeline (.timeline, larger nodes 28px)
- Checklist items (.check-item)
- Schedule rows (.sched-row, .sched-time)
- Week grid (.week-grid, .day-col)
- Phase accordions
- Savings gauge
- Habit rows
- Heatmap
- Math tracker
- Progress rings
- Footer
- Animations (fade-in — gentler)
- Responsive breakpoints

## Step 2 — data.js
- Copy from original verbatim. No changes.

## Step 3 — update.js
- Copy from original verbatim. No changes.

## Step 4 — index.html (Dashboard)
Key sections to rebuild:
- Hero: greeting + priority message + live clock/date
- Now/Next panel (right column of hero)
- Countdown row (edX expiry, IELTS target, OU application)
- Stat grid (6 cards: Savings, Courses, Plan Month, Milestones, Pace Tier, Habits)
- 18-month Timeline strip
- Google Sync bar
- IELTS Status panel
- Quick Actions buttons
- IELTS score modal
All JS logic identical to original — just change HTML/CSS classes.

## Step 5 — daily.html
- Page header with date/mode/tier
- Controls bar (Order toggle, Phase toggle, Tier display)
- Intensity meter bar
- Alert callout
- Two-column: Schedule list + Weekly grid
- Weekly block key
All JS identical.

## Step 6 — courses.html
- Page header
- Danger alert (edX deadline)
- Overview stats grid (4 platform cards)
- Platform accordions (edX → LinkedIn → Coursera → Udemy)
- Each accordion: progress bar, course rows with checkboxes
- Footer note
All JS identical.

## Step 7 — milestones.html
- Page header
- Progress ring
- Milestone checklist (17 items)
- Each item: checkbox, title, description, badge (urgent/priority/normal/done)
- Stats footer
All JS identical.

## Step 8 — savings.html
- Page header
- Semicircular gauge (SVG, large)
- ETA box
- Input row for current BDT + monthly income
- Savings chart (canvas)
- Scenario cards (4 income scenarios)
- Tier cards (4 tiers)
- Income log table
All JS identical.

## Step 9 — roadmap.html
- Page header
- Master table (18 months → periods → status)
- Period accordions (5 periods with goal cards)
All JS identical.

## Step 10 — habits.html
- Page header
- Habit checklist (5 daily habits)
- Habit heatmap (90-day grid)
- Math progress tracker (subjects → chapter accordions)
- OU checklist
All JS identical.

## Step 11 — review.html
- Page header
- Review form (weekly inputs)
- Past reviews log
- Stats sidebar
All JS identical.

## Step 12 — 404.html
- Simple light-theme not-found page.

## Step 13 — Copy support files
- sw.js, sw-register.js, manifest.json — copy verbatim
- anway-routine-master.md — copy verbatim

## Step 14 — Final check
- All nav links point to correct pages
- data.js + update.js load correctly
- CSS vars all resolve (no --bg3, --bg4 orphans from dark theme)
- Fonts load from Google Fonts
- Mobile responsive check (768px breakpoint)
- Colour contrast: all text on backgrounds ≥ 4.5:1 ratio
