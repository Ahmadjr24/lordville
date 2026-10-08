# Lordville Asset Library

A browsable library of procedural 3D props. Every model is built in the browser from code with
[Three.js](https://threejs.org/) — no mesh or image files besides the card thumbnails.

| Code    | Asset            |
|---------|------------------|
| MED-001 | White medkit bag |
| MED-002 | Bandage set      |
| MED-003 | Medkit backpack  |
| MED-004 | Blood bag        |
| WPN-001 | Arming sword     |
| WPN-002 | Machete          |
| MED-005 | Capsule pill     |
| GER-001 | Night vision goggles |
| GER-002 | Eyeglasses       |
| CTB-001 | Bag of weed      |

## Layout

```
index.html            library page (grid + 3D inspection view)
src/app.js            UI, routing (#asset-id) and the viewer
src/registry.js       the catalogue: codes, names, categories, pose, copy
src/kit.js            shared modelling kit: soft fabric boxes, swept straps, zippers,
                      stitching, decals, buckles, blades, procedural textures
src/assets/<id>.js    one file per asset, exporting build() → THREE.Object3D
thumbs/<id>.webp      card thumbnails (transparent background)
tools/thumbs.mjs      renders thumbnails with headless Chromium
```

`index.html` is written as a page fragment (no `<html>`/`<body>` wrapper) because the publisher
adds the document skeleton. Browsers render it fine as-is; serve the folder over HTTP
(e.g. `npx serve .`) since ES modules don't load from `file://`.

## Adding an asset

1. Create `src/assets/<id>.js` exporting `build()`. Use the kit (1 scene unit = 10 cm).
2. Add an entry to `ASSETS` in `src/registry.js` (code, name, category, summary, features, pose, view).
3. Render its thumbnail: `npm i -D playwright && node tools/thumbs.mjs <id>`.
