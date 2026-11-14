# Sandbox and limits

Scripts run in a separate Web Worker, away from the page. This keeps a slow or broken script from freezing the app,
and keeps scripts away from your browser data. It is a safety net for scripts **you choose to run**, not a guarantee
for code from strangers: read a script before running it, especially one that is hard to read.

## How your code runs

Your file becomes the body of an async function:

```js
(async function (tw) {
  "use strict";
  // your script here
})(tw);
```

So:

- Top-level `await` and `return` work.
- Strict mode is on: assigning to an undeclared variable is an error.
- `import` / `export` statements do **not** work, even in `.mjs` files: each file is a standalone script.
  To share code, copy the helper into the file.
- Each run starts from a fresh function. Variables do not survive between runs.

## What is blocked

These globals are removed before your script runs: `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`,
`importScripts`, `indexedDB`, `caches`, `Worker`, `SharedWorker`, `BroadcastChannel`, `WebTransport`,
`postMessage`, `close`.

There is no DOM (`document`, `window`), no `localStorage`, no cookies, and no access to the app's state other than
what `tw` exposes.

Do not try to get around these. Scripts that do (for example by loading code from a URL, or reaching the worker's
messaging) are rejected from this repository, and may break without notice.

## Reading and editing

Scripts read a **snapshot** of the world taken when the run starts. Highlights and pointers are display only.

The only way a script can change the world is [`tw.edit`](editing.md) (API 1.2.0): it builds a draft, and nothing
changes until **you** press Apply in the preview; the change is then one undo step. Only plain vanilla blocks and walls
can be placed, and furniture and modded cells are skipped. Scripts cannot edit chests, signs or other entities, and
nothing is saved to the world file until you save the world yourself.

## Time limit: 30 seconds

A script may use up to **30 s of computing time**. Past that it is stopped with
`Script exceeded the 30 s time limit and was stopped.` Time spent waiting in `tw.ui.prompt`, `tw.ui.pickRegion`, `tw.ui.pickTile` or the `tw.edit.commit` preview does not count.
**Stop** in the Script panel ends a script at any time.

If you hit the limit:

- Use `tw.tiles.histogram` instead of `count` when you need counts by type.
- Pass a `region` to scan only the part of the world you need.
- Use `tw.tiles.raw()` with plain loops in hot paths.
- Avoid creating objects for every tile; collect only matches.

## Output limits

| Limit | Value |
|---|---|
| Log lines per surface | 1000 (further lines are dropped with a warning) |
| Table rows | 5000 |
| Map pointers per run | 5000 |
| Text of one logged value | about 4000 characters |
| Idle time with live buttons | 10 minutes |

## Local script files

| Limit | Value |
|---|---|
| File types | `.js`, `.mjs` |
| Folder depth inside `twscript` | 3 levels of sub-folders |
| Files listed | 300 |
| File size | 512 KB |
| Skipped | names starting with `.`, `node_modules` |
| Browsers | Chromium-based (folder access needs the File System Access API) |

The app writes to this folder only when you save from its editor (**Save** / **Save as new file**), after asking for
write access. Scripts themselves can never write files.

## Memory

Only the tile layers a script uses are copied into the worker (see
[tile layers](api-reference.md#tile-layers-and-tw-layers)). On a large world each layer can be tens of MB, so
`// @tw-layers all` on a large world uses a lot of memory. Ask only for what you need.
