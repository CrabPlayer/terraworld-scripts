# TerraWorld Scripts

Scripts, documentation and a place to report problems for the **TerraWorld script library** (`tw`).

TerraWorld is a browser-based Terraria world viewer and editor. Its **Script** panel runs small JavaScript programs
against the world you have open: count blocks, find items in chests, mark Life Crystals on the map, build a report
with tables and charts. Scripts run in a sandboxed Web Worker and talk to the app only through the global `tw` object.

> **Status:** script API version **1**, still settling. Names may change before it is declared stable.
> Scripts are **read-only** for now: they can analyse and mark the map, not edit the world.

[Tiếng Việt](README.vi.md)

## What is here

| Path | Contents |
|---|---|
| [`samples/`](samples) | Official example scripts (the same ones built into the app's *Sample scripts* menu) |
| [`community/<author>/`](community) | Scripts contributed by users, one folder per GitHub username |
| [`docs/`](docs) | Guides and the API reference |
| [`types/`](types) | `terraworld.d.ts` and `jsconfig.json` for autocomplete and type checking in VS Code |

## Install scripts

TerraWorld reads `.js` and `.mjs` files from a folder named **`twscript`** inside your Terraria folder:

| OS | Folder |
|---|---|
| Windows | `Documents\My Games\Terraria\twscript` |
| macOS | `~/Library/Application Support/Terraria/twscript` |
| Linux | `~/.local/share/Terraria/twscript` |

Create the `twscript` folder if it does not exist, then either:

**Clone this repository into it** (easy to update with `git pull`):

```bash
cd "Documents/My Games/Terraria/twscript"
git clone https://github.com/CrabPlayer/terraworld-scripts.git
```

**Or copy single files** — download any `.js` file from `samples/` or `community/` and drop it into `twscript`.

What the app reads:

- `.js` and `.mjs` files, up to **3 levels of sub-folders** deep. A clone of this repo fits:
  `twscript/terraworld-scripts/community/<author>/script.js` is three folders down.
- At most 300 files and 512 KB per file. Files and folders starting with `.` and `node_modules` are skipped.
- The app writes to the folder only when you save from its editor (see below).

## Run a script

1. Open TerraWorld in a Chromium-based browser (Chrome, Edge, Opera…) and load a world.
2. Open **Data → Script** to show the Script panel.
3. Open **Local scripts**. The first time, choose your Terraria folder or the `twscript` folder and allow read access.
   If you already gave the World Library access to your Terraria folder, it is reused.
4. Pick a script. It loads into the editor; press **Run** (or <kbd>Ctrl</kbd>+<kbd>Enter</kbd>).
5. If you edit the file in another editor, use **Reload from disk** to pick up the change.

## Write scripts in the app

The Script panel has a full code editor (CodeMirror): syntax colours, line numbers, search (<kbd>Ctrl</kbd>+<kbd>F</kbd>),
and suggestions for `tw.*` as you type, with documentation on hover and a red underline for `tw.*` names that do not
exist. The suggestions come from the same [`terraworld.d.ts`](types/terraworld.d.ts) published here.

Scripts save straight into `twscript`, so there is no copy and paste:

- **Save** (<kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>S</kbd>) overwrites the local file you opened.
- **Save as new file** (in the *Local scripts* menu, or <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>S</kbd> when no file is open)
  asks for a name, adds `.js` and creates `twscript` if needed. An existing file is replaced only after you confirm.
- The first save asks for write access to the folder.

**Ask AI** next to **Run** prepares a message for ChatGPT, Claude or another assistant, including the full API
types; see [docs/ai-guide.md](docs/ai-guide.md).

Firefox and Safari cannot open local folders, so *Local scripts* and saving are unavailable there. You can still
paste a script into the editor and run it, or start from the **Sample scripts** menu.

## Documentation

- [Getting started](docs/getting-started.md) — your first script, step by step
- [API reference](docs/api-reference.md) — every `tw.*` namespace
- [UI blocks, modals and prompts](docs/ui-blocks.md) — `tw.ui`
- [Map marks and highlights](docs/map-marks.md) — `tw.map`
- [Sandbox and limits](docs/sandbox.md) — what scripts cannot do
- [Guide for AI assistants](docs/ai-guide.md) — paste this into ChatGPT/Claude to have it write a script for you
- [Types](types) — `terraworld.d.ts`, the exact API; it wins when the docs disagree

## Contribute

- **Share a script:** open a pull request adding `community/<your-github-name>/<script>.js`,
  or use the *Script submission* issue form if you do not use Git. See [CONTRIBUTING.md](CONTRIBUTING.md).
- **Ask for a script:** use the *Script request* issue form.
- **Report a bug** in the `tw` API or the Script panel: use the *Bug report* issue form.

Every script starts with a header:

```js
// @name Mark Life Crystals
// @author your-github-name
// @description Marks every Life Crystal on the map and lists the ones closest to spawn.
// @tw-api 1
```

## License

[MIT](LICENSE). By contributing a script you agree to release it under the same license.
Terraria is a trademark of Re-Logic; this project is not affiliated with Re-Logic.
