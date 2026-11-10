/**
 * TerraWorld script API — type declarations.
 *
 * @tw-api-version 1.0.0
 *
 * Scripts are plain JavaScript run by TerraWorld (https://terraworld.dev) in a sandboxed
 * Web Worker. The whole file is the body of an `async` function that receives `tw`, so
 * top-level `await` and `return` both work at run time.
 *
 * Editor setup (VS Code): put this file and the matching `jsconfig.json` (served next to
 * it as /scripting/jsconfig.json) in your script folder, e.g.
 * `Documents/My Games/Terraria/twscript`, then open that folder in VS Code.
 *
 * `lib: ["ES2022"]` keeps browser APIs such as `fetch` and `document` out of the
 * suggestions: they do not exist inside the sandbox. The editor still flags a
 * top-level `return` ("can only be used within a function body"); TerraWorld runs
 * it fine, or you can use `if (...) { ... }` instead.
 *
 * Source of truth: TerraWorld `static/scripting/terraworld.d.ts`. Community copy:
 * https://github.com/CrabPlayer/terraworld-scripts
 */

declare namespace TerraWorld {
	// ── World ──────────────────────────────────────────────────────────

	type Evil = "corruption" | "crimson";
	type GameMode = "classic" | "expert" | "master" | "journey";

	type BossKey =
		| "eyeOfCthulhu" | "eaterOfWorldsOrBrain" | "skeletron" | "queenBee" | "destroyer" | "twins"
		| "skeletronPrime" | "anyMechanicalBoss" | "plantera" | "golem" | "kingSlime" | "dukeFishron"
		| "lunaticCultist" | "moonLord" | "pumpking" | "mourningWood" | "iceQueen" | "everscream"
		| "santaNk1" | "solarPillar" | "vortexPillar" | "nebulaPillar" | "stardustPillar"
		| "empressOfLight" | "queenSlime" | "deerclops";

	interface World {
		readonly name: string;
		readonly seed: string;
		/** Width in tiles. */
		readonly width: number;
		/** Height in tiles. */
		readonly height: number;
		readonly spawn: Readonly<{ x: number; y: number }>;
		/** Y of the surface/underground boundary (tiles). */
		readonly surfaceY: number;
		/** Y of the underground/cavern boundary (tiles). */
		readonly rockY: number;
		readonly evil: Evil;
		readonly hardmode: boolean;
		readonly mode: GameMode;
		/** True for Expert and Master. */
		readonly expert: boolean;
		readonly master: boolean;
		/** Defeated bosses. Keys missing in older worlds are absent. */
		readonly bosses: Readonly<Partial<Record<BossKey, boolean>>>;
	}

	// ── Tiles ──────────────────────────────────────────────────────────

	type LiquidType = "none" | "water" | "lava" | "honey" | "shimmer";

	/**
	 * Layer names for `tw.tiles.raw()` and the `// @tw-layers` directive.
	 * TerraWorld copies only the layers a script needs. It detects most of them from
	 * the code; when it misses one, reading that property throws and asks you to add
	 * e.g. `// @tw-layers wall, liquid` (or `// @tw-layers all`) at the top.
	 */
	type LayerName = "active" | "tile" | "wall" | "frame" | "wires" | "liquid" | "paint" | "wallPaint" | "slope" | "actuator";

	/**
	 * One tile. Objects passed to `forEach`/`count`/`highlight` callbacks are a single
	 * reused view that moves from cell to cell: copy the values you need
	 * (`{ x: t.x, y: t.y }`), never keep the object itself.
	 */
	interface Tile {
		readonly x: number;
		readonly y: number;
		/** Flat index into `tw.tiles.raw()` arrays (`x * height + y`). */
		readonly i: number;
		/** A block is present. `type` is only meaningful when true. */
		readonly active: boolean;
		/** Tile id (see `tw.ids.tile()`). */
		readonly type: number;
		/** Wall id, 0 = no wall. Needs layer `wall`. */
		readonly wall: number;
		/** Frame X in pixels (multi-tile objects and styles). Needs layer `frame`. */
		readonly u: number;
		/** Frame Y in pixels. Needs layer `frame`. */
		readonly v: number;
		/** Tile paint id, 0 = none. Needs layer `paint`. */
		readonly paint: number;
		/** Wall paint id. Needs layer `wallPaint`. */
		readonly wallPaint: number;
		/** 0 = full block, 1 = half block, 2–5 = slopes. Needs layer `slope`. */
		readonly slope: number;
		/** Needs layer `actuator`. */
		readonly actuator: boolean;
		/** Actuated (non-solid). Needs layer `actuator`. */
		readonly inactive: boolean;
		/** `amount` 0–255. Needs layer `liquid`. */
		readonly liquid: { amount: number; type: LiquidType };
		/** Needs layer `wires`. */
		readonly wires: { red: boolean; blue: boolean; green: boolean; yellow: boolean };
	}

