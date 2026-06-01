# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Table Tosser (page title "Table Toss") is a browser-based physics game where the player launches a chosen object off a spatula and tries to land it on a table for points. The repo directory and main JS file are still named `hamhuckin` for historical reasons — the project was renamed but the filenames were not.

There is no build system — the game runs by opening `index.html` directly in a browser. The `express` dep in `package.json` and `pnpm-lock.yaml` are vestigial from an older Heroku/Vercel deploy and are not used by the game.

## Running the Game

Open `index.html` in a browser. For local development with a server:

```
npx serve .
# or
python3 -m http.server
```

## Architecture

All game logic lives in `lib/hamhuckin.js`, wrapped in `gameStart()` (called by `<body onload="gameStart()">`).

**Physics engine**: Matter.js (`lib/matter.js`) handles rendering, physics, and collision. `lib/decomp.min.js` provides concave-polygon decomposition used by `Bodies.fromVertices`.

**Canvas**: Fixed render size 1050×602. `applyMobileScale()` wraps it in `#canvas-wrapper` and scales the wrapper via CSS transform to fit the viewport (re-runs on resize / orientationchange).

### Key game objects

- `whacker` — spatula-sprited paddle, pivoted at its left end
- `hammo` — the currently active projectile; `hammos[]` tracks every spawned shot so they can be scored and checked for "settled"
- `landingPad` — compound static body built from `tableTop` + `leftLeg` + `rightLeg`, composed via `Matter.Body.create({ parts: [...] })`
- `throwables` — registry of selectable objects (`burger`, `fish`, `rubberDuck`) with width/height/density/friction/restitution/sprite/vertices. The commented-out `ham` and `bowlingBall` entries are intentional dormant configs.

### Whacker constraint stack

Five constraints work together to hold, pull back, and fire the whacker:

- `whackerPivot` — fixed left-end pivot
- `whackerSpring` — soft return spring
- `whackerLevel` — keeps the whacker level at rest; removed during pullback, re-added on release
- `whackerPullback` — built when input is held; the loop moves `whackerPullbackAnchor` to build tension; removed on release to fire
- `whackerFreeze` — hard lock at rest; removed on the first pullback input; re-armed (`armWhackerFreeze`) once the whacker has returned to rest above y=400

The game loop watches for `Composite.allConstraints(engine.world).length === 3` (i.e. pullback fired and removed) to re-add `whackerPullback` for the next shot.

### Throwable picker and custom sprite rendering

The title screen has three `[data-throwable]` buttons; clicking one calls `choosePickerOption(key)`, which sets `selectedThrowable` and calls `spawnHammo()`.

For throwables with concave `vertices`, `spawnHammo()` uses `Bodies.fromVertices`, which splits the body into parts. Matter would then draw the sprite once per part, so the code suppresses per-part rendering (`body.parts[i].render.visible = false`) and tags the parent with `customSprite`. An `Events.on(render, 'afterRender', ...)` listener iterates `hammos[]` and draws each `customSprite` once at the parent centroid, using a per-source `spriteCache`. **Sprite art for these throwables must assume the body's natural width/height** — there is no scaling at draw time.

### Game loop (`Events.on(engine, "afterUpdate", ...)`)

Each tick (early-returns while `gameOver` or `pickingNew`):

1. If the active hammo has left the play area (`x > 400 || y > 500`) and `shotCount > 1`, spawn the next hammo, push it into `hammos[]`, decrement `shotCount`, and re-arm `whackerFreeze`. On the last shot (`shotCount === 1`), don't spawn — record `lastShotTime` instead.
2. Re-add `whackerPullback` when only the 3 baseline constraints remain and the whacker has returned high enough (`whacker.position.y < 400`).
3. Re-add `whackerFreeze` once the whacker is essentially at rest above y=400 and `armWhackerFreeze` is set.
4. Score = bodies inside `scoreBounds` ({572,0}–{928,480}, the column above the table) filtered to `position.y <= 700 && speed < 2` — in-flight or fallen pieces don't count. Score is written to both `.score-number` elements.
5. Game over fires only when `shotCount === 0`, ≥1500ms have passed since `lastShotTime`, AND `areAllHammosDone()` (every hammo is off-screen or fully settled).

### Controls

- **Spacebar** (desktop): hold to pull back — moves `whackerPullbackAnchor` left/down by 8px per keydown event until x ≤ 120. Release removes `whackerPullback` (firing the whacker), restores the anchor, and re-adds `whackerLevel`.
- **Touch** (mobile, `(pointer: coarse)`): `touchstart` on `#canvas-wrapper` starts a 16ms `setInterval` that pulls back 4px/tick. `touchend` clears the interval and fires (same release logic as keyup).
- The `(pointer: coarse)` media query also swaps the instruction copy in `index.html` to "Tap and hold…" / "Tap anywhere to restart".

### Reset flows

- **Click/tap on game-over screen**: clears the world, resets `shotCount` to 5, respawns the hammo with the same throwable, re-adds all whacker constraints. **Keeps `window.sessionHighScore`.**
- **"Click here to toss something else"** button: same reset, but also sets `pickingNew = true`, reopens the title screen, and **resets `sessionHighScore` to 0** (each throwable gets its own high-score session). While `pickingNew` is true the loop early-returns so the world doesn't tick during selection.

The click and touch handlers on the game-over screen contain duplicated reset logic — edits to one usually need to be mirrored to the other.

### Coordinate magic numbers

These literals recur throughout `hamhuckin.js`:
- `400` — x cutoff: hammo is "off-screen" (off the right of the launch area)
- `500` / `700` — y cutoffs for spawning the next shot vs. final off-screen
- `(572, 928)` × `(0, 480)` — `scoreBounds` (column above the table)
- `120` — minimum x for `whackerPullbackAnchor` (max pullback)
- `1500` — ms to wait after the last shot before declaring game over

## Files

| File | Purpose |
|------|---------|
| `index.html` | Entry point; HUD, title screen, ending screen, throwable picker buttons |
| `lib/hamhuckin.js` | All game logic |
| `lib/matter.js` | Matter.js physics/rendering (vendored) |
| `lib/decomp.min.js` | Polygon decomposition for `Bodies.fromVertices` (vendored) |
| `css/style.css` | All styling; Dosis font from Google Fonts; `(pointer: coarse)` media query for mobile |
| `assets/hamburger.png`, `fish.png`, `rubber-duck.png` | Active throwable sprites |
| `assets/spatula.png` | Whacker sprite |
| `assets/tabletop.png`, `tableleg.png` | Landing pad parts |
| `assets/ham.png`, `bowling-ball.png` | Dormant — referenced only by commented-out `throwables` entries |
| `assets/github.png`, `newhamhuckscreenshot.png` | Footer icon and README screenshot |
| `package.json`, `pnpm-lock.yaml` | Vestigial deploy config; not used by the game |
| `docs/`, `TODO.md`, `ai_plan.md` | Author notes |
