# Map marks and highlights (`tw.map`)

Scripts can show results on the world map in two ways. Both use systems already in TerraWorld rather than drawing
their own layer.

| What | Function | Shown with |
|---|---|---|
| Paint every tile that matches | `tw.map.highlight` | The same highlight layer as Search |
| Pointers with an icon at points | `tw.map.mark`, `tw.map.markAll` | The **Mask Display** view tool |

## `tw.map.highlight(pred, color?, label?, region?)`

Calls `pred(tile)` for every tile (or every tile in `region`) and paints the ones that return `true`.
Returns how many tiles were painted.

- `color`: CSS colour, default `"#ff3df2"`.
- `label`: name shown for the highlight, default `"Script"`.
- `region`: limit to an area, see [`tw.regions`](api-reference.md#twregions).

```js
const G = tw.ids.TileGroups;
const n = tw.map.highlight(t => t.active && G.hallow.has(t.type), "#67e8f9", "Hallow");
tw.ui.stat("Hallow tiles", n);
```

There is one highlight at a time: a new call, or running Search, replaces it.
`tw.ui.highlight` is the same function. `tw.map.clearHighlight()` removes it.

## `tw.map.mark(x, y, opts?)`

Adds one pointer at tile `(x, y)`.

| Option | Type | Effect |
|---|---|---|
| `label` | `string` | Text shown with the pointer |
| `icon` | `number \| string` | Item id or item name used as the icon (default: a chest) |
| `npc` | `number` | NPC type id: uses that NPC's map head as the icon |
| `color` | `string` | CSS colour of the pointer border |

```js
tw.map.mark(tw.world.spawn.x, tw.world.spawn.y, { label: "Spawn", icon: "Bed" });
```

An unknown item name in `icon` throws an error, like `tw.ids.item`.

## `tw.map.markAll(points, defaults?)`

Adds many pointers at once. `points` is any iterable of `{ x, y, ...options }`; `defaults` fills options a point
does not set. Returns how many pointers were added.

```js
const pots = [];
const pot = tw.ids.tile("Pots");
tw.tiles.forEach(t => {
  if (t.active && t.type === pot && t.u % 36 === 0 && t.v % 36 === 0) pots.push({ x: t.x, y: t.y });
});
tw.map.markAll(pots, { icon: "Clay Pot", label: "Pot" });
```

A script can add at most **5000 pointers** per run. Past the limit, extra points are dropped; calling again once
the limit is reached throws. `tw.map.clearMarks()` removes them and resets the count.

## Where the pointers appear

Script pointers are a separate group in Mask Display, apart from pointers you place yourself:

- They appear on the map even while the Mask Display tool is closed.
- In Mask Display's properties there is a **script pointers** entry with a button to clear them.
- The Script panel also has buttons to clear the highlight and the pointers.

## Tips

- For multi-tile objects (chests, Life Crystals, altars…) every cell of the object matches the block type. Keep
  one cell per object by checking the frame, for example `t.u % 36 === 0 && t.v === 0` for 2×2 objects. Frame sizes
  differ between objects; print `t.u`/`t.v` of a few cells with `tw.tiles.get(x, y)` to find the pattern.
- Chests are easier from `tw.chests`, which already has one entry per chest.
- NPC positions in `tw.npcs` are in pixels: use `Math.floor(npc.x / 16)` for tiles.
