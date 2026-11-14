# Contributing

Thanks for helping! This repository collects TerraWorld scripts, their documentation, and bug reports for the
`tw` script API. Contributions are welcome in English or Vietnamese.

## Ways to contribute

| You want to… | Do this |
|---|---|
| Share a script | Open a pull request (below), or use the **Script submission** issue form if you do not use Git |
| Ask for a script | **Script request** issue form |
| Report a bug in the `tw` API or the Script panel | **Bug report** issue form |
| Fix or improve the docs | Pull request editing `docs/` |

## Adding a script

1. Fork the repository and create a branch.
2. Add **one** file: `community/<your-github-name>/<script-name>.js`
   - lowercase file names with dashes, e.g. `find-shimmer.js`;
   - no sub-folders inside your author folder (the app only reads three folder levels inside `twscript`).
3. Start the file with the header below.
4. Run the script in TerraWorld on at least one world and check the output.
5. Optionally run the same checks as CI:
   - `node .github/scripts/check-scripts.mjs` (header and syntax);
   - `TSC="npx -y -p typescript@5 tsc" node .github/scripts/typecheck-scripts.mjs` (types, against
     [`types/terraworld.d.ts`](types/terraworld.d.ts)).
   Opening the repository in VS Code shows the same type errors as you type.
6. Open a pull request and fill in the template.

To give reviewers and users a one-click way to try it, put an *Open in TerraWorld* link in your PR description:
`node tools/make-link.mjs community/<your-github-name>/<script-name>.js` (see [docs/share-links.md](docs/share-links.md)).
Scripts that use `tw.edit` must call `await tw.edit.commit({ label })` with a clear label and report `result.applied`
(see [docs/editing.md](docs/editing.md)).

### One script per pull request

Each pull request adds or changes **one** script. This keeps reviews short and lets each script be accepted on its
own. Fixing a typo across several of your own scripts is fine in one PR.

### Header

Every script starts with these comment lines:

```js
// @name Find Shimmer
// @author your-github-name
// @description Marks every Shimmer pool and lists their sizes.
// @tw-api 1
```

| Key | Required | Meaning |
|---|---|---|
| `@name` | yes | Short title shown to users |
| `@author` | yes | Your GitHub username; must match your folder name |
| `@description` | yes | One sentence: what the script does |
| `@tw-api` | yes | API version the script targets. Currently `1` |
| `@tw-layers` | no | Tile layers to load when auto-detection misses one, e.g. `// @tw-layers wall, liquid`. See [api-reference.md](docs/api-reference.md#tile-layers-and-tw-layers) |

Keep the header lines at the very top, before any code. CI checks that `@name`, `@author`, `@description` and
`@tw-api` are present, that the script compiles the way TerraWorld runs it, and that it type-checks against
`types/terraworld.d.ts`.

### What gets accepted

- Uses only the `tw` API declared in [`types/terraworld.d.ts`](types/terraworld.d.ts) (explained in
  [api-reference.md](docs/api-reference.md)). No calls to features listed under *Not available yet*.
- **No sandbox workarounds.** Do not try to reach the network, storage, the worker's messaging, other globals
  removed by the sandbox, or anything outside `tw`. Do not load or evaluate code from strings or URLs.
  Pull requests that do this are closed.
- No obfuscated or minified code. Reviewers must be able to read it.
- Finishes well within the 30 s limit on a large world, or explains in `@description` that it is slow.
- English names in code and output are preferred so more people can use it; comments may be in any language.
- You wrote it, or have the right to share it under the [MIT license](LICENSE).

### Updating a script

Change your own scripts freely. To change someone else's script, open an issue or tag them in the pull request first.

## Reporting bugs

Use the **Bug report** form. Include the smallest script that shows the problem, the error text from the Script
panel, your browser, and the world size (small/medium/large). Do not attach world files that contain anything you
do not want public.

## Code of conduct

Be kind and assume good intent. Harassment, spam and malicious scripts lead to removal.