	/** A rectangle in tile coordinates. Out-of-world parts are clipped. */
	interface Region {
		x: number;
		y: number;
		w: number;
		h: number;
	}

	type TilePredicate = (tile: Tile) => boolean;

	interface Tiles {
		/** Throws `RangeError` outside the world. Unlike scan callbacks, this view can be kept. */
		get(x: number, y: number): Tile;
		/** Visits every tile, column by column (x outer, y inner). */
		forEach(fn: (tile: Tile) => void, region?: Region): void;
		count(pred: TilePredicate, region?: Region): number;
		/**
		 * Fast id → count map. `"tile"` counts active blocks by tile id;
		 * `"wall"` counts walls by wall id (0 skipped).
		 */
		histogram(kind?: "tile" | "wall", region?: Region): Map<number, number>;
		/**
		 * Raw column-major array (`index = x * height + y`) for very hot loops.
		 * `frame` returns u only, `liquid` returns the liquid type, `actuator` the actuator flag.
		 */
		raw(name: LayerName): Readonly<Uint8Array | Uint16Array | Int16Array>;
		index(x: number, y: number): number;
	}

	// ── Ids ────────────────────────────────────────────────────────────

	type TileGroupName = "corruption" | "crimson" | "hallow" | "jungle" | "snow" | "desert" | "mushroom" | "dungeon" | "meteorite";
	/** Natural (spreadable) biome walls only; player-placed brick walls are excluded. */
	type WallGroupName = "corruption" | "crimson" | "hallow";

	interface Ids {
		/** Id from an English name, case-insensitive. Throws for unknown names. */
		tile(name: string): number;
		wall(name: string): number;
		item(name: string): number;
		/** Name for an id, or `"Tile #id"` when unknown. */
		tileName(id: number): string;
		wallName(id: number): string;
		itemName(id: number): string;
		/** Biome tile sets, shared with TerraWorld's View Biome. */
		readonly TileGroups: Readonly<Record<TileGroupName, ReadonlySet<number>>>;
		readonly WallGroups: Readonly<Record<WallGroupName, ReadonlySet<number>>>;
	}

	interface Regions {
		all(): Region;
		/** Sky and surface, down to `world.surfaceY`. */
		surface(): Region;
		/** `surfaceY` → `rockY`. */
		underground(): Region;
		/** `rockY` → top of the underworld. */
		cavern(): Region;
		/** Bottom 200 rows. */
		underworld(): Region;
		rect(x: number, y: number, w: number, h: number): Region;
	}

	// ── Entities ───────────────────────────────────────────────────────
	// Parsed on demand the first time a script mentions tw.chests / npcs / signs /
	// tileEntities. `tw.entitiesLoaded` is false if parsing was not possible.

	interface ItemStack {
		itemId: number;
		stackSize: number;
		prefix: number;
	}

	interface ChestItem extends ItemStack {
		modName?: string;
		modItemName?: string;
		slot?: number;
		favorited?: boolean;
	}

	interface Chest {
		/** Top-left tile. */
		x: number;
		y: number;
		/** Custom name, "" for unnamed chests. */
		name: string;
		items: ChestItem[];
		maxItems?: number;
	}

	interface Npc {
		spriteId: number;
		name: string;
		displayName?: string;
		/** Position in pixels (divide by 16 for tiles). */
		x: number;
		y: number;
		homeless: boolean;
		/** Home tile, -1 when homeless. */
		homeX: number;
		homeY: number;
		variation: number;
		isTownNpc?: boolean;
		modName?: string;
		modClassName?: string;
	}

	interface Sign {
		x: number;
		y: number;
		text: string;
	}

	interface TileEntity {
		type: number;
		/** e.g. "TrainingDummy", "ItemFrame", "LogicSensor", "DisplayDoll", "WeaponsRack", "HatRack", "FoodPlatter", "TeleportationPylon". */
		typeName: string;
		id: number;
		x: number;
		y: number;
		npcId?: number;
		item?: ItemStack;
		logicCheck?: number;
		on?: boolean;
		items?: Array<ItemStack | null>;
		dyes?: Array<ItemStack | null>;
		misc?: Array<ItemStack | null>;
		pose?: number;
	}

	// ── Map overlays ───────────────────────────────────────────────────

	interface MarkOptions {
		/** Shown in the pointer's tooltip. */
		label?: string;
		/** Item id or English item name used as the pointer icon (default: chest). */
		icon?: number | string;
		/** NPC type id: uses that NPC's map head as the icon. */
		npc?: number;
		/** Pointer border colour (CSS colour). */
		color?: string;
	}

