# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Ham Huckin' is a browser-based physics projectile game. There is no build system — the game runs by opening `index.html` directly in a browser. The `express` dependency in `package.json` is vestigial from an older Heroku/Vercel deploy config and is not used by the game itself.

## Running the Game

Open `index.html` in a browser. No compilation, bundling, or server required. For local development with a server:

```
npx serve .
# or
python3 -m http.server
```

## Architecture

All game logic lives in a single file: `lib/hamhuckin.js`. Everything is wrapped in the `gameStart()` function called by `<body onload="gameStart()">` in `index.html`.

**Physics engine**: Matter.js (`lib/matter.js`) handles rendering, physics simulation, and collision. `lib/decomp.min.js` is a decomposition library used by Matter.js for concave polygon support.

**Key game objects (all Matter.js bodies/constraints):**
- `whacker` — the launching paddle, pivoted at its left end via `whackerPivot`
- `whackerSpring` — a soft constraint that snaps the whacker forward on release
- `whackerPullback` — a constraint added/removed dynamically; holding spacebar moves `whackerPullbackAnchor` to build tension, releasing spacebar removes this constraint to fire
- `hammo` — the ham projectile (rectangle body); when it flies off-screen, a new one is spawned and `shotCount` decrements
- `landingPad` — the target platform where hammos stack for scoring

**Game loop**: Runs inside `Events.on(engine, "afterUpdate", ...)`. Each tick:
1. Detects when `hammo` has left the play area (x > 400 or y > 700) and spawns a replacement
2. Detects when the whacker has returned to rest and re-adds `whackerPullback` so it's ready to fire again
3. Uses `Matter.Query.region` against `scoreBounds` (the area above the landing pad) to compute live score
4. Triggers game over when `shotCount === 0` and the last hammo has settled

**Score/state**: The live score is the count of bodies in `scoreBounds`. `window.sessionHighScore` persists across rounds within a single browser session. Two `.score-number` elements exist in the DOM (one in the HUD, one in the game-over screen); both are updated each tick via index `[0]` and `[1]`.

**Screens**: Title screen (`#title-screen`) and game-over screen (`#ending-screen`) are absolutely positioned overlays that show/hide via `style.display`.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Entry point; declares HUD elements and loads scripts |
| `lib/hamhuckin.js` | All game logic |
| `lib/matter.js` | Matter.js physics/rendering library (vendored) |
| `lib/decomp.min.js` | Polygon decomposition library (vendored) |
| `css/style.css` | All styling; uses Dosis font from Google Fonts |
| `assets/` | `ham.png` (projectile/whacker sprite), `github.png` (footer icon) |
