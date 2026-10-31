# ☔ 星降マート — Rainy Night Diorama

> An interactive, collectible-looking 3D miniature of a Japanese convenience-store street corner on a rainy night. Built with Three.js, fully procedural, no external assets.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Three.js](https://img.shields.io/badge/Three.js-r160-000000.svg)](https://threejs.org/)
[![Language: JavaScript](https://img.shields.io/badge/language-JavaScript-F7DF1E.svg)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Portable build](https://img.shields.io/badge/build-single--file%20HTML-ff69b4.svg)](#-portable-build)
[![No build step](https://img.shields.io/badge/run-zero--config%20HTML-00bcd4.svg)](#-getting-started)

---

## ✨ What it is

A self-contained WebGL diorama: a Japanese convenience store (**星降マート / HOSHIFURI MART**) sitting on a square plinth, at night in the rain. It uses a third-person orbit camera, an anime toon-shaded look, wet neon reflections and real-time rain — with **no UI overlay**. Everything is generated procedurally at load time.

## 🎯 Features

- 🏪 **Luminous convenience store** — glass frontage, projecting blade sign, automatic sliding door, awning, interior warm light
- 🌧️ **Real-time rain** — streaks, puddles and wet reflective road surface
- 💡 **Toon shading** — automatic outlines on medium/large meshes, neon glow, warm interior vs. cool streetlamp contrast
- 🛣️ **Full street corner** — roads, reflective zebra crossings, vending machines, bicycle, streetlamp, utility pole + wires, alley, a café (喫茶 月灯) and a far-side bar (スナック星屑)
- 🖱️ **Orbit camera** — drag to orbit, wheel / pinch to zoom; no buttons or labels
- 🧩 **Fully procedural** — no images, fonts, or network requests; runs straight from `file://`
- 📦 **Single-file portable build** in `dist/`

## 🧰 Tech stack

| Piece | Detail |
|-------|--------|
| Renderer | Three.js **r160** (vendored UMD in `vendor/three.min.js`) |
| Language | Vanilla JavaScript, plain `<script>` globals (`window.DIORAMA`) |
| Shading | Custom toon material + outline pass + additive glow decals (no postprocessing dependency) |
| Assets | 100% procedural geometry & canvas textures |

## 🚀 Getting started

Open **`index.html`** directly in a browser — it works from `file://`, no server required.
Prefer a single portable file? Open **`dist/hoshifuri-mart-rainy-night.html`** instead.

To rebuild the portable single-file build from sources:

```bash
npm install      # optional; three is already vendored
npm run build    # -> dist/hoshifuri-mart-rainy-night.html
```

## 🕹️ Controls

- **Drag** — orbit the camera around the diorama
- **Wheel / pinch** — zoom in and out

There is intentionally no on-screen UI; all signage lives *inside* the 3D model.

## 📂 Project structure

```
rainy-store/
├── index.html              # dev entry; loads vendor + src scripts in order
├── vendor/
│   └── three.min.js        # Three.js r160 (vendored UMD)
├── src/
│   ├── core.js             # shared kit: palette, toon materials, geometry & signage helpers, outline pass
│   ├── street.js           # base, roads, pavements, wet markings, crossings
│   ├── store.js            # convenience store: shell, interior, signage, awning, door
│   ├── props.js            # street furniture: vending machines, bicycle, poles, bins, guardrail
│   ├── background.js       # neighbourhood buildings, alley, café, greenery
│   ├── ambient.js          # lighting rig + rain system
│   └── main.js             # renderer, camera, orbit interaction, assembly & batching
├── tools/
│   └── build.js            # inlines every runtime asset into one portable HTML file
└── dist/                   # generated single-file build (git-committed)
```

## 🛠️ How it is assembled

`index.html` loads the scripts in a fixed order; `main.js` then calls each builder once:

```js
D.buildStreet(D.groups.street, D.groups.base);
D.buildBackground(D.groups.background);
D.buildStore(D.groups.store);
D.buildProps(D.groups.props);
D.buildAmbient(D.groups.ambient);
```

Each builder attaches its meshes to a dedicated `THREE.Group` layer, so modules compose into one model without colliding. Shared helpers (geometry, materials, text textures, glow) live in `src/core.js` under the `window.DIORAMA` (`D`) namespace.

## 📜 License

Released under the [MIT License](LICENSE) © 2026 **skywalkerqqq**.
