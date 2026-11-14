# Editing the world (`tw.edit`)

Since **API 1.2.0** a script can change blocks, walls, paint, liquids and slopes. Nothing is ever written behind your
back: the script only builds a **draft**, TerraWorld shows it on the map, and **you** press Apply or Cancel.

The exact signatures are in [`types/terraworld.d.ts`](../types/terraworld.d.ts) (`TerraWorld.Edit`); when this page
and the `.d.ts` disagree, the `.d.ts` is right.

## The three steps

```js
// 1. Draft: nothing in the world changes yet.
tw.edit.replace({ from: "Ebonstone Block", to: "Stone Block" });

// 2. Preview: the map shows the changed cells in orange; the script waits for Apply / Cancel.
const result = await tw.edit.commit({ label: "Ebonstone → Stone" });

// 3. Report what happened.
if (result.applied) tw.ui.stat("Changed", result.count, { unit: "tiles" });
else tw.ui.log("Cancelled: the world was not changed.");
if (result.skipped) tw.ui.warn(`${result.skipped} cells were left alone (furniture or modded).`);
```

1. **Draft.** `setTile`, `replace`, `fill` and the other functions below only write to a draft inside the script.
   The world does not change.
2. **Commit.** `await tw.edit.commit({ label })` hides open script modals, highlights every changed cell on the map
   in orange, and shows a bar with the number of cells, how many will be skipped and why, **Show area**, **Cancel**
   and **Apply** (<kbd>Esc</kbd> cancels). Waiting here does not count toward the 30 s limit.
3. **Apply.** Applied changes become **one undo step**. Undo it from the Script panel (*Undo* / *Redo* next to
   "Applied: …") or from Edit Mode's History / <kbd>Ctrl</kbd>+<kbd>Z</kbd>. You do not need to turn on Edit Mode.
   Save the world as usual to keep the change.

`commit()` empties the draft whether the user applies or cancels, so a script can commit several parts; each is its
own undo step. Committing an empty draft resolves at once with `applied: false`. A draft that is never committed is
thrown away when the script ends, with a warning in the output.

### `CommitResult`

| Field | Meaning |
|---|---|
| `applied` | `true` when the user pressed Apply |
| `count` | Cells changed (0 when cancelled) |
| `skipped` | Cells left alone for safety; the sum of `skippedBy` |
| `skippedBy.modded` | tModLoader-owned cells |
| `skippedBy.object` | Cells holding furniture or other multi-tile objects (chests, doors, trees…), which would break |
| `skippedBy.shape` | Slopes or half blocks the block cannot take |

Always check `result.applied` before telling the user something changed.

## Functions

Ids can be numbers or English names, as in `tw.ids.tile()` / `tw.ids.wall()`.

| Function | Effect on the draft |
|---|---|
| `setTile(x, y, tile)` | Place a block. Keeps the cell's paint, and its slope when the new block allows it |
| `clearTile(x, y)` | Remove the block, with its paint, slope and actuator |
| `setWall(x, y, wall)` / `clearWall(x, y)` | Place / remove a wall |
| `setPaint(x, y, color)` / `setWallPaint(x, y, color)` | Paint id 0–31; 0 removes paint |
| `setLiquid(x, y, type, amount?)` | `"water"`, `"lava"`, `"honey"`, `"shimmer"`; amount 0–255, default 255. `"none"` or 0 removes it |
| `setSlope(x, y, slope)` | `"full"`, `"half"`, `"topRight"`, `"topLeft"`, `"bottomRight"`, `"bottomLeft"` (or 0–5). Skipped at commit when the cell has no block or the block cannot take that shape |
| `replace({ from, to, kind?, region? })` | Replace matching blocks (or walls with `kind: "wall"`). Returns how many cells were drafted |
| `fill(region, { tile?, wall?, paint?, wallPaint?, liquid? })` | Set those fields on every cell of `region`; `null` removes. Returns the number of cells |
| `count` | Cells in the current draft |
| `discard()` | Empty the draft without asking |
| `commit({ label? })` | Preview and wait for Apply / Cancel; resolves to a `CommitResult` |

### `replace` is the tool of choice

Prefer one `replace` over a loop of `setTile` calls: it is much faster, reads clearly, and covers most jobs.

- `from` takes an id, a name, or a set/array of them, so `tw.ids.TileGroups.corruption` works directly.
- `to` takes an id, a name, `null` (remove), or a **function of the old id** `(id, x, y) => …`. Return `undefined`
  from the function to leave that cell alone. One `replace` can therefore apply a whole conversion table:

```js
const region = await tw.ui.pickRegion({ title: "Select the area to purify" });
if (!region) return;
const pure = new Map([
  [tw.ids.tile("Ebonstone Block"), "Stone Block"],
  [tw.ids.tile("Crimstone Block"), "Stone Block"],
  [tw.ids.tile("Corruption Thorns"), null],
]);
const drafted = tw.edit.replace({ from: pure.keys(), to: (id) => pure.get(id), region });
if (!drafted) return tw.ui.log("Nothing to purify here.");
await tw.edit.commit({ label: "Purify area" });
```

- `kind: "wall"` replaces walls; it needs the wall layer, which is loaded automatically when the script mentions
  the word "wall" (or add `// @tw-layers wall`).
- `region` defaults to the whole world.

## Safety rules

TerraWorld checks these when you draft **and again when you commit**:

- **Only plain vanilla blocks and walls can be placed.** Drafting furniture or other multi-tile objects
  (frame-important tiles, e.g. chests, doors, torches) or a modded id **throws an error** right away.
- **Furniture and modded cells are skipped, not broken.** Replacing or clearing a cell that holds an object is skipped
  (`skippedBy.object`); cells owned by a mod are never touched (`skippedBy.modded`). Painting an object's cell, or
  changing its wall or liquid, is allowed.
- **Shapes the block cannot take are skipped** (`skippedBy.shape`).
- If the world cannot be edited safely (for example a mod-safe editing restriction), `commit()` throws with the reason.
- If you change the world by hand while the preview is open, Apply re-plans against the current world.

## Reads always see the snapshot

`tw.tiles.*` and the other read APIs always show the world **as it was when the run started**. They do not see the
draft, and they do not see applied changes either, even after `commit()` resolves:

```js
tw.edit.setTile(10, 10, "Stone Block");
await tw.edit.commit();
tw.tiles.get(10, 10).type; // still the old block in this run
```

`replace` likewise matches against the world as loaded. Plan every change from that snapshot. The next run sees the
edited world.

## Limits

| Limit | Value |
|---|---|
| Cells per draft | 1,000,000 (drafting more throws; commit in parts) |
| Preview warning | above 100,000 cells: large edits use a lot of undo memory, so older undo steps may be dropped |

## Not supported yet

Placing multi-tile objects (furniture), editing wires and actuators, and editing entities (chests, signs…).
The preview has no before/after toggle yet.

## Samples

- [`ebonstone-to-stone.js`](../samples/ebonstone-to-stone.js): one `replace` over the whole world.
- [`purify-region.js`](../samples/purify-region.js): `pickRegion` + `replace` with a conversion function.

Both have *Open in TerraWorld* links in [samples/README.md](../samples/README.md).
