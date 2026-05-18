const path = require("node:path");

module.exports = {
  appId: "com.segundocerebro.desktop",
  productName: "Segundo Cerebro",
  directories: {
    buildResources: path.join(__dirname, "build-resources"),
    output: path.join(__dirname, "..", "dist-electron"),
  },
  files: [
    "**/*",
    "!*.test.js",
    "!build-resources/**",
  ],
  extraResources: [
    { from: path.join(__dirname, "..", "dist"), to: "renderer", filter: ["**/*"] },
  ],
  mac: {
    category: "public.app-category.productivity",
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: path.join(__dirname, "build-resources", "entitlements.mac.plist"),
    entitlementsInherit: path.join(__dirname, "build-resources", "entitlements.mac.plist"),
    // identity: null skips signing when CSC_LINK env var is absent
    identity: process.env.CSC_LINK ? undefined : null,
    target: [{ target: "dmg", arch: ["arm64", "x64"] }],
  },
  dmg: {
    sign: false,
  },
};
