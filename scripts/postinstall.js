/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const VENDOR_DIR = path.join(__dirname, "..", "vendor");
const NM = path.join(__dirname, "..", "node_modules");

const PACKAGES = [
  { name: "serwist", tarball: "serwist-9.5.10.tgz" },
  { name: "@serwist/build", tarball: "serwist-build-9.5.10.tgz", dir: ["@serwist", "build"] },
  { name: "@serwist/turbopack", tarball: "serwist-turbopack-9.5.10.tgz", dir: ["@serwist", "turbopack"] },
  { name: "@serwist/utils", tarball: "serwist-utils-9.5.10.tgz", dir: ["@serwist", "utils"] },
  { name: "@serwist/window", tarball: "serwist-window-9.5.10.tgz", dir: ["@serwist", "window"] },
];

for (const pkg of PACKAGES) {
  const destDir = pkg.dir
    ? path.join(NM, ...pkg.dir)
    : path.join(NM, pkg.name);

  if (fs.existsSync(path.join(destDir, "dist", "index.mjs"))) continue;

  console.log(`Extracting ${pkg.name}...`);
  const tarball = path.join(VENDOR_DIR, pkg.tarball);

  if (!fs.existsSync(tarball)) {
    console.warn(`  Missing tarball: ${tarball}`);
    continue;
  }

  const tmpDir = path.join(NM, ".extract-" + pkg.name.replace("/", "-"));
  fs.mkdirSync(tmpDir, { recursive: true });
  execSync(`tar -xzf "${tarball}" -C "${tmpDir}"`, { stdio: "inherit" });

  fs.rmSync(destDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destDir), { recursive: true });
  fs.renameSync(path.join(tmpDir, "package"), destDir);
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(`  Done`);
}
