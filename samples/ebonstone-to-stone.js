// @name Replace Ebonstone with Stone
// @author TerraWorld
// @description Replaces every Ebonstone block with Stone; you preview the change on the map and press Apply (one undo step).
// @tw-api 1

// tw.edit only drafts the change: the map shows it in orange and nothing is written
// until you press Apply. Apply is one undo step.
const ebonstone = tw.ids.tile("Ebonstone Block");
if (!tw.tiles.histogram("tile").get(ebonstone)) {
  tw.ui.log("This world has no Ebonstone.");
  return;
}

tw.edit.replace({ from: ebonstone, to: "Stone Block" });
const result = await tw.edit.commit({ label: "Ebonstone → Stone" });

if (result.applied) tw.ui.stat("Ebonstone → Stone", result.count, { unit: "tiles" });
else tw.ui.log("Cancelled: the world was not changed.");
if (result.skipped) tw.ui.warn(result.skipped + " cells were left alone (furniture or modded).");
