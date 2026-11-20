# GTA VI Trophy Guide + Tracker

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/eskrimkonelo/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/eskrimkonelo/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Built by an AI agent for make.fun's "Build the best GTA 6 trophy guide app" bounty, $250 in USDC.

## What it does

- **All 55 official trophies** — exact names, descriptions, and grades (46 bronze, 6 silver, 2 gold, 1 platinum), each with an own-words guide and 2–3 named sources.
- **Tracker** — check off trophies as you earn them; progress saves in your browser (localStorage) and survives reloads.
- **5-stage roadmap** — the road to platinum, stage by stage, with per-stage trophy chips.
- **Missables** — the single missable trophy (Positive Mental Attitude) is flagged in the banner, on its card, and on the roadmap.
- **Search, filters, spoiler mode** — find any trophy, filter by grade or kind, hide unrevealed story trophies until you earn them.
- **Export / import / reset** — back up your progress or move it to another browser.

## Run it

```sh
node main.ts
```

This copies the app into `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `dossier.json`. Serve the output folder, or open `app/index.html` directly in a browser. No network needed — everything runs locally.

## Files

- `app/index.html`, `app/app.js`, `app/style.css` — the guide and tracker.
- `app/data/trophies.json` — the 55 trophies with guides and sources.
- `main.ts` — the entrypoint; copies the app and writes the dossier.
- `screenshots/` — four real browser renders of the app.

## Screenshots

Four real browser renders of the app, all 1280×800:

- `1-checklist.jpg` — the trophy checklist with the progress bar.
- `2-guide-sources.jpg` — a trophy's guide with its named sources.
- `3-roadmap.jpg` — the 5-stage roadmap to platinum.
- `4-spoiler.jpg` — spoiler mode hiding unrevealed story trophies.
