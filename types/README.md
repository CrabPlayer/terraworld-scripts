# Types

| File | What it is |
|---|---|
| [`terraworld.d.ts`](terraworld.d.ts) | TypeScript declarations for the `tw` API, **API version 1.0.0** (`@tw-api-version` in its header) |
| [`jsconfig.json`](jsconfig.json) | Editor settings that make VS Code check plain `.js` scripts against those types |

These are copies. The original files live in the TerraWorld app (`static/scripting/`), where a test keeps
`terraworld.d.ts` in step with the real runtime. Once the app is deployed with them, they are also served at
`https://terraworld.dev/scripting/terraworld.d.ts` and `https://terraworld.dev/scripting/jsconfig.json`.

**When the docs and `terraworld.d.ts` disagree, `terraworld.d.ts` is right.** Please
[report the difference](https://github.com/CrabPlayer/terraworld-scripts/issues/new?template=bug-report.yml).

## Autocomplete in VS Code

**For your own scripts:** copy both files into your `twscript` folder, next to your scripts, then open that folder
in VS Code (*File → Open Folder…*):

```
Documents/My Games/Terraria/twscript/
  terraworld.d.ts
  jsconfig.json
  my-script.js
```

You get suggestions and hover docs for `tw.*`, and type errors are underlined. TerraWorld ignores the two extra
files: it only lists `.js`/`.mjs` scripts.

**For this repository:** the `jsconfig.json` at the repository root already points at `types/terraworld.d.ts`,
so opening a clone in VS Code works without copying anything.

## Known editor warning

VS Code underlines a top-level `return` with *"A 'return' statement can only be used within a function body"*.
TerraWorld runs it fine, because each script is the body of an async function. Ignore the warning, or write
`if (opt) { ... }` instead of `if (!opt) return;`. CI is not affected: it wraps each script in a function before
type-checking.

`jsconfig.json` uses `lib: ["ES2022"]` on purpose, so browser APIs such as `fetch` and `document`, which do not
exist inside the sandbox, are not suggested.
