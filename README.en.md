<p align="center">
  <img src="assets/stages/halyard-day.webp" alt="Halyard Marina at golden hour" width="100%">
</p>

<h1 align="center">INKWAVE · Chinese Edition</h1>

<p align="center">
  An original Splatoon-style 4v4 turf-war shooter that runs in your browser.<br>
  Paint the ground, swim through your ink, out-turf the other team.
</p>

<p align="center">
  <a href="#quick-start"><b>▶ Play now</b></a> ·
  <a href="#controls">Controls</a> ·
  <a href="#running-locally">Run locally</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#platform-roadmap">Platforms</a> ·
  <a href="README.md">中文</a>
</p>

<p align="center">
  <img alt="three.js r186" src="https://img.shields.io/badge/three.js-r186-000000?logo=three.js&logoColor=white">
  <img alt="No build step" src="https://img.shields.io/badge/build-none%20needed-2ea44f">
  <img alt="ES Modules" src="https://img.shields.io/badge/modules-ESM-f7df1e?logo=javascript&logoColor=black">
  <img alt="WebGL 2" src="https://img.shields.io/badge/WebGL-2-990000?logo=webgl&logoColor=white">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue"></a>
</p>

<p align="center">
  <img alt="Languages" src="https://img.shields.io/badge/i18n-中文%20%7C%20English-ff69b4">
  <img alt="Default language" src="https://img.shields.io/badge/default%20language-Chinese-c8102e">
  <img alt="Dictionary keys" src="https://img.shields.io/badge/strings-465%20keys-4c1">
  <img alt="GPU memory" src="https://img.shields.io/badge/VRAM-151%20→%2054%20MB%20(-64%25)-brightgreen">
</p>

<p align="center">
  <img alt="Platform: Web" src="https://img.shields.io/badge/Web-supported-success?logo=googlechrome&logoColor=white">
  <img alt="Platform: Windows" src="https://img.shields.io/badge/Windows-planned-blue?logo=windows&logoColor=white">
  <img alt="Platform: Android" src="https://img.shields.io/badge/Android-planned-blue?logo=android&logoColor=white">
  <img alt="Platform: Linux" src="https://img.shields.io/badge/Linux-planned-blue?logo=linux&logoColor=white">
</p>

<p align="center">
  <img alt="Code size" src="https://img.shields.io/badge/JS-46%2C417%20lines-informational">
  <img alt="Files" src="https://img.shields.io/badge/files-618-informational">
  <img alt="Dependencies" src="https://img.shields.io/badge/runtime%20deps-1%20(three.js)-informational">
</p>

---

## What this is

