// Type-checks every script in samples/ and community/ against types/terraworld.d.ts.
//
// TerraWorld runs a script as the body of an async function, so top-level `return`
// is valid at run time but TypeScript reports it (TS1108). Each script is therefore
// copied into a temp folder wrapped in `async function __twScript() { ... }`, then
// checked with the compiler options of types/jsconfig.json. Line numbers in the
// output are mapped back to the original files.
//
// Usage: node .github/scripts/typecheck-scripts.mjs
// Needs `tsc` on PATH, or set TSC to a command (CI uses `npx -y -p typescript@5 tsc`).
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOTS = ["samples", "community"];
const repo = process.cwd();

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith(".")) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.m?js$/i.test(entry.name) ? [full] : [];
  });
}

const files = ROOTS.flatMap(walk);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "tw-typecheck-"));

for (const file of files) {
  const rel = path.relative(repo, file).split(path.sep).join("/");
  const target = path.join(tmp, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `async function __twScript() {\n${fs.readFileSync(file, "utf8")}\n}\n`);
}
fs.copyFileSync(path.join(repo, "types/terraworld.d.ts"), path.join(tmp, "terraworld.d.ts"));
const { compilerOptions } = JSON.parse(fs.readFileSync(path.join(repo, "types/jsconfig.json"), "utf8"));
fs.writeFileSync(path.join(tmp, "tsconfig.json"), JSON.stringify({
  compilerOptions: { ...compilerOptions, allowJs: true },
  include: ["**/*.js", "**/*.mjs", "terraworld.d.ts"],
}, null, 2));

const tsc = process.env.TSC ?? "tsc";
let output = "";
let failed = false;
try {
  output = execSync(`${tsc} -p tsconfig.json --pretty false`, { cwd: tmp, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
} catch (error) {
  failed = true;
  output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
}
fs.rmSync(tmp, { recursive: true, force: true });

// "samples/x.js(12,5): error TS2339: ..." -> original line = 12 - 1 (the wrapper line).
const mapped = output.replace(/^(.+?\.m?js)\((\d+),(\d+)\)/gm, (_, file, line, col) => `${file}(${Number(line) - 1},${col})`);
if (mapped.trim()) console.log(mapped.trim());
console.log(`\n${files.length} script(s) type-checked against types/terraworld.d.ts: ${failed ? "errors found" : "ok"}.`);
process.exit(failed ? 1 : 0);
