// Ditulis otomatis tiap `pnpm build` — jangan edit manual.
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

let hash = "unknown";
try {
  hash = execSync("git rev-parse --short HEAD", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
} catch {
  /* bukan repo git / git tidak ada */
}

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));

const content = `// Auto-generated saat build. JANGAN edit manual.
export const BUILD_TIME = "${new Date().toISOString()}";
export const GIT_HASH = "${hash}";
export const APP_VERSION = "${pkg.version}+${hash}";
`;

fs.writeFileSync(path.join(__dirname, "..", "src", "lib", "build-info.ts"), content);
console.log("[build-info]", pkg.version, hash, new Date().toISOString());
