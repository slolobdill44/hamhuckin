# Custom AI-generated throwables

## Context

Ham Huckin' currently ships with three hand-authored throwables (burger, fish, rubber duck), each defined in a static `throwables` object in `lib/hamhuckin.js:37` with hand-tuned vertex arrays and physics constants. This change lets the player type a prompt ("a flying toaster", "a bowling pin"), receive an AI-generated pixel-art image, pick a physics preset, and immediately start huckin' it.

The interesting problem is physics: an AI image is just pixels, so we have to derive a Matter.js collision polygon from the image's alpha channel before it can be thrown. The game already loads `lib/decomp.min.js` and already calls `Bodies.fromVertices()` for the existing throwables (`lib/hamhuckin.js:147`), so the renderer/spawner pipeline is reusable as-is — we just need to produce the vertex array at runtime instead of authoring it by hand.

## Approach

Three pieces:

1. **Vercel serverless proxy** that holds the OpenAI key and returns a transparent PNG.
2. **Client-side vertex extraction** — trace the alpha channel into a simplified polygon.
3. **UI** — a "Create your own" entry on the title screen and a physics-preset picker after generation.

### 1. Serverless proxy: `api/generate.js`

New file. Vercel auto-deploys any `api/*.js` as a serverless function. The branch is already `vercel-fun`, so this fits the existing intent.

- Accepts `POST { prompt: string }`.
- Validates: `prompt.length <= 100`, basic ASCII/printable filter, reject empty.
- IP rate limit: 5 requests/min using an in-memory Map keyed by `req.headers['x-forwarded-for']` (good enough for a hobby site; survives within a single warm instance — acceptable tradeoff).
- Wraps the user prompt with a fixed style suffix so output is consistent: `"{prompt}, pixel art, centered, single object, plain transparent background, no text, no shadow"`.
- Calls OpenAI `images.generate` with `model: 'gpt-image-1'`, `size: '512x512'`, `background: 'transparent'`, `quality: 'low'` (faster, cheaper, fine for pixel art).
- Returns `{ image: '<base64 png>' }`.
- Reads `OPENAI_API_KEY` from `process.env` — user sets this in the Vercel dashboard.

Add `openai` to `package.json` dependencies. Keep the vestigial `express` dependency or remove it (separate cleanup, not required).

### 2. Vertex extraction: new file `lib/shapeFromImage.js`

Loaded via a new `<script>` tag in `index.html` after `decomp.min.js` and before `hamhuckin.js`.

Exposes one function: `shapeFromImage(img, targetMaxDim) -> { vertices, width, height, scaledCanvas }`.

Pipeline:
1. Draw the image to an offscreen canvas, downsampled so the longest side is `targetMaxDim` (e.g. 80px). Smaller = faster trace + simpler polygon.
2. Read `ImageData`. Threshold alpha at >= 128 to a boolean mask.
3. **Flood-fill to find the largest connected blob.** Discard everything else — this handles the "disconnected blobs" failure mode (AI sometimes adds dots/specks).
4. **Marching-squares** trace the blob's outer boundary into an ordered polygon (canonical algorithm, ~60 lines).
5. **Douglas–Peucker** simplify with epsilon ~1.5px to get to ~15–30 vertices.
6. Recenter vertices around the centroid (the existing `spawnHammo` flow expects vertices in body-local coordinates — see `throwables.burger.vertices` in `lib/hamhuckin.js:46`).
7. Return the simplified vertex array plus the scaled canvas (so the sprite shown matches the polygon — important; otherwise sprite/collision will look misaligned).
8. **Fallback:** if marching-squares produces <4 vertices, or `Bodies.fromVertices()` later returns a body with no parts, fall back to a convex hull of the alpha mask. (Implemented as a re-attempt inside `spawnHammo` — see step 3.)

The scaled canvas is later turned into a sprite via `canvas.toDataURL('image/png')`, registered in `spriteCache` so the existing `afterRender` handler at `lib/hamhuckin.js:499` draws it correctly.

### 3. UI changes

