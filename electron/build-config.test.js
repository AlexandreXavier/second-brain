const { test } = require("node:test");
const assert = require("node:assert/strict");
const config = require("./build-config.js");

test("config has appId", () => {
  assert.ok(config.appId, "appId is required for macOS signing");
});

test("config has productName", () => {
  assert.ok(config.productName);
});

test("config targets dmg for mac", () => {
  const hasDmg = config.mac.target.some((t) => t.target === "dmg");
  assert.ok(hasDmg);
});

test("config targets both arm64 and x64 architectures", () => {
  const dmg = config.mac.target.find((t) => t.target === "dmg");
  assert.ok(dmg.arch.includes("arm64") && dmg.arch.includes("x64"));
});

test("config enables hardenedRuntime for Gatekeeper compliance", () => {
  assert.equal(config.mac.hardenedRuntime, true);
});

test("config excludes test files from bundle", () => {
  const excludesTests = config.files.some((f) => f.startsWith("!") && f.includes("test"));
  assert.ok(excludesTests);
});

test("config copies renderer build as extra resource", () => {
  const hasRenderer = config.extraResources?.some((r) => r.to === "renderer");
  assert.ok(hasRenderer);
});

test("config output goes to dist-electron", () => {
  assert.ok(config.directories.output.includes("dist-electron"));
});
