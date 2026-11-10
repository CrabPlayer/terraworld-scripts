// Checks every script in samples/ and community/:
//   1. It compiles the way TerraWorld runs it: wrapped in an async function body
//      with "use strict", so top-level `await` and `return` are allowed.
//      (A plain `node --check` rejects that mix, so it is not used.)
//   2. It has the required header: @name, @author, @description, @tw-api.
//   3. It is at most 512 KB, the app's per-file limit.
// Usage: node .github/scripts/check-scripts.mjs [files...]
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOTS = ["samples", "community"];
const REQUIRED = ["name", "author", "description", "tw-api"];
const MAX_BYTES = 512 * 1024;
const SCRIPT_FILE = /\.m?js$/i;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.name.startsWith(".")) return [];
    if (entry.isDirectory()) return walk(full);
    return SCRIPT_FILE.test(entry.name) ? [full] : [];
  });
}

/** Reads `// @key value` lines from the comment block at the top of the file. */
function readHeader(code) {
  const header = {};
  for (const line of code.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    if (!trimmed.startsWith("//")) break;
    const match = /^\/\/\s*@([\w-]+)\s*(.*)$/.exec(trimmed);
    if (match) header[match[1]] = match[2].trim();
  }
  return header;
}

const files = process.argv.length > 2 ? process.argv.slice(2) : ROOTS.flatMap(walk);
let failures = 0;

for (const file of files) {
  const problems = [];
  const bytes = fs.statSync(file).size;
  if (bytes > MAX_BYTES) problems.push(`file is ${Math.ceil(bytes / 1024)} KB; the app reads at most 512 KB`);

  const code = fs.readFileSync(file, "utf8");
  const header = readHeader(code);
  for (const key of REQUIRED) {
    if (!header[key]) problems.push(`missing header line "// @${key} ..."`);
  }
  if (header["tw-api"] && header["tw-api"] !== "1") problems.push(`@tw-api must be 1 (got "${header["tw-api"]}")`);

  // community/<author>/<script>.js: the folder names the author, and nothing deeper is read by the app.
  const parts = path.relative(".", file).split(path.sep);
  if (parts[0] === "community") {
    if (parts.length !== 3) problems.push("community scripts go directly in community/<your-github-name>/ (no sub-folders)");
    else if (header.author && header.author.toLowerCase() !== parts[1].toLowerCase()) {
      problems.push(`@author "${header.author}" does not match folder "${parts[1]}"`);
    }
  }

  try {
    new vm.Script(`(async function (tw) {\n"use strict";\n${code}\n})`, { filename: file });
  } catch (error) {
    problems.push(`syntax error: ${error.message}`);
  }

  if (problems.length) {
    failures++;
    console.log(`✗ ${file}`);
    for (const problem of problems) console.log(`    ${problem}`);
  } else {
    console.log(`✓ ${file}`);
  }
}

console.log(`\n${files.length} script(s) checked, ${failures} with problems.`);
process.exit(failures ? 1 : 0);