**Title screen (`index.html` + `css/style.css`):**
- Add a fourth picker button: "Create your own ✨" with `data-action="custom"`.
- Add a hidden `#custom-creator` overlay containing: a `<textarea>` (maxlength 100), a "Generate" button, a loading spinner, a preview area showing the generated image, and a row of preset buttons: **Heavy / Medium / Light / Bouncy**. Style consistent with the existing gradient picker buttons.

**Physics presets** (defined in `hamhuckin.js`, near the `throwables` object):
```js
var physicsPresets = {
  heavy:  { density: 0.0025, friction: 0.5, restitution: 0.05 },
  medium: { density: 0.0008, friction: 0.2, restitution: 0.15 },
  light:  { density: 0.0002, friction: 0.1, restitution: 0.25 },
  bouncy: { density: 0.0006, friction: 0.1, restitution: 0.7  }
};
```

**Flow in `lib/hamhuckin.js`:**
1. Modify the picker-button handler at `lib/hamhuckin.js:191` to branch on `data-action="custom"` → show `#custom-creator` instead of starting the game.
2. "Generate" button: `fetch('/api/generate', {...})`, show spinner, on response decode base64 into an `Image`, run `shapeFromImage`, store the result in a pending object.
3. When a preset button is clicked: compose a runtime throwable:
   ```js
   var custom = Object.assign({
     label: prompt.slice(0, 20),
     sprite: dataUrlFromScaledCanvas,
     vertices: extractedVertices,
     width: scaledCanvas.width,
     height: scaledCanvas.height
   }, physicsPresets[choice]);
   throwables.custom = custom;
   choosePickerOption('custom');
   ```
4. `choosePickerOption` already handles spawning (`lib/hamhuckin.js:180`) and `spawnHammo` already handles `vertices` and the multi-part sprite-hiding logic — no changes needed there if the data shape matches.
5. **Inside `spawnHammo`** add the fallback: after `Bodies.fromVertices`, if the returned body has 0 valid parts (decomposition failed), rebuild with a convex hull of the same point set as a `Bodies.fromVertices` call with a single convex polygon — guarantees something usable.

The mid-game "choose new object" button (`lib/hamhuckin.js:436`) already re-shows the title screen, so the custom-creator path is naturally available again on replay.

## Critical files

- `lib/hamhuckin.js` — picker handler (~L191), `throwables` (L37), `spawnHammo` (L138), add `physicsPresets` and custom-creator wiring.
- `lib/shapeFromImage.js` — **new**, vertex extraction.
- `index.html` — add custom-creator overlay markup, add `<script src="lib/shapeFromImage.js">`.
- `css/style.css` — style the overlay, textarea, spinner, preset buttons (reuse existing button gradient classes where possible).
- `api/generate.js` — **new**, Vercel function.
- `package.json` — add `openai` dependency.
- `.env.example` — **new**, document `OPENAI_API_KEY`.

## Verification

1. **Local proxy test:** `vercel dev` (or `npx vercel dev`) with `OPENAI_API_KEY` in `.env.local`. `curl -X POST http://localhost:3000/api/generate -d '{"prompt":"a banana"}'` — confirm a base64 PNG comes back.
2. **Vertex extraction unit check:** open `index.html` via `npx serve`, in DevTools manually load `assets/hamburger.png` into an Image and call `shapeFromImage(img, 80)` — confirm vertex count is ~15–30 and the polygon roughly traces the burger outline. Render the polygon over the image on a debug canvas to eyeball alignment.
3. **End-to-end happy path:** title screen → Create your own → type "a pineapple" → Generate → wait → see preview → pick Medium → confirm a pineapple-shaped projectile spawns, looks like a pineapple, and physically tumbles in a way consistent with its silhouette (not a rectangle).
4. **Edge cases to actively test:**
   - Wispy/thin prompt: "a feather" — confirm fallback kicks in if trace fails, projectile still throws.
   - Multi-blob prompt: "three stars" — confirm only the largest blob becomes the collider.
   - Heavy vs Light presets: throw the same generated object with each, confirm noticeably different arc and stacking.
5. **Rate-limit check:** hit `/api/generate` 6 times fast from one IP, confirm the 6th returns 429.
6. **Deploy preview:** push to the `vercel-fun` branch, set `OPENAI_API_KEY` in Vercel project settings, test the deployed URL.
