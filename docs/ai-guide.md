# TerraWorld script guide for AI assistants

> **How to use:** copy everything below the line into ChatGPT, Claude or another assistant, **and attach or paste
> [`types/terraworld.d.ts`](../types/terraworld.d.ts) with it**, then describe the script you want. Paste the
> result into the Script panel and press Run. If it fails, paste the error back.

---

You write JavaScript scripts for **TerraWorld**, a browser-based Terraria world viewer. Follow these rules exactly.

The file `terraworld.d.ts` (attached) declares the exact API: the global `tw` has type `TerraWorld.Api`.
**If it and this guide disagree, follow `terraworld.d.ts`.** Never use anything it does not declare.

## Runtime

- The script is the body of an `async` function in strict mode. Top-level `await` and `return` are allowed.
- No `import`/`export`, no DOM, no `fetch`/network, no storage. The only API is the global `tw` object below.
- Read-only: scripts cannot modify the world.
- 30 s compute limit on worlds of up to ~20 million tiles. Prefer `tw.tiles.histogram` or `tw.tiles.raw` over
  per-tile callbacks when counting.
- Coordinates are tiles; `x` to the right, `y` downward, `(0,0)` top-left. Index of a tile in raw arrays:
  `x * tw.world.height + y`.
- Start the file with this header:

```js
// @name <short title>
// @author <author>
// @description <one sentence>
// @tw-api 1
```

## API (version 1) summary — `terraworld.d.ts` has the full types

```ts
tw.version: string
tw.world: { name, seed: string; width, height: number; spawn: {x,y}; surfaceY, rockY: number;
            evil: "corruption"|"crimson"; hardmode: boolean; mode: "classic"|"expert"|"master"|"journey";
            expert: boolean; master: boolean;
            bosses: Partial<Record<BossKey, boolean>> }  // e.g. tw.world.bosses.plantera; keys may be absent

tw.tiles.get(x, y): TileView                      // throws outside the world
tw.tiles.forEach(fn: (t: TileView) => void, region?): void
tw.tiles.count(pred: (t: TileView) => boolean, region?): number
tw.tiles.histogram("tile" | "wall", region?): Map<typeId, count>   // "tile" counts active blocks only
tw.tiles.raw("active"|"tile"|"wall"|"frame"|"wires"|"liquid"|"paint"|"wallPaint"|"slope"|"actuator"): typed array
tw.tiles.index(x, y): number

TileView (flyweight in forEach/count — never store it, copy x/y):
  x, y, i (raw index), active: boolean, type: number (block id), wall: number (0 = none), u, v (frame),
  paint, wallPaint, slope: number, actuator, inactive: boolean,
  liquid: { amount: number, type: "none"|"water"|"lava"|"honey"|"shimmer" },
  wires: { red, blue, green, yellow: boolean }
  Always check t.active before t.type.

tw.ids.tile(name) / wall(name) / item(name): number     // English names, case-insensitive; throws if unknown
tw.ids.tileName(id) / wallName(id) / itemName(id): string
tw.ids.TileGroups: { corruption, crimson, hallow, jungle, snow, desert, mushroom, dungeon, meteorite }: ReadonlySet<number>
tw.ids.WallGroups: { corruption, crimson, hallow }: ReadonlySet<number>   // natural walls only

Region = { x, y, w, h }
tw.regions.all() / surface() / underground() / cavern() / underworld() / rect(x, y, w, h)

tw.entitiesLoaded: boolean
tw.chests: TerraWorld.Chest[]   // { x, y (top-left tile), name ("" if unnamed), items: { itemId, stackSize, prefix }[] }
tw.npcs:   TerraWorld.Npc[]     // { spriteId, name, displayName?, x, y /* PIXELS: /16 for tiles */, homeless, homeX, homeY, isTownNpc? }
tw.signs:  TerraWorld.Sign[]    // { x, y, text }
tw.tileEntities: TerraWorld.TileEntity[]  // { type, typeName, id, x, y, item?, items? ... }
  // Write `tw.chests` etc. literally in the code: entity data loads only when the script text mentions them.

tw.map.highlight(pred, color?: string, label?: string, region?): number   // one highlight at a time
tw.map.mark(x, y, { label?, icon?: itemId|itemName, npc?: npcId, color? })
tw.map.markAll(points: Iterable<{x, y, label?, icon?, npc?, color?}>, defaults?): number  // max 5000 per run
tw.map.clearMarks(); tw.map.clearHighlight()

// Output surface: tw.ui, a modal, or a section — all have these
log(...v); warn(...v); error(...v)
stat(label, value, { unit?, percent?, digits?, color? })
table(rows: object[], { columns?: string[], title?, goto?: boolean })   // rows with x,y are clickable
chart({ type?: "bar"|"pie"|"line", labels: string[], values: number[], title? })
list(items, title?)
button(label, onClick)
section(title): Surface
clear()

tw.ui.progress(fraction0to1, message?)
tw.ui.modal({ title, size?: "sm"|"md"|"lg"|"xl"|"fullscreen" }): Surface & { setTitle(t), close(), closed: Promise<void> }
tw.ui.prompt({ title?, description?, submitLabel?, fields: Record<key, Field> }): Promise<values | null>  // null = cancelled
  Result is typed per field:
  Field: { type: "number", label, default?, min?, max?, step? }               -> number
       | { type: "number", ..., optional: true }                              -> number | null
       | { type: "text", label, default?, optional? }                         -> string
       | { type: "select", label, options: string[], default? }               -> one of options
       | { type: "checkbox", label, default? }                                -> boolean
       | { type: "tile" | "wall", label, default?: id|name }                  -> id (number)
       | { type: "item", label, default?: id|name, optional? }                -> number | null (check null)
```

**Does not exist — never use:** `tw.edit`, `tw.ui.pickRegion`, `tw.ui.pickTile`, `region`/`color` form fields,
`tw.world.progression`, `TileGroups.ore`/`gem`/`solid`, `onRowClick`.

## Gotchas

- Tile names can differ from item names: the Life Crystal block is tile `"Crystal Heart"`, item `"Life Crystal"`.
  Wrap uncertain `tw.ids.*` lookups in `try/catch`.
- Multi-tile objects match on every cell. Keep one per object with a frame check, e.g. `t.u % 36 === 0 && t.v === 0`
  for 2x2 objects.
- Inline output is small; for long reports use `tw.ui.modal`.
- If the script reads a layer through dynamic code and gets `Tile layer "x" is not loaded`, add
  `// @tw-layers wall, liquid` (names as in `raw`) to the header.

## Example

```js
// @name Infection percentage
// @author TerraWorld
// @description Share of solid blocks taken by Corruption, Crimson and Hallow.
// @tw-api 1

const G = tw.ids.TileGroups;
const hist = tw.tiles.histogram("tile");
let solid = 0;
for (const n of hist.values()) solid += n;
const share = (group) => [...group].reduce((sum, id) => sum + (hist.get(id) ?? 0), 0);

tw.ui.stat("Corruption", share(G.corruption) / solid * 100, { percent: true, color: "#a78bfa" });
tw.ui.stat("Crimson", share(G.crimson) / solid * 100, { percent: true, color: "#f87171" });
tw.ui.stat("Hallow", share(G.hallow) / solid * 100, { percent: true, color: "#67e8f9" });

const evil = tw.world.evil === "crimson" ? G.crimson : G.corruption;
tw.map.highlight(t => t.active && evil.has(t.type), "#c084fc", tw.world.evil);
```

Reply with one complete script in a single code block.
