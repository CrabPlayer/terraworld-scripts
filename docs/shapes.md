# Shapes: `tw.shape` and `tw.edit.drawShape`

Since API 1.3.0 a script can build **vector shapes** (paths, rectangles, ellipses, lines, text, SVG) and turn them
into blocks and walls. It is the same system as the editor's Pen and Shape tools.

Two steps, always:

1. Build a shape with `tw.shape.*`. A shape is only geometry; it changes nothing.
2. Draw it with `tw.edit.drawShape(shape, { fill: … })`, then `await tw.edit.commit({ label })`. The user sees a
   preview and presses **Apply** or **Cancel** (see [editing.md](editing.md)).

```js
const at = await tw.ui.pickTile({ title: "Tap the top-left corner" });
if (!at) return;
const box = tw.shape.rect(at.x, at.y, 30, 12, { radius: 3 });
tw.edit.drawShape(box, { fill: "Gold Brick", wall: "Gold Brick Wall" });
const result = await tw.edit.commit({ label: "Gold box" });
tw.ui.stat("Placed", result.count, { unit: result.applied ? "tiles" : "tiles (cancelled)" });
```

Ready-made examples: [`samples/text-banner.js`](../samples/text-banner.js) (text in blocks) and
[`samples/shape-logo.js`](../samples/shape-logo.js) (text cut out of a plate, a frame and a wave).

## Coordinates

- Units are **tiles**. x grows to the right, **y grows downward** (y = 0 is the top of the world).
- The point (x, y) is the **centre** of cell (x, y).
- A closed shape covers every cell whose centre is inside it **plus** every cell its outline passes through. So a
  path includes both end cells: `M 0 0 H 9 V 4 H 0 Z` is **10 × 5** cells, the same as `tw.shape.rect(0, 0, 10, 5)`.
- Several closed paths in one shape fill **even-odd**: a path inside another cuts a hole.

Shapes are immutable: every method returns a **new** shape. Build at (0, 0) and move the result at the end with
`moveTo` or `translate`.

## Creating shapes

