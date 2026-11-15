// @name Logo with cut-out text
// @author TerraWorld
// @description Draws a logo from vector shapes: a rounded plate with the world name cut out, a frame and a wave; you preview and press Apply.
// @tw-api 1

// Name cut out of the plate: boolean subtract. Frame: offset. Wave: SVG path.
const at = await tw.ui.pickTile({ title: "Tap where the top-left corner of the logo goes" });
if (!at) return;

const name = await tw.shape.text(tw.world.name.toUpperCase().slice(0, 16) || "TERRARIA", { font: "display", size: 16 });
const box = name.bounds();
const plate = tw.shape.rect(box.x - 5, box.y - 5, box.w + 10, box.h + 18, { radius: 5 });
const waveY = box.y + box.h + 6;
const wave = tw.shape.path("M " + box.x + " " + waveY + " q " + box.w / 4 + " -6 " + box.w / 2 + " 0 t " + box.w / 2 + " 0");

// Everything is built around (0, 0); move the finished parts together.
const frame = plate.offset(2);
const corner = frame.bounds();
const place = (shape) => shape.translate(at.x - corner.x, at.y - corner.y);

tw.edit.drawShape(place(frame), { fill: "Obsidian Brick", wall: "Gray Brick Wall" });
// The frame shows through where the name was cut out of the plate.
tw.edit.drawShape(place(tw.shape.subtract(plate, name)), { fill: "Gold Brick" });
tw.edit.drawShape(place(wave), { stroke: "Obsidian Brick", strokeWidth: 2 });

const result = await tw.edit.commit({ label: "Logo: " + tw.world.name });
tw.ui.stat("Placed", result.count, { unit: result.applied ? "tiles" : "tiles (cancelled)" });
