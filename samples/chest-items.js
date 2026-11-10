// @name Find an item in chests
// @author TerraWorld
// @description Asks for an item, then marks and lists every chest that contains it.
// @tw-api 1

const opt = await tw.ui.prompt({
  title: "Find item in chests",
  fields: { item: { type: "item", label: "Item" } },
});
if (!opt || opt.item === null) return;

const hits = tw.chests
  .filter(chest => chest.items.some(item => item.itemId === opt.item && item.stackSize > 0))
  .map(chest => ({ x: chest.x, y: chest.y, name: chest.name || "Chest" }));

tw.map.markAll(hits, { icon: opt.item, label: tw.ids.itemName(opt.item) });
tw.ui.stat(tw.ids.itemName(opt.item), hits.length, { unit: "chests" });
tw.ui.table(hits);
