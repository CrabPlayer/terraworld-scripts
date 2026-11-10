# Getting started

This guide walks through writing a script from scratch. You need TerraWorld open with a world loaded and the
Script panel visible (**Data → Script**).

## 1. Hello world

Type this into the editor and press **Run** (<kbd>Ctrl</kbd>+<kbd>Enter</kbd>):

```js
tw.ui.log("World:", tw.world.name, `${tw.world.width} x ${tw.world.height}`);
tw.ui.stat("Hardmode", tw.world.hardmode ? "yes" : "no");
```

Output appears in the panel under the editor. `tw` is the only thing your script needs: it is a global object
holding the world data and every output function.

Your code runs as the body of an `async` function, so you can use `await` and `return` at the top level.

## 2. Count blocks

`tw.tiles.count(pred)` calls `pred` for every tile and counts how many return `true`.
`tw.ids.tile(name)` turns a block name into its numeric id.

```js
const mud = tw.ids.tile("Mud Block");
const total = tw.tiles.count(t => t.active && t.type === mud);
tw.ui.stat("Mud blocks", total);
```

For counting many block types at once, `tw.tiles.histogram("tile")` is much faster: one pass returns a
`Map<typeId, count>`.

```js
const hist = tw.tiles.histogram("tile");
tw.ui.stat("Mud blocks", hist.get(tw.ids.tile("Mud Block")) ?? 0);
tw.ui.stat("Stone blocks", hist.get(tw.ids.tile("Stone Block")) ?? 0);
```

## 3. Show it on the map

`tw.map.highlight` paints every tile that matches a condition. `tw.map.mark` drops a pointer with an icon.

```js
const mud = tw.ids.tile("Mud Block");
tw.map.highlight(t => t.active && t.type === mud, "#a16207", "Mud");
tw.map.mark(tw.world.spawn.x, tw.world.spawn.y, { label: "Spawn", icon: "Bed" });
```

## 4. Ask the user

`tw.ui.prompt` opens a form and waits. It returns `null` if the user cancels.

```js
const opt = await tw.ui.prompt({
  title: "Count a block",
  fields: { block: { type: "tile", label: "Block", default: "Mud Block" } },
});
if (!opt) return;
tw.ui.stat(tw.ids.tileName(opt.block), tw.tiles.histogram("tile").get(opt.block) ?? 0);
```

## 5. Save it as a file

Save your script as `something.js` in `Documents/My Games/Terraria/twscript` and add a header at the top:

```js
// @name Count a block
// @author your-github-name
// @description Asks for a block and shows how many the world has.
// @tw-api 1
```

It now shows up under **Local scripts** in the Script panel.

## 6. Set up your editor (optional)

For autocomplete and type checking in VS Code, copy [`types/terraworld.d.ts`](../types/terraworld.d.ts) and
[`types/jsconfig.json`](../types/jsconfig.json) into your `twscript` folder, next to your scripts, and open that
folder in VS Code (*File → Open Folder…*). Typing `tw.` then lists every function with its documentation.

VS Code underlines a top-level `return` (*"can only be used within a function body"*). TerraWorld runs it fine;
ignore the warning or use `if (opt) { ... }` instead. Details in [types/README.md](../types/README.md).

## Next steps

- Browse [`samples/`](../samples) for complete scripts.
- Read the [API reference](api-reference.md), [UI blocks](ui-blocks.md) and [map marks](map-marks.md).
- Check [sandbox and limits](sandbox.md) before writing something heavy.
