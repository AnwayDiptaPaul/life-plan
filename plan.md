# Sprint OS — Light Rebuild Plan

## 1. Design Direction

**Theme:** Clean Academic Light — inspired by a well-organised engineer's desk:
cream-white base, stone/slate accents, deliberate use of one warm accent colour
(amber/saffron) and one cool accent (teal-green). No dark backgrounds, no glow effects.

**ADHD-Friendly Principles:**
- Larger base font (16–17px) with generous line-height (1.7)
- Clear visual hierarchy: one obvious focal point per section
- Reduced visual noise: no scanline overlays, no grid ghosts, no multiple competing glows
- Chunked information: short paragraphs, distinct cards with ample breathing room
- Progress indicators that are immediately readable (thick bars, big numbers)
- Colour used sparingly as a signal, not decoration
- Sticky "what's next" element always visible at top-right
- Every interactive element has a clear affordance (border, shadow, contrast)

## 2. Typography System

| Role | Font | Size |
|------|------|------|
| Display / numbers | DM Serif Display (serif, authoritative) | clamp(2rem, 5vw, 4rem) |
| Body / UI labels | Lora (readable serif, warm) | 16–17px |
| Code / times | JetBrains Mono | 13–14px |

Rationale: Serif fonts test better for ADHD readers in sustained reading tasks.
Lora at 16px+ with 1.7 line-height is scientifically better than 13px mono text.

## 3. Colour Palette (Light)

```
--bg:        #FAF8F5   (warm white, paper)
--bg1:       #F2EFE9   (card surface)
--bg2:       #ECEAE4   (inset / recessed)
--border:    #D8D3C8   (hairline)
--border2:   #C4BDB0   (card edge)

--text:      #1C1A18   (near-black, readable)
--text2:     #4A4540   (secondary)
--text3:     #7A746C   (muted label)
--dim:       #B0A898   (placeholder)

--green:     #0D7A5F   (teal-green — calm, academic)
--green-bg:  #E8F5F0   (green tint)
--amber:     #C47B0A   (saffron — warm urgency)
--amber-bg:  #FEF3DC   (amber tint)
--red:       #C0392B   (alert red)
--red-bg:    #FDECEA   (red tint)
--blue:      #1A6DB5   (information blue)
--blue-bg:   #E8F2FB   (blue tint)
--purple:    #6B4FA6   (milestone / deep)
--orange:    #C45E12   (tier indicator)
```

## 4. Page Structure

Pages to rebuild (same 8 as original):
1. `index.html` — Dashboard (hero, countdowns, stat grid, timeline, IELTS, quick links)
2. `daily.html` — Today's Schedule + weekly grid
3. `courses.html` — Course queue by platform (accordion)
4. `milestones.html` — Checklist of 17 milestones
5. `savings.html` — Savings gauge + tier cards + income log
6. `roadmap.html` — 18-month accordion periods + master table
7. `habits.html` — Daily habits + heatmap + math tracker
8. `review.html` — Weekly review log

Supporting files:
- `style.css` — Complete light design system
- `data.js` — Copied from original (unchanged — all logic stays)
- `update.js` — Copied from original (unchanged — all logic stays)

## 5. Key Changes from Dark Version

| Element | Dark | Light Rebuild |
|---------|------|---------------|
| Background | #080c10 | #FAF8F5 |
| Font size | 13px base | 17px base |
| Font family | Geist Mono (mono) | Lora (serif) + JetBrains Mono for times |
| Display font | Bebas Neue | DM Serif Display |
| Card border-radius | 2px (sharp) | 8px (softer, friendlier) |
| Navigation | Sticky dark bar | Sticky cream bar with bottom shadow |
| Scanlines overlay | Yes | None |
| Grid overlay | Yes | None |
| Card shadows | Glow effects | Subtle box-shadow on hover |
| Progress bars | 2px thin | 6px thick (visible) |
| Timeline nodes | 20px circles | 28px circles with number labels |
| Countdowns | 3-col tight | 3-col roomy with descriptive labels |

## 6. ADHD-Specific Interactions

- **"Now / Next" panel**: Pinned top-right on desktop, very visible
- **Countdowns**: Big numbers, coloured backgrounds, not just coloured text
- **Stat cards**: Large numerals, clear label, thick accent bar on left (not top)
- **Checklist items**: Checkbox on left, bold title, lighter description — clear scan order
- **Schedule rows**: Time in large mono, block name in serif, alternating subtle stripe
- **Habit tracker**: Large tap targets (48px min), clear ✓/○ state
- **Section headers**: Larger, spaced out — clear chapter breaks in scanning

## 7. Files NOT Rebuilt

- `data.js` — copied verbatim (no logic changes)
- `update.js` — copied verbatim (no logic changes)
- `sw.js`, `sw-register.js`, `manifest.json` — copied verbatim
- `404.html` — rebuilt minimally

## 8. Google Fonts Import

```css
@import url('https://fonts.googleapis.com/css2?
  family=DM+Serif+Display:ital@0;1
  &family=Lora:ital,wght@0,400;0,500;0,600;1,400
  &family=JetBrains+Mono:wght@400;500
  &display=swap');
```