| Call | Result |
|---|---|
| `tw.shape.rect(x, y, w, h)` | `w` × `h` cells, top-left cell (x, y) |
| `tw.shape.rect(x, y, w, h, { radius: 3 })` | Same, with rounded corners |
| `tw.shape.ellipse(x, y, w, h)` | The ellipse inside the `w` × `h` box with top-left cell (x, y). Equal `w` and `h` give a circle |
| `tw.shape.line(x1, y1, x2, y2)` | A straight line from cell (x1, y1) to cell (x2, y2), both included |
| `tw.shape.path("M 0 0 L 10 0 …")` | A path from SVG path data (next section) |
| `tw.shape.path([{ x, y }, …], { closed: true })` | A path through anchor points |
| `await tw.shape.text("Hi", { font, size })` | Text (see [Text](#text)). Async |
| `tw.shape.fromSvg("<svg>…</svg>")` | Shapes read from SVG markup |

### Anchor arrays

Instead of path data you can pass an array of points. Without `{ closed: true }` the path stays open and is drawn
as a line.

```js
// A filled triangle: 31 × 21 cells.
const triangle = tw.shape.path([{ x: 0, y: 20 }, { x: 15, y: 0 }, { x: 30, y: 20 }], { closed: true });

// A square with one rounded corner.
const tab = tw.shape.path(
  [{ x: 0, y: 0 }, { x: 20, y: 0, radius: 5 }, { x: 20, y: 20 }, { x: 0, y: 20 }],
  { closed: true },
);
```

Each anchor is `{ x, y }` and may also have:

- `radius`: rounds that corner with an arc of this many tiles;
- `in` / `out`: Bézier control points `{ x, y }` (absolute coordinates) before and after the anchor, for curves.
  Without them the anchor is a sharp corner joined by straight lines.

### SVG markup: `fromSvg`

`tw.shape.fromSvg(svg)` reads these elements: `<path>`, `<rect>`, `<circle>`, `<ellipse>`, `<polygon>`,
`<polyline>` and `<line>`, including `transform` attributes on them and on `<g>` groups.

- **One SVG unit is one tile.** `viewBox`, `width` and `height` are ignored, so scale the result with `.scale()` if
  the drawing is too big or too small.
- Colours, `<text>` and `<use>` are ignored.
- All closed elements are merged into one filled area.
- It throws when the markup has none of the elements above.

```js
const svg = '<svg><rect x="0" y="0" width="10" height="10"/><circle cx="20" cy="5" r="5"/></svg>';
const logo = tw.shape.fromSvg(svg).moveTo(at.x, at.y);
```

## SVG path syntax, for beginners

`tw.shape.path("…")` takes the same **path data** as the `d` attribute of an SVG `<path>`. It is a list of
commands. Each command is one letter followed by numbers.

| Command | Name | Numbers | What it does |
|---|---|---|---|
| `M x y` | Move to | 2 | Lifts the pen and puts it at (x, y). Starts a new piece |
| `L x y` | Line to | 2 | Straight line to (x, y) |
| `H x` | Horizontal line | 1 | Straight line to x, keeping y |
| `V y` | Vertical line | 1 | Straight line to y, keeping x |
| `C x1 y1 x2 y2 x y` | Cubic curve | 6 | Curve to (x, y). (x1, y1) pulls the start, (x2, y2) pulls the end |
| `S x2 y2 x y` | Smooth cubic | 4 | Like `C`, but the first control point mirrors the previous curve's, so the join is smooth |
| `Q x1 y1 x y` | Quadratic curve | 4 | Curve to (x, y) with one control point (x1, y1) |
| `T x y` | Smooth quadratic | 2 | Like `Q`, with the control point mirrored from the previous one |
| `A rx ry rotation large sweep x y` | Arc | 7 | Part of an ellipse with radii rx, ry to (x, y). See below |
| `Z` | Close | 0 | Straight line back to the start of the piece, and closes it |

**Upper case = absolute, lower case = relative.** `L 10 5` goes to the point (10, 5). `l 10 5` goes 10 right and
5 down **from where the pen is now**. The same is true for every command (`h`, `v`, `c`, `q`, `a`, …).

Rules that help:

- Start the data with `M`. Coordinates are in tiles, and **y grows downward**, so a negative y offset goes up.
- Spaces and commas both separate numbers: `M 0,0 L 10,5` is the same as `M 0 0 L 10 5`.
- A command can be repeated without repeating the letter: `L 10 0 10 10` is two lines. Extra pairs after `M` are
  lines.
- After `Z` the pen is back at the start of that piece. Start the next piece with a new `M`.
- **A path is filled only when it is closed with `Z`.** Without `Z` it is a line (drawn with `stroke`, or with
  `fill` when there is no stroke).
- Write arc flags as separate numbers: `A 5 5 0 0 1 10 5` works, the compact form `A5 5 0 01 10 5` does not
  ("needs 7 numbers").

### Tiny examples

```js
// A 10 × 5 block. H and V draw straight lines; Z closes it.
const block = tw.shape.path("M 0 0 H 9 V 4 H 0 Z");

// The same with relative commands: 9 right, 4 down, 9 left.
const same = tw.shape.path("M 0 0 h 9 v 4 h -9 z");

// A triangle (roof): from the bottom-left, up to the peak, down to the bottom-right.
const roof = tw.shape.path("M 0 10 L 10 0 L 20 10 Z");

// A hill: one quadratic curve, pulled up by the control point (10, -10).
const hill = tw.shape.path("M 0 10 Q 10 -10 20 10 Z");

// A wavy line (open, so it is drawn as a line): Q makes the first bump, T repeats it.
const wave = tw.shape.path("M 0 0 Q 5 -6 10 0 T 20 0");

// An S-curve: C makes the first bend, S continues it smoothly.
const snake = tw.shape.path("M 0 10 C 0 0 10 0 10 10 S 20 20 20 10");

// A circle of 11 × 11 cells from two half-circle arcs (radius 5).
const ring = tw.shape.path("M 0 5 A 5 5 0 0 1 10 5 A 5 5 0 0 1 0 5 Z");

// A square with a square hole: two closed pieces fill even-odd.
const frame = tw.shape.path("M 0 0 H 19 V 19 H 0 Z M 5 5 H 14 V 14 H 5 Z");
```

**Arc flags.** In `A rx ry rotation large sweep x y`, `rotation` turns the ellipse (degrees), `large` is `1` for
the long way round and `0` for the short way, and `sweep` is `1` to go clockwise (on the map, with y down) and `0`
to go counter-clockwise. Arcs are turned into cubic curves internally.

Many free vector editors can export path data: draw there, copy the `d="…"` value of the path, and use
`.scale()` / `.moveTo()` to fit it in the world.

## Moving and changing a shape

| Method | What it does |
|---|---|
| `shape.empty` | `true` when there is nothing to draw (e.g. `intersect` of shapes that do not touch) |
| `shape.bounds()` | The box of cells the shape covers, as a `Region` `{ x, y, w, h }` |
| `shape.translate(dx, dy)` | Moves by (dx, dy) tiles |
| `shape.moveTo(x, y)` | Moves so the top-left cell of `bounds()` is (x, y) |
| `shape.scale(sx, sy?)` | Resizes around the centre of `bounds()`. `scale(2)` doubles both sides, `scale(2, 1)` only the width. A negative factor also mirrors. 0 throws |
| `shape.rotate(degrees)` | Rotates clockwise (as seen on the map) around the centre of `bounds()` |
| `shape.flip(axis?)` | Mirrors in place: `"horizontal"` (default) swaps left and right, `"vertical"` top and bottom |
| `shape.offset(distance)` | Grows (positive) or shrinks (negative) a closed shape by `distance` tiles on every side |

Because `scale` and `rotate` work around the centre, the shape can move. Call `moveTo` **last**:

```js
const sign = tw.shape.rect(0, 0, 10, 4).rotate(90).moveTo(at.x, at.y);
```

`offset` is handy for frames and outlines: `rect(0, 0, 10, 10).offset(2)` is 14 × 14 cells starting at (-2, -2),
and `offset(-2)` is 6 × 6 cells starting at (2, 2).

## Combining shapes: booleans

| Call | Result |
|---|---|
| `tw.shape.union(a, b, …)` | Area covered by **any** of the shapes |
| `tw.shape.subtract(a, b, …)` | `a` minus every other shape |
| `tw.shape.intersect(a, b, …)` | Area covered by **all** of the shapes |
| `tw.shape.xor(a, b, …)` | Area covered by an **odd** number of the shapes |

```js
// A 20 × 20 plate with a 10 × 10 window: 300 cells.
const plate = tw.shape.subtract(tw.shape.rect(0, 0, 20, 20), tw.shape.rect(5, 5, 10, 10));

// Text cut out of a rounded plate (see samples/shape-logo.js).
const name = await tw.shape.text("HELLO", { font: "pixel", size: 14 });
const box = name.bounds();
const sign = tw.shape.subtract(tw.shape.rect(box.x - 3, box.y - 3, box.w + 6, box.h + 6, { radius: 2 }), name);
```

Things to know:

- Booleans need **closed** shapes. A line or an open path throws "lines and open paths enclose no area". Close it
  with `Z` or `{ closed: true }`.
- The result is made of straight-edged polygons: curves are flattened.
- Rectangles and `"pixel"` text combine **cell for cell**. With curved shapes (ellipses, arcs, outline-font text),
  parts of the result **thinner than 2 tiles can be lost**. Keep the gaps and strokes of what you cut out at least
  2 tiles wide.

## Text

```js
const title = await tw.shape.text("HELLO", { font: "pixel", size: 14 });
tw.edit.drawShape(title.moveTo(at.x, at.y), { fill: "Stone Block" });
```

`tw.shape.text(text, options)` is **async** (use `await`): outline fonts are downloaded the first time they are used.

| Option | Default | Meaning |
|---|---|---|
| `font` | `"sans"` | `"sans"`, `"display"`, `"pixel"`, or the bytes of your own font file (below) |
| `size` | 16 (`"pixel"`: 7) | Height of a **capital letter** in tiles, 1–512 |
| `letterSpacing` | 0 | Extra tiles between letters; may be negative |
| `lineHeight` | 1.5 × `size` | Tiles from one line to the next. The text may contain `"\n"` |
| `align` | `"left"` | Where each line sits relative to x = 0: starts there (`"left"`), is centred on it (`"center"`), or ends there (`"right"`) |

The top of the capital letters is y = 0 and the baseline is y = `size`; position the text afterwards with `moveTo`
or `translate`. At most 2,000 characters.

### The bundled fonts

| `font` | Typeface | Good for |
|---|---|---|
| `"pixel"` | Built-in 5 × 7 bitmap font | **Small text.** Each letter is drawn cell for cell, so it stays sharp at any size. Nothing is downloaded |
| `"sans"` | Be Vietnam Pro Bold | Clean, bold text from about 12 tiles high |
| `"display"` | Bungee | Chunky signs and titles from about 12 tiles high |

- **`"pixel"`** covers printable ASCII only; accents are dropped (`"Việt"` is drawn as `Viet`). Its `size` is
  rounded to a multiple of 7: 7, 14, 21, … (`size: 10` gives 7).
- **`"sans"` and `"display"`** have Latin and Vietnamese letters. They are outline fonts: below about **12 tiles**
  letters lose their shape in blocks, so use `"pixel"` for small text. Both fonts are under the SIL Open Font
  License and ship with TerraWorld; extra letter sets (for example Vietnamese) download only when your text needs
  them.

### Your own font file

`font` also accepts the bytes of a **.ttf, .otf or .woff** file (an `ArrayBuffer`, a `Uint8Array`, or an object
with `bytes`). The easiest source is a `file` field in a form ([ui-blocks.md](ui-blocks.md#asking-for-input-twuipromptform)):

```js
const opt = await tw.ui.prompt({
  title: "Text in my font",
  fields: {
    text: { type: "text", label: "Text", default: "Hello" },
    file: { type: "file", label: "Font file", accept: ".ttf,.otf,.woff" },
    size: { type: "number", label: "Letter height (tiles)", default: 20, min: 12, max: 200 },
  },
});
if (!opt) return;
const at = await tw.ui.pickTile({ title: "Tap the top-left corner" });
if (!at) return;
const text = (await tw.shape.text(opt.text, { font: opt.file, size: opt.size })).moveTo(at.x, at.y);
tw.edit.drawShape(text, { fill: "Stone Block" });
await tw.edit.commit({ label: "Text: " + opt.text });
```

- The file is read in your browser; it is never uploaded. A form file can be up to 16 MB, a font up to 12 MB.
- **.woff2 is not supported.** Convert it to .ttf or .woff first.
- Check the font's licence before sharing what you build with it.

## Drawing: `tw.edit.drawShape`

```js
tw.edit.drawShape(shape, { fill: "Gold Brick", stroke: "Obsidian Brick", strokeWidth: 2, wall: "Gold Brick Wall" });
```

| Option | Meaning |
|---|---|
| `fill` | Block for the inside of closed shapes. Without `stroke` it also covers the edge cells, so the whole shape is one block |
| `stroke` | Block for the outline, drawn **over** the fill |
| `strokeWidth` | Outline thickness in tiles, a whole number 1–32. Default 1. The outline is centred on the path |
| `wall` | Wall placed behind every covered cell |
| `paint` | Paint id 0–31 for the blocks of every covered cell (0 = none) |
| `wallPaint` | Paint id 0–31 for the walls |

- Blocks and walls are ids or names, as everywhere in `tw.edit`. **`null` removes**: `{ fill: null }` digs out the
  shape, `{ wall: null }` removes walls.
- At least one option is needed.
- **Lines and open paths** are drawn with `stroke`, or with `fill` when there is no `stroke`.
- Draw several shapes one after another to **layer** them: later calls win. For example a wall-only backing first,
  then the blocks on top.
- `drawShape` returns the number of cells added to the draft.

### Limits

- A shape may span at most **2,000,000 cells** (its bounding box) per `drawShape` call. A very thick stroke on a
  long path can also hit a work limit; draw it in parts.
- Parts outside the world are dropped.
- 50,000 points per shape, 500,000 characters of path data or SVG, 2,000 characters of text.
- Building and combining shapes counts toward the script's 30 s limit.
- All [`tw.edit` rules](editing.md) apply: only plain vanilla blocks and walls, at most 1,000,000 cells per draft,
  furniture and modded cells are left alone and counted in `result.skippedBy`.

## Preview, Apply, Undo

`drawShape` writes only to the **draft**. Nothing changes until the user agrees:

1. `const result = await tw.edit.commit({ label: "Logo" })` highlights the changed cells on the map and shows
   **Apply** and **Cancel**. Waiting for the user does not count toward the time limit.
2. **Apply**: the changes are made as **one undo step** (Edit Mode → Undo, or Undo in the Script panel).
   **Cancel**: the world stays as it was and `result.applied` is `false`.
3. Report what happened:

```js
const result = await tw.edit.commit({ label: "Logo" });
if (!result.applied) {
  tw.ui.log("Cancelled: the world was not changed.");
  return;
}
tw.ui.stat("Placed", result.count, { unit: "tiles" });
if (result.skipped) tw.ui.warn(result.skipped + " cells were left alone (furniture or modded).");
```

`tw.tiles.*` reads still see the world as it was when the run started, even after `commit()`.

## Not available yet

These do not exist in 1.3.0; do not call them:

- turning a stroke into a shape (outline → area);
- text along a path;
- the nonzero fill rule (multi-path shapes always fill even-odd).