	interface MapApi {
		/**
		 * Replaces the highlight layer with every tile matching `pred`.
		 * Returns the number of highlighted tiles.
		 */
		highlight(pred: TilePredicate, color?: string, label?: string, region?: Region): number;
		/** Adds one Mask Display pointer. At most 5000 pointers per run. */
		mark(x: number, y: number, options?: MarkOptions): void;
		/** Adds many pointers; `defaults` apply to points that omit a field. Returns how many were added. */
		markAll(points: Iterable<{ x: number; y: number } & MarkOptions>, defaults?: MarkOptions): number;
		clearMarks(): void;
		clearHighlight(): void;
	}

	// ── UI ─────────────────────────────────────────────────────────────

	interface StatOptions {
		unit?: string;
		/** Formats as a percentage (2 decimals, "%" unit) with a bar. */
		percent?: boolean;
		color?: string;
		/** Decimal places for numbers. */
		digits?: number;
	}

	interface TableOptions {
		/** Column order; default = every key found in the rows. */
		columns?: string[];
		title?: string;
		/** Adds a "go to" button per row. Default: true when the rows have `x` and `y`. */
		goto?: boolean;
	}

	interface ChartSpec {
		type?: "bar" | "pie" | "line";
		labels: string[];
		values: number[];
		title?: string;
	}

	/** Where output goes: the Script panel, a modal, or a section of either. */
	interface Surface {
		log(...args: unknown[]): void;
		warn(...args: unknown[]): void;
		error(...args: unknown[]): void;
		stat(label: string, value: number | string, options?: StatOptions): void;
		table(rows: readonly Record<string, unknown>[], options?: TableOptions): void;
		chart(spec: ChartSpec): void;
		list(items: readonly unknown[], title?: string): void;
		/** The callback runs later, when clicked; the script stays alive for up to 10 minutes. */
		button(label: string, onClick: () => unknown): void;
		/** A titled group; output written to it appears under the heading. */
		section(title: string): Surface;
		clear(): void;
	}

	type ModalSize = "sm" | "md" | "lg" | "xl" | "fullscreen";

	interface Modal extends Surface {
		setTitle(title: string): void;
		close(): void;
		/** Resolves when the user closes the modal. */
		readonly closed: Promise<void>;
	}

	type FormField =
		| { type: "number"; label: string; default?: number; min?: number; max?: number; step?: number; optional?: boolean }
		| { type: "text"; label: string; default?: string; optional?: boolean }
		| { type: "select"; label: string; options: readonly string[]; default?: string }
		| { type: "checkbox"; label: string; default?: boolean }
		/** Shared block/wall picker. Default: id or English name. Always resolves to an id. */
		| { type: "tile" | "wall"; label: string; default?: number | string }
		/** Item search. Resolves to an item id, or null when optional and left empty. */
		| { type: "item"; label: string; default?: number | string; optional?: boolean };

	interface Form<F extends Record<string, FormField> = Record<string, FormField>> {
		title?: string;
		description?: string;
		submitLabel?: string;
		fields: F;
	}

	/** The value a field resolves to. */
	type FieldValue<T extends FormField> =
		T extends { type: "number"; optional: true } ? number | null
		: T extends { type: "number" } ? number
		: T extends { type: "text" } ? string
		: T extends { type: "select"; options: readonly (infer O)[] } ? O
		: T extends { type: "checkbox" } ? boolean
		: T extends { type: "tile" | "wall" } ? number
		: T extends { type: "item" } ? number | null
		: never;

	type FormValues<F extends Record<string, FormField>> = { [K in keyof F]: FieldValue<F[K]> };

	interface Ui extends Surface {
		/** Same as `tw.map.highlight`. */
		highlight: MapApi["highlight"];
		/** Shows a progress bar under the Run button (`fraction` 0–1). */
		progress(fraction: number, message?: string): void;
		/** Opens a modal for larger output. Waiting for user input does not count toward the time limit. */
		modal(options: { title: string; size?: ModalSize }): Modal;
		/** Asks for input with a form. Resolves to the values, or null if cancelled. */
		prompt<const F extends Record<string, FormField>>(form: Form<F>): Promise<FormValues<F> | null>;
	}

	interface Api {
		/** API version, e.g. "1.0.0". */
		readonly version: string;
		readonly world: World;
		readonly tiles: Tiles;
		readonly ids: Ids;
		readonly regions: Regions;
		readonly map: MapApi;
		readonly ui: Ui;
		readonly entitiesLoaded: boolean;
		readonly chests: readonly Chest[];
		readonly npcs: readonly Npc[];
		readonly signs: readonly Sign[];
		readonly tileEntities: readonly TileEntity[];
	}
}

/**
 * The TerraWorld API. Read-only access to the open world, plus output to the Script
 * panel, modals and map overlays. No network, storage or DOM; a run stops after 30 s
 * of work (time spent waiting for the user is not counted).
 */
declare const tw: TerraWorld.Api;