This is a **Chinese-localized + performance-optimized fork** of **[INKWAVE](https://github.com/DevFrancois/inkwave)**.

**Every upstream feature is fully intact.** On top of that this fork adds complete Chinese localization, a large GPU-memory reduction, and four upstream bug fixes.

> Original author: **Jayden Davis** · Upstream: **https://github.com/DevFrancois/inkwave**
> This fork would not exist without it — please star the original too.

---

## What  changes

### 1. Full Chinese localization

| Item | Detail |
|---|---|
| Languages | Chinese / English, **Chinese by default** |
| Strings | 465 keys, **en/zh key sets verified identical** (no gaps, no extras) |
| Font | Bundled LXGW 975 Yuan SC subset (400 + 700), 273 KB total |
| Typography | Latin-first font stack, Chinese falls back to the round face; mixed runs stay aligned |
| Switching | Settings → Controls → **语言 / Language**, applies instantly, no reload |

**How it is wired**: no i18n library, and no `t()` call injected at ~400 call sites.
- `src/config.js` UI strings became lazy getters
- UI modules use lazy arrays/objects and rebuild in place on language change
- The whole runtime is 66 lines (`src/i18n/i18n.js`) with zero game dependencies

**Deliberately left in English**: the `INKWAVE` brand, `Turf Riot`, key names (`Esc` / `Enter` / `Shift` / `Space` / `Tab`), rank names, team names, bot names, and the 10 preset character names. 

### 2. Memory / CPU optimization

| Tier | Change | Why |
|---|---|---|
| `high` | MSAA 4 → 2 | 4× MSAA on an HDR target is very expensive for almost no visible gain |
| `high` | Shadow map 4096 → 2048 | **Saves 48 MB on its own** |
| `high` | Paint atlas 4096 → 2048 | **Saves 48 MB on its own** |
| `ultra` | pixelRatio 2.0 → 1.5 | On 4K that asks for a 7680×4320 target (~530 MB) — the actual OOM case |
| `ultra` | MSAA 4 → 2 | Same reason |
| all | GTAO samples scale with tier | Lower tiers no longer pay the ultra sampling cost |
| — | Portrait render targets and readback buffer reused per size | Previously rebuilt GPU buffers on every call |
| — | Idle frames skip paint drawing/drying | No busy-work while paused, in menus, or spectating |

**Measured (1920×1080, `high`)**

| Resource | Before | After |
|---|---|---|
| Paint atlas | 4096² = 64.0 MB | 2048² = 16.0 MB |
| Shadow map | 4096² = 64.0 MB | 2048² = 16.0 MB |
| Paint normal map | 512² = 1.0 MB | 256² = 0.3 MB |
| **Total GPU buffers** | **151.0 MB** | **54.3 MB (−64%)** |

`ultra` keeps 4096 shadows and the large atlas for big screens and discrete GPUs. `medium` and `low` are untouched.

### 3. Upstream bugs fixed

1. **Results screen stuck at 0:00** — a local variable `t` inside `judge()` in `src/ui/hud.js` shadowed the i18n `t` function, causing a TDZ `ReferenceError`. Because the throw happened inside a `Promise` executor, the promise never resolved and the results screen never arrived. Renamed the local (11 sites).
2. **Match state advanced far too slowly at low frame rates** — `stateT` in `src/game/match.js` accumulated a `dt` already clamped by `THREE.Timer` (~0.0208 s max), so state transitions took 100+ frames when fps dropped. Now derived from `performance.now()`.
3. **Dynamic resolution leaked VRAM** — `setDynamicScale()` in `src/core/renderer.js` changed the pixel ratio without disposing `renderTarget1/2`, leaking the whole HDR buffer on every step down. Added the `dispose()` calls.
4. **Silent freeze on VRAM exhaustion** — added a `webglcontextlost` handler with an on-screen notice instead of a dead black screen.

---

## Upstream features

- **Turf war, 4 v 4.** Three minutes, most ground painted wins. Play against bots on three difficulty levels.
- **Squid form.** Hold to dive into your ink: swim fast, refill your tank, climb inked walls, dolphin-jump water gaps.
- **Seven weapons**, each with its own feel: Spritzer (shooter), Swell Roller, Glint Charger, Popper Blaster, Twinfin Dualies (dodge roll), Tidebucket Slosher and Gyre Splatling. Every kit comes with Splat Bombs and a special.
- **Three stages, day or dusk.** Tidewater Plaza, Kelpline Terminal and Halyard Marina, a working marina with a car ferry moored across the middle where the water gaps are the whole point.
- **Ink that behaves like liquid.** Splats spread and settle, fresh ink is glossy and dries, drips run down walls, and swimming leaves a wake in the surface itself.
- **A map you can actually read.** Hold <kbd>Tab</kbd> and the camera cranes up into a tilt-shift diorama of the live stage, with pins for your team and one-click Super Jumps.
- **Locker.** Choose your squidkid: tentacle style, headgear, face, outfit.
- **Everything procedural.** Characters, animation, weapons, textures, props, sound effects and music are all generated in code. There are no downloaded assets except two fonts.

<p align="center">
  <img src="assets/stages/tidewater-day.webp" width="49%" alt="Tidewater Plaza">
  <img src="assets/stages/kelpline-dusk.webp" width="49%" alt="Kelpline Terminal at dusk">
</p>

## Controls

| Action | Keyboard / mouse | Gamepad |
|---|---|---|
| Move | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> | Left stick |
| Aim | Mouse | Right stick |
| Fire | Left click | RT |
| Squid form | <kbd>Shift</kbd> | LT |
| Jump / dodge roll | <kbd>Space</kbd> | A |
| Sub weapon (bomb) | Right click / <kbd>E</kbd> | RB |
| Special | <kbd>F</kbd> | Y |
| Map + Super Jump | Hold <kbd>Tab</kbd> or <kbd>M</kbd>, then <kbd>1</kbd>–<kbd>4</kbd> or click a pin | View |
| Pause | <kbd>Esc</kbd> | Start |

Gamepads work on the hosted (https) version. On a plain `http://` LAN address browsers block the Gamepad API.

## Running locally

There is no build step. Any static file server works; the included one also serves to your LAN and sends no-cache headers so module updates are never stale.

```bash
git clone https://github.com/JackalEthen/InkWave-zh.git
cd InkWave-zh
npm start        # http://localhost:8490
```

Useful URL parameters: `?map=halyard&time=dusk` picks a stage, `&autostart=180` skips the menus into a 180 s match, `&autopilot` lets a bot drive you.

```bash
npm install      # once, for the headless tools
npm run check    # syntax-check every module
npm run smoke    # boot + 8 s of autopilot in headless Chrome, fails on console errors
npm run build    # assemble dist/ (game + only the three.js addons it imports)
```

> Windows note: the `package.json` scripts are written for POSIX shells and may not run under PowerShell. Use `python tools/serve.py 8490` directly to start the server.

## How it works

- **Ink is painted in texture space.** Every paintable face owns a region of one large atlas; splats are drawn into it on the GPU while a coarse CPU grid keeps the turf score and gameplay queries in sync. The level shader layers the ink over the surface with its own height, gloss and wetness. See [`src/world/paint.js`](src/world/paint.js) and [`src/world/inkShading.js`](src/world/inkShading.js).
- **Stages are data.** A layout is a list of boxes and ramps for one half of the arena; the other half is the 180° rotation, so both teams always get an identical field. Ambient occlusion is baked offline (`tools/bake-ao.mjs`). See [`src/world/maps.js`](src/world/maps.js).
- **Characters are fully procedural.** Geometry, materials, a 60-bone rig and every animation (locomotion, squid form, weapon poses, secondary motion) are code, driven by a spring-based pose system. See [`docs/RIG.md`](docs/RIG.md).
- **Systems talk through events.** Weapons, actors and the match emit typed events; effects, HUD and audio subscribe. The contract is documented in [`docs/EVENTS.md`](docs/EVENTS.md) and [`docs/CONTRACTS.md`](docs/CONTRACTS.md).
- **Deterministic tooling.** The game exposes a freeze/step debug interface so filmstrips, handling measurements and bot simulations are reproducible frame by frame (`tools/film.py`, `tools/measure-handling.mjs`).

Rendering is three.js r186 (vendored, plain ES modules with an import map) with GTAO, bloom and a custom grade pass.

## Platform roadmap

| Platform | Status | Notes |
|---|---|---|
| **Web** | ✅ **Supported** | Chrome and Edge are the target; Firefox works.  |
| **Windows** | 🔜 Planned | Packaged with [Tauri 2](https://v2.tauri.app/), installer roughly 12–25 MB |
| **Android** | 🔜 Planned | Same Tauri 2 codebase; **touch controls must be added first** (currently keyboard/mouse + gamepad only) |
| **Linux** | 🔜 Planned | Tauri 2, requires WebKitGTK 2.40+ (Ubuntu 22.04 or newer) |
| **iOS** | ❌ Not supported | Not planned |
| **macOS** | ❌ Not supported | Not planned |

## Contributing

Issues and pull requests are welcome. The upstream [CONTRIBUTING.md](CONTRIBUTING.md) covers the project layout and the checks to run first.

For localization problems specific to this fork (missing or wrong translations, layout overflow), please open an issue in this repository with a screenshot and the screen you were on.

## License & credits

Released under the **MIT** license.

```
MIT License
Copyright (c) 2026 Jayden Davis
```

- **Original project**: [DevFrancois/inkwave](https://github.com/DevFrancois/inkwave) by **Jayden Davis**
- **This fork**: maintained by **[@JackalEthen](https://github.com/JackalEthen)**, adding Chinese localization and performance work
- The upstream `LICENSE` file and copyright notice are **retained verbatim**

INKWAVE is an independent project and is not affiliated with Nintendo; Splatoon is a trademark of Nintendo.