// @name Text banner
// @author TerraWorld
// @description Asks for text, font, size and block, lets you tap a spot, then writes the text in blocks (pixel, sans or display font); you preview and press Apply.
// @tw-api 1

// "pixel" is a built-in bitmap font for small text; "sans" and "display" are outline
// fonts that look best from about 12 tiles up.
const opt = await tw.ui.prompt({
  title: "Text banner",
  fields: {
    text: { type: "text", label: "Text", default: tw.world.name },
    font: { type: "select", label: "Font", options: ["pixel", "sans", "display"], default: "pixel" },
    size: { type: "number", label: "Letter height (tiles)", default: 14, min: 5, max: 200 },
    block: { type: "tile", label: "Block", default: "Gray Brick" },
    backing: { type: "checkbox", label: "Wall behind the text", default: true },
  },
});
if (!opt) return;
const at = await tw.ui.pickTile({ title: "Tap where the top-left corner of the text goes" });
if (!at) return;

const text = (await tw.shape.text(opt.text, { font: opt.font, size: opt.size })).moveTo(at.x, at.y);
if (text.empty) {
  tw.ui.warn("Nothing to draw.");
  return;
}
if (opt.backing) {
  const box = text.bounds();
  tw.edit.drawShape(tw.shape.rect(box.x - 2, box.y - 2, box.w + 4, box.h + 4), { wall: "Gray Brick Wall" });
}
tw.edit.drawShape(text, { fill: opt.block });

const result = await tw.edit.commit({ label: "Text: " + opt.text });
if (!result.applied) {
  tw.ui.log("Cancelled: the world was not changed.");
  return;
}
tw.ui.stat("Placed", result.count, { unit: "tiles" });
if (result.skipped) tw.ui.warn(result.skipped + " cells were left alone (furniture or modded).");
