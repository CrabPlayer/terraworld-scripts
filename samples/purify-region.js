// @name Purify Corruption / Crimson in a region
// @author TerraWorld
// @description Purifies Corruption and Crimson blocks in an area you drag on the map, like Purification Powder; you preview and press Apply.
// @tw-api 1

// Evil blocks become their pure versions and thorns are removed.
// Plants, vines and backgrounds are left as they are.
const region = await tw.ui.pickRegion({ title: "Select the area to purify" });
if (!region) return;

const pure = {
  "Corrupt Grass Block": "Grass Block", "Crimson Grass Block": "Grass Block",
  "Corrupt Jungle Grass Block": "Jungle Grass Block", "Crimson Jungle Grass Block": "Jungle Grass Block",
  "Ebonstone Block": "Stone Block", "Crimstone Block": "Stone Block",
  "Ebonsand Block": "Sand Block", "Crimsand Block": "Sand Block",
  "Purple Ice Block": "Ice Block", "Red Ice Block": "Ice Block",
  "Corrupt Sandstone Block": "Sandstone Block", "Crimson Sandstone Block": "Sandstone Block",
  "Corrupt Hardened Sand Block": "Hardened Sand Block", "Crimson Hardened Sand Block": "Hardened Sand Block",
  "Corruption Thorns": null, "Crimtane Thorns": null,
};
const target = new Map(Object.entries(pure).map(([from, to]) => [tw.ids.tile(from), to]));

const drafted = tw.edit.replace({ from: target.keys(), to: (id) => target.get(id), region });
if (!drafted) {
  tw.ui.log("No Corruption or Crimson blocks in this area.");
  return;
}
const result = await tw.edit.commit({ label: "Purify area" });
if (!result.applied) {
  tw.ui.log("Cancelled: the world was not changed.");
  return;
}
tw.ui.stat("Purified", result.count, { unit: "tiles" });
if (result.skipped) tw.ui.warn(result.skipped + " cells were left alone (furniture or modded).");
