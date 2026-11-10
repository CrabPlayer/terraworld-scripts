// @name Infection percentage
// @author TerraWorld
// @description Percentage of solid blocks taken over by Corruption, Crimson and Hallow; highlights this world's evil biome on the map.
// @tw-api 1

const G = tw.ids.TileGroups;
const hist = tw.tiles.histogram("tile");
let solid = 0;
for (const count of hist.values()) solid += count;
const share = (group) => [...group].reduce((sum, id) => sum + (hist.get(id) ?? 0), 0);

tw.ui.stat("Corruption", share(G.corruption) / solid * 100, { percent: true, color: "#a78bfa" });
tw.ui.stat("Crimson", share(G.crimson) / solid * 100, { percent: true, color: "#f87171" });
tw.ui.stat("Hallow", share(G.hallow) / solid * 100, { percent: true, color: "#67e8f9" });

const evil = tw.world.evil === "crimson" ? G.crimson : G.corruption;
tw.map.highlight(t => t.active && evil.has(t.type), "#c084fc", tw.world.evil);
