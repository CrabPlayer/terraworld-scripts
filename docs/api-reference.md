# API reference (`tw` version 1)

Everything a script can use lives on the global `tw` object. This page lists what **exists today**.
Planned features that are not available yet are listed at the end; do not use them.

The exact types are in [`types/terraworld.d.ts`](../types/terraworld.d.ts) (namespace `TerraWorld`, e.g.
`TerraWorld.Chest`). **When this page and the `.d.ts` disagree, the `.d.ts` is right.**

Coordinates are tile coordinates: `x` grows to the right, `y` grows downward, `(0, 0)` is the top-left corner.

- [`tw.version`](#twversion)
- [`tw.world`](#twworld)
- [`tw.tiles`](#twtiles) and [`TileView`](#tileview)
- [Tile layers and `@tw-layers`](#tile-layers-and-tw-layers)
- [`tw.ids`](#twids)
- [`tw.regions`](#twregions)
- [`tw.chests`, `tw.npcs`, `tw.signs`, `tw.tileEntities`](#entities)
- [`tw.map`](#twmap) (details in [map-marks.md](map-marks.md))
- [`tw.ui`](#twui) (details in [ui-blocks.md](ui-blocks.md))
- [Not available yet](#not-available-yet)

## `tw.version`

`string` — the API version, currently `"1.0.0"`.

## `tw.world`

Read-only facts about the open world.

| Property | Type | Notes |
|---|---|---|
| `name` | `string` | World name |
| `seed` | `string` | |
| `width`, `height` | `number` | Size in tiles |
| `spawn` | `{ x, y }` | Spawn point |
| `surfaceY` | `number` | Surface level (where the underground starts) |
| `rockY` | `number` | Rock layer (where the cavern starts) |
| `evil` | `"corruption" \| "crimson"` | |
| `hardmode` | `boolean` | |
| `mode` | `"classic" \| "expert" \| "master" \| "journey"` | |
| `expert` | `boolean` | `true` in Expert **and** Master |
| `master` | `boolean` | |
| `bosses` | `Partial<Record<BossKey, boolean>>` | Defeated bosses and events. Keys missing in older worlds are absent |

`BossKey` is one of: `eyeOfCthulhu`, `eaterOfWorldsOrBrain`, `skeletron`, `queenBee`, `destroyer`, `twins`,
`skeletronPrime`, `anyMechanicalBoss`, `plantera`, `golem`, `kingSlime`, `dukeFishron`, `lunaticCultist`,
`moonLord`, `pumpking`, `mourningWood`, `iceQueen`, `everscream`, `santaNk1`, `solarPillar`, `vortexPillar`,
`nebulaPillar`, `stardustPillar`, `empressOfLight`, `queenSlime`, `deerclops`.

```js
if (tw.world.bosses.plantera) tw.ui.log("Plantera is down");
```

## `tw.tiles`

| Function | Returns | Notes |
|---|---|---|
| `get(x, y)` | `TileView` | One tile. Throws `RangeError` outside the world. Returns a new view each call |
| `forEach(fn, region?)` | `void` | Calls `fn(tile)` for every tile, column by column |
| `count(pred, region?)` | `number` | How many tiles `pred(tile)` returns `true` for |
| `histogram(layer = "tile", region?)` | `Map<number, number>` | Counts per type id in one fast pass. `"tile"` counts active tiles by block type; `"wall"` counts walls by wall type (wall 0 = no wall is skipped) |
| `raw(layer)` | typed array | Direct read-only access to one layer for maximum speed; see below |
| `index(x, y)` | `number` | Index into a `raw()` array: `x * tw.world.height + y` |

`region` is optional everywhere; leave it out for the whole world. See [`tw.regions`](#twregions).

**Speed tips** (a large world has ~20 million tiles):

- Prefer `histogram` when you only need counts by type.
- `forEach`/`count` reuse one `TileView` object. Read what you need inside the callback; **do not store `t`**,
  store `{ x: t.x, y: t.y }` instead.
- Check `t.active` before `t.type`: a cell with no block can still carry a type number.
- `raw()` is the fastest path:

```js
const active = tw.tiles.raw("active");
const types = tw.tiles.raw("tile");
const H = tw.world.height;
const gold = tw.ids.tile("Gold Ore");
let n = 0;
for (let x = 0; x < tw.world.width; x++) {
  for (let y = 0; y < H; y++) {
    const i = x * H + y;
    if (active[i] && types[i] === gold) n++;
  }
}
tw.ui.stat("Gold Ore", n);
```

`raw(layer)` accepts the public layer names below. For layers backed by two arrays it returns the **first** one:
`"frame"` → `u`, `"liquid"` → liquid type, `"actuator"` → actuator flag. Use `TileView` for the others.

## `TileView`

What `get`, `forEach`, `count` and the `highlight` predicate receive. All properties are read-only.

| Property | Type | Layer needed |
|---|---|---|
| `x`, `y` | `number` | — |
| `i` | `number` — index into `raw()` arrays (`x * height + y`) | — |
| `active` | `boolean` — a block is present | `active` (always loaded) |
| `type` | `number` — block type id | `tile` (always loaded) |
| `wall` | `number` — wall type id, 0 = none | `wall` |
| `u`, `v` | `number` — sprite frame of multi-tile objects | `frame` |
| `paint` | `number` — block paint id | `paint` |
| `wallPaint` | `number` — wall paint id | `wallPaint` |
| `slope` | `number` — 0 full block, 1 half block, 2–5 slopes | `slope` |
| `actuator`, `inactive` | `boolean` | `actuator` |
| `liquid` | `{ amount: number, type: "none" \| "water" \| "lava" \| "honey" \| "shimmer" }` | `liquid` |
| `wires` | `{ red, blue, green, yellow: boolean }` | `wires` |

## Tile layers and `@tw-layers`

To save memory the app only copies the tile layers a script needs into the sandbox. `active` and `tile` are always
loaded. Others are detected by scanning the script text for words such as `wall`, `liquid`, `paint`, `.u`/`.v`,
`slope`, `actuator`/`inactive`, `wire`.

If detection misses (for example, you build property names dynamically), you get an error like
`Tile layer "wall" is not loaded`. Fix it with a header line:

```js
// @tw-layers wall, liquid
```

Layer names: `active`, `tile`, `wall`, `frame`, `wires`, `liquid`, `paint`, `wallPaint`, `slope`, `actuator`,
or `all`. Only the first `@tw-layers` line in the file is read. Detection also scans comments, so a comment that
mentions "walls" loads the wall layer too; that only costs memory.

## `tw.ids`

Convert between names and numeric ids. Names use Terraria's English names and are case-insensitive.

| Function | Notes |
|---|---|
| `tile(name)`, `wall(name)`, `item(name)` | Name → id. Throws `Unknown tile name: "..."` if not found |
| `tileName(id)`, `wallName(id)`, `itemName(id)` | Id → name, or `"Tile #id"` / `"Wall #id"` / `"Item #id"` if unknown |
| `TileGroups` | `Record<group, ReadonlySet<number>>` of block ids |
| `WallGroups` | `Record<group, ReadonlySet<number>>` of wall ids |

**Tile names can differ from item names.** The Life Crystal block is the tile `"Crystal Heart"` but the item
`"Life Crystal"`. When a name throws, try the other spelling, or wrap the lookup:

```js
let id;
try { id = tw.ids.tile("Some Block"); } catch { id = null; }
```

`TileGroups` keys: `corruption`, `crimson`, `hallow`, `jungle`, `snow`, `desert`, `mushroom`, `dungeon`,
`meteorite`. They come from the same table as TerraWorld's biome view, so script results match what the map shows.
Only vanilla blocks are included.

`WallGroups` keys: `corruption`, `crimson`, `hallow`. These are the natural, spreading walls only; player-placed
variants (such as brick walls) are not counted as infection.

## `tw.regions`

A region is a plain object `{ x, y, w, h }` in tiles. You can write one yourself or use the helpers:

| Function | Area |
|---|---|
| `all()` | Whole world |
| `surface()` | Top of the world down to `surfaceY` |
| `underground()` | `surfaceY` to `rockY` |
| `cavern()` | `rockY` to 200 tiles above the bottom |
| `underworld()` | Bottom 200 tiles |
| `rect(x, y, w, h)` | Any rectangle, clipped to the world |

## Entities

| Property | Contents |
|---|---|
| `tw.chests` | `Chest[]`: `{ x, y, name, items: ChestItem[], maxItems? }`; `x`,`y` is the top-left tile; `name` is `""` when unnamed; `ChestItem` is `{ itemId, stackSize, prefix, modName?, modItemName?, slot?, favorited? }` |
| `tw.npcs` | `Npc[]`: `{ spriteId, name, displayName?, x, y, homeless, homeX, homeY, variation, isTownNpc?, modName?, modClassName? }` — `x`/`y` are in **pixels** (divide by 16 for tiles); `homeX`/`homeY` are tiles, `-1` when homeless |
| `tw.signs` | `Sign[]`: `{ x, y, text }` |
| `tw.tileEntities` | `TileEntity[]`: `{ type, typeName, id, x, y, npcId?, item?, logicCheck?, on?, items?, dyes?, misc?, pose? }`; `typeName` is e.g. `"ItemFrame"`, `"DisplayDoll"`, `"LogicSensor"`, `"WeaponsRack"`, `"TeleportationPylon"`; item slots are `{ itemId, stackSize, prefix }` or `null` |
| `tw.entitiesLoaded` | `boolean` — `false` if entity data could not be loaded |

Entity data is parsed on demand: the app loads it only when the script text contains `tw.chests`, `tw.npcs`,
`tw.signs` or `tw.tileEntities` **written literally**. Avoid `const { chests } = tw` as the only mention.

```js
if (!tw.entitiesLoaded) { tw.ui.warn("No chest data for this world."); return; }
const named = tw.chests.filter(c => c.name);
tw.ui.table(named.map(c => ({ x: c.x, y: c.y, name: c.name, items: c.items.length })));
```


## `tw.map`

| Function | Notes |
|---|---|
| `highlight(pred, color?, label?, region?)` | Paint matching tiles. Returns the number painted |
| `mark(x, y, opts?)` | One map pointer |
| `markAll(points, defaults?)` | Many pointers. Returns how many were added |
| `clearMarks()` | Remove this script's pointers |
| `clearHighlight()` | Remove the highlight |

See [map-marks.md](map-marks.md).

## `tw.ui`

Output to the Script panel, modals and forms.

| Function | Notes |
|---|---|
| `log(...)`, `warn(...)`, `error(...)` | Text lines |
| `stat(label, value, opts?)` | A big number |
| `table(rows, opts?)` | A table from an array of objects |
| `chart(spec)` | Bar, pie or line chart |
| `list(items, title?)` | Bullet list |
| `button(label, onClick)` | A button that runs `onClick` inside the script |
| `section(title)` | Group of blocks; returns a surface with the same functions |
| `clear()` | Clear the output |
| `progress(fraction, message?)` | Progress bar, `fraction` from 0 to 1 |
| `modal({ title, size? })` | Open a modal; returns a surface plus `setTitle`, `close`, `closed` |
| `prompt(form)` | Ask for input; resolves to the values or `null` |
| `highlight(...)` | Same as `tw.map.highlight` |

See [ui-blocks.md](ui-blocks.md).

## Not available yet

These appear in design notes but **do not exist in API version 1**. Calling a missing function throws
`TypeError`; a form field of an unsupported type is not shown correctly.

- `tw.ui.pickRegion()`, `tw.ui.pickTile()` and the `region` form field — letting the user drag-select on the map.
- `color` form field.
- `tw.edit.*` — changing blocks, walls or paint. Scripts are read-only.
- Plugins, persistent storage, network access.
- `tw.world.progression` — use `tw.world.bosses`.
- Checking `@tw-api` against the app version. The header is informational for now.

When these land, this page and the API version will be updated.
