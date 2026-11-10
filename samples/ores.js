// @name Ores by layer
// @author TerraWorld
// @description Counts ore blocks in the surface, underground, cavern and underworld layers.
// @tw-api 1

const ores = ["Copper Ore", "Tin Ore", "Iron Ore", "Lead Ore", "Silver Ore", "Tungsten Ore",
  "Gold Ore", "Platinum Ore", "Demonite Ore", "Crimtane Ore", "Hellstone Ore", "Cobalt Ore",
  "Palladium Ore", "Mythril Ore", "Orichalcum Ore", "Adamantite Ore", "Titanium Ore", "Chlorophyte Ore"];
const layers = { surface: tw.regions.surface(), underground: tw.regions.underground(), cavern: tw.regions.cavern(), underworld: tw.regions.underworld() };
const hist = Object.fromEntries(Object.entries(layers).map(([name, region]) => [name, tw.tiles.histogram("tile", region)]));

const rows = [];
for (const name of ores) {
  let id;
  try { id = tw.ids.tile(name); } catch { continue; }
  const row = { ore: name };
  let total = 0;
  for (const layer of Object.keys(layers)) { row[layer] = hist[layer].get(id) ?? 0; total += row[layer]; }
  row.total = total;
  if (total > 0) rows.push(row);
}
tw.ui.table(rows, { title: "Ore blocks by layer" });
