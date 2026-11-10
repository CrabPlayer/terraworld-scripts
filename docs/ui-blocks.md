# UI blocks, modals and prompts (`tw.ui`)

Scripts never draw HTML. They send **blocks** (a stat, a table, a chart…) and TerraWorld renders them with its own
components, so output always matches the app's theme and language and cannot inject code into the page.

There are two places output can go:

| Surface | Use for | How |
|---|---|---|
| **Inline** — the output area of the Script panel | Short results: a few numbers, a few lines, one small table | `tw.ui.*` (default) |
| **Modal** — a dialog over the map | Long reports, many tables or charts | `const m = tw.ui.modal({...})`, then `m.*` |

## Blocks

Every surface (inline, a modal, a section) has the same functions.

### `log(...values)`, `warn(...values)`, `error(...values)`

One text line. Values are joined with spaces; objects, `Map` and `Set` are shown as JSON.
Each surface keeps at most 1000 log lines.

### `stat(label, value, opts?)`

A large labelled value.

| Option | Type | Effect |
|---|---|---|
| `unit` | `string` | Shown after the value |
| `percent` | `boolean` | Sets `unit` to `%`, rounds to 2 decimals and shows a bar |
| `digits` | `number` | Decimal places for numbers |
| `color` | `string` | CSS colour of the value |

```js
tw.ui.stat("Corruption", 12.3456, { percent: true, color: "#a78bfa" }); // 12.35 %
```

### `table(rows, opts?)`

`rows` is an array of plain objects. Columns are the union of their keys unless you pass `columns`.

| Option | Type | Effect |
|---|---|---|
| `columns` | `string[]` | Which keys to show, in order |
| `title` | `string` | Heading above the table |
| `goto` | `boolean` | Adds a "go to" button per row that moves the map to that row's `x`, `y`. On by default when the rows have both `x` and `y` |

Cell values should be numbers, strings or booleans; anything else is shown as JSON. Tables keep at most 5000 rows.

```js
tw.ui.table(found.slice(0, 50), { title: "Closest to spawn", columns: ["x", "y", "distance"] });
```

### `chart(spec)`

```js
tw.ui.chart({ type: "bar", title: "Ores", labels: ["Copper", "Tin"], values: [1200, 980] });
```

`type` is `"bar"` (default), `"pie"` or `"line"`. `labels` and `values` must have the same length.

### `list(items, title?)`

A bullet list. Items are converted to text.

### `section(title)`

Starts a titled group and returns a surface. Blocks written to it are shown under that title.

```js
const ores = tw.ui.section("Ores");
ores.stat("Gold", 1234);
```

### `button(label, onClick)`

A button that runs `onClick` inside the script when clicked. It can be `async` and can write more output.

```js
tw.ui.button("Show Mud", () => {
  const mud = tw.ids.tile("Mud Block");
  tw.map.highlight(t => t.active && t.type === mud, "#a16207", "Mud");
});
```

After the script finishes, it stays alive while it still has buttons in an open modal or in the inline area,
for up to 10 minutes of inactivity. Running another script or pressing **Stop** ends it.

### `clear()`

Removes everything on that surface.

## Inline output is shortened automatically

The inline area is small. When output is longer than about **30 log lines, 10 table rows or 1 chart**, the panel
shows a shortened view and a **Show full output** button that opens everything in a modal. You do not need to
handle this yourself, but for long reports a modal is clearer from the start.

## Progress: `tw.ui.progress(fraction, message?)`

Shows a progress bar in the panel. `fraction` goes from 0 to 1.

```js
const W = tw.world.width;
for (let x = 0; x < W; x++) {
  if (x % 200 === 0) tw.ui.progress(x / W, "Scanning columns…");
  // ...
}
tw.ui.progress(1);
```

## Modals: `tw.ui.modal({ title, size? })`

Opens a dialog and returns a surface with every block function above, plus:

| Member | Effect |
|---|---|
| `setTitle(title)` | Change the title |
| `close()` | Close the modal |
| `closed` | A `Promise` that resolves when the user closes it |

`size` is `"sm"`, `"md"`, `"lg"` (default), `"xl"` or `"fullscreen"`.

```js
const m = tw.ui.modal({ title: "Ore report", size: "xl" });
for (const layer of ["surface", "underground", "cavern", "underworld"]) {
  const hist = tw.tiles.histogram("tile", tw.regions[layer]());
  const s = m.section(layer);
  s.stat("Gold Ore", hist.get(tw.ids.tile("Gold Ore")) ?? 0);
}
await m.closed; // optional: wait until the user closes it
```

Pressing **Stop** closes the script's modals.

## Asking for input: `tw.ui.prompt(form)`

Opens a form and waits for the user. Resolves to an object of values, or `null` if the user cancels.
Time spent waiting for the user does not count toward the 30 s limit.

```js
const opt = await tw.ui.prompt({
  title: "Find blocks",
  description: "Highlights every block of the chosen type.",
  submitLabel: "Highlight",
  fields: {
    block: { type: "tile", label: "Block", default: "Gold Ore" },
    depth: { type: "select", label: "Layer", options: ["all", "surface", "underground", "cavern", "underworld"], default: "all" },
    mark:  { type: "checkbox", label: "Also add pointers", default: false },
  },
});
if (!opt) return;
```

Form options: `title`, `description`, `submitLabel`, `fields`. The keys of `fields` become the keys of the result.

| Field `type` | Options | Value you get |
|---|---|---|
| `number` | `label`, `default`, `min`, `max`, `step`, `optional` | `number`; with `optional: true` the type is `number \| null` (`null` when left empty) |
| `text` | `label`, `default`, `optional` | `string` (empty string when optional and empty) |
| `select` | `label`, `options: string[]`, `default` | One of the `options` (typed as that union, e.g. `"corruption" \| "crimson"`) |
| `checkbox` | `label`, `default` | `boolean` |
| `tile` | `label`, `default` (id or name) | Block id (`number`), picked with the app's block picker |
| `wall` | `label`, `default` (id or name) | Wall id (`number`) |
| `item` | `label`, `default` (id or name), `optional` | `number \| null`: item id, `null` only when optional and left empty. Check for `null` before using it |

With `terraworld.d.ts` in your editor, the result is typed per field: `opt.depth` above is
`"all" | "surface" | ...`, `opt.block` is `number`, `opt.mark` is `boolean`.

Required fields are validated before the form closes. Not available yet: `region` and `color` fields,
`tw.ui.pickRegion()`, `tw.ui.pickTile()`.
