// @name Infection report
// @author TerraWorld
// @description Asks which biome to analyse, then opens a modal with block and wall tables and a chart.
// @tw-api 1

const opt = await tw.ui.prompt({
  title: "Infection report",
  fields: {
    biome: { type: "select", label: "Biome", options: ["corruption", "crimson", "hallow"], default: tw.world.evil },
    walls: { type: "checkbox", label: "Include walls", default: true },
  },
});
if (!opt) return;

const group = tw.ids.TileGroups[opt.biome];
const hist = tw.tiles.histogram("tile");
const rows = [...group]
  .map(id => ({ block: tw.ids.tileName(id), count: hist.get(id) ?? 0 }))
  .filter(row => row.count > 0)
  .sort((a, b) => b.count - a.count);

const m = tw.ui.modal({ title: "Infection report: " + opt.biome, size: "lg" });
const blocks = m.section("Blocks");
blocks.table(rows);
blocks.chart({ type: "bar", labels: rows.map(r => r.block), values: rows.map(r => r.count) });

if (opt.walls) {
  const walls = tw.tiles.histogram("wall");
  const wallRows = [...(tw.ids.WallGroups[opt.biome] ?? [])]
    .map(id => ({ wall: tw.ids.wallName(id), count: walls.get(id) ?? 0 }))
    .filter(row => row.count > 0);
  m.section("Walls").table(wallRows);
}
