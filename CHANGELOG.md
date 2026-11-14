# Changelog

Versions of the `tw` script API, as declared by `@tw-api-version` in
[`types/terraworld.d.ts`](types/terraworld.d.ts). Minor versions only add features; a script written for an older
1.x version keeps working. Scripts declare the major version in their header (`// @tw-api 1`).

## 1.2.0

- **`tw.edit`**: scripts can change the world. Changes are drafted, previewed on the map and applied only when the
  user presses Apply, as one undo step. `setTile`, `clearTile`, `setWall`, `clearWall`, `setPaint`, `setWallPaint`,
  `setLiquid`, `setSlope`, `replace`, `fill`, `count`, `discard`, `commit` → `CommitResult`.
  See [docs/editing.md](docs/editing.md).
- Only plain vanilla blocks and walls can be placed; furniture and modded cells are skipped.
- New samples: [`ebonstone-to-stone.js`](samples/ebonstone-to-stone.js), [`purify-region.js`](samples/purify-region.js).
- **Share links**: `https://terraworld.dev/world#script=1.<payload>` opens a script in the editor without running it.
  See [docs/share-links.md](docs/share-links.md); [`tools/make-link.mjs`](tools/make-link.mjs) makes them, and every
  sample has an *Open in TerraWorld* link.

## 1.1.0

- `tw.ui.pickRegion({ title? })` and `tw.ui.pickTile({ title? })`: the user drags a rectangle or clicks a tile on the map.
- `region` form field for `tw.ui.prompt`.
- New sample: [`ores-in-region.js`](samples/ores-in-region.js).
- The app's Script editor became a code editor with `tw.*` suggestions, and can save into `twscript`.

## 1.0.0

- First version: `tw.world`, `tw.tiles`, `tw.ids`, `tw.regions`, entities, `tw.map`, `tw.ui` (blocks, modals, `prompt`).
  Read-only.
