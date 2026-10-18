const fs = require("fs");
const path = require("path");

const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const arg = process.argv[2] || "patch";
const [major, minor, patch] = (pkg.version || "1.0.0").split(".").map(Number);

let newVersion = "";
if (arg === "minor") {
  newVersion = `${major}.${minor + 1}.0`;
} else if (arg === "major") {
  newVersion = `${major + 1}.0.0`;
} else {
  newVersion = `${major}.${minor}.${(patch || 0) + 1}`;
}

pkg.version = newVersion;
pkg.versionCode = (pkg.versionCode || 6) + 1;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

console.log(`✓ Version updated to ${pkg.version} (versionCode: ${pkg.versionCode})`);
console.log(`Sekarang jalankan: npm run sync:android lalu Build APK di Android Studio.`);
