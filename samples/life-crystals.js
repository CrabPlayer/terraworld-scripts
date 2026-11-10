// @name Mark Life Crystals
// @author TerraWorld
// @description Marks every Life Crystal on the map and lists the ones closest to spawn.
// @tw-api 1

const id = tw.ids.tile("Crystal Heart"); // the Life Crystal block
const found = [];
tw.tiles.forEach(t => {
  // Life Crystals are 2x2 objects: keep only the top-left cell.
  if (t.active && t.type === id && t.u % 36 === 0 && t.v === 0) found.push({ x: t.x, y: t.y });
});
const { x: sx, y: sy } = tw.world.spawn;
for (const p of found) p.distance = Math.round(Math.hypot(p.x - sx, p.y - sy));
found.sort((a, b) => a.distance - b.distance);

tw.map.markAll(found, { icon: "Life Crystal", label: "Life Crystal" });
tw.ui.stat("Life Crystals", found.length);
tw.ui.table(found.slice(0, 10), { title: "Closest to spawn" });
