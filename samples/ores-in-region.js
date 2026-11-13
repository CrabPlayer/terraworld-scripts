// @name Ores in a picked region
// @author TerraWorld
// @description Asks you to drag a rectangle on the map, then counts and highlights the ore blocks inside it.
// @tw-api 1

const region = await tw.ui.pickRegion({ title: "Select the area to count ores in" });
if (!region) return; // cancelled

const ores = ["Copper Ore", "Tin Ore", "Iron Ore", "Lead Ore", "Silver Ore", "Tungsten Ore",
  "Gold Ore", "Platinum Ore", "Demonite Ore", "Crimtane Ore", "Hellstone Ore", "Cobalt Ore",
  "Palladium Ore", "Mythril Ore", "Orichalcum Ore", "Adamantite Ore", "Titanium Ore", "Chlorophyte Ore"];
const hist = tw.tiles.histogram("tile", region);

const rows = [];
for (const name of ores) {
  let id;
  try { id = tw.ids.tile(name); } catch { continue; }
  const count = hist.get(id) ?? 0;
  if (count > 0) rows.push({ ore: name, blocks: count });
}
rows.sort((a, b) => b.blocks - a.blocks);

tw.ui.stat("Area", `${region.w} × ${region.h}`, { unit: "tiles" });
tw.ui.stat("Ore blocks", rows.reduce((sum, row) => sum + row.blocks, 0));
if (rows.length) {
  tw.ui.table(rows, { title: `Ores at X ${region.x}, Y ${region.y}` });
  tw.ui.chart({ type: "bar", labels: rows.map((row) => row.ore), values: rows.map((row) => row.blocks), title: "Ore blocks" });
  const oreIds = new Set(rows.map((row) => tw.ids.tile(row.ore)));
  tw.map.highlight((t) => t.active && oreIds.has(t.type), "#ffd84a", "Ores in region", region);
} else {
  tw.ui.log("No ore blocks in this area.");
}
