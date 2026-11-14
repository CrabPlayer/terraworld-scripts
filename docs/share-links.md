# Share links ("Open in TerraWorld")

A share link opens TerraWorld with a script already in the Script editor:

```
https://terraworld.dev/world#script=1.<payload>
```

## What happens when someone opens a link

- TerraWorld opens the world page. If no world is loaded yet, the link waits until one is.
- The Script panel opens and the script is put in the editor. **It is never run automatically.** A notice says the
  script came from a link and should be read before running, and **Restore my script** brings back what was in
  the editor before.
- The script is detached from any local file you had open, so <kbd>Ctrl</kbd>+<kbd>S</kbd> does not overwrite it.
- The `#script=…` part is removed from the address bar right away, so reloading does not load it again. Pasting a
  link into a tab that already has TerraWorld open works too.
- A damaged link shows an error and leaves the editor as it was.

The script travels in the URL fragment (after `#`), which browsers never send to any server.

## Making a link

**In the app:** the *Copy link to this script* button in the Script panel toolbar. The link points at the site you
are using (a link made on a local dev server points at that server).

**From this repository:**

```bash
node tools/make-link.mjs path/to/script.js
```

It prints the link after decoding it again with the app's rules, so it never prints a link that would not open.
Use `--base http://localhost:5173/world` to point at a local dev server. Maintainers refresh the links in
[samples/README.md](../samples/README.md) with:

```bash
node tools/make-link.mjs --update-readme
```

CI fails if those links no longer match the sample code.

## Format, version 1

| Part | Value |
|---|---|
| Page | `https://terraworld.dev/world` |
| Fragment | `#script=<version>.<payload>` |
| `version` | `1` |
| `payload` | base64url, **without** `=` padding, of the **zlib** stream (deflate with the zlib header and Adler-32 checksum, not raw deflate or gzip) of the script's exact UTF-8 bytes |

- The bytes are kept exactly: line endings (CRLF stays CRLF), a BOM, any Unicode.
- The Adler-32 checksum makes a truncated or edited link fail instead of opening slightly different code.
- Any compression level decodes; the app and `tools/make-link.mjs` use level 9.
- In Node: `"#script=1." + zlib.deflateSync(Buffer.from(code, "utf8"), { level: 9 }).toString("base64url")`.
- Later formats will use a different version number. Version 1 links will keep working.

### Limits

| Limit | Value |
|---|---|
| Whole link, when created (app and `make-link.mjs`) | 8192 characters; longer scripts should be shared as a `.js` file |
| Payload, when read | 64 KB |
| Decompressed script, when read | 512 KB |
| Text | must be valid UTF-8 |

The reader tolerates a percent-encoded fragment and trailing whitespace (some chat apps add them). Errors are
reported as `damaged`, `too-large` or `unsupported-version`.

The reference implementation is `src/lib/scripting/shareLink.ts` in the TerraWorld app; `tools/make-link.mjs`
follows the same rules.
