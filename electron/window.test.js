const { test } = require("node:test");
const assert = require("node:assert/strict");
const { resolveRendererUrl, createWindowOptions, shouldAllowPopup } = require("./window.js");

test("resolveRendererUrl returns Vite dev server URL in dev mode", () => {
  const url = resolveRendererUrl(true, "/any/path");
  assert.equal(url, "http://localhost:5173");
});

test("resolveRendererUrl returns file:// URL for dist/index.html in production", () => {
  const url = resolveRendererUrl(false, "/app/dist");
  assert.equal(url, "file:///app/dist/index.html");
});

test("createWindowOptions disables nodeIntegration", () => {
  const options = createWindowOptions();
  assert.equal(options.webPreferences.nodeIntegration, false);
});

test("createWindowOptions enables contextIsolation", () => {
  const options = createWindowOptions();
  assert.equal(options.webPreferences.contextIsolation, true);
});

test("shouldAllowPopup allows HTTPS URLs", () => {
  assert.equal(shouldAllowPopup("https://my-brain-9d788.firebaseapp.com/__/auth/handler"), true);
});

test("shouldAllowPopup denies HTTP URLs", () => {
  assert.equal(shouldAllowPopup("http://example.com"), false);
});

test("shouldAllowPopup denies file:// URLs", () => {
  assert.equal(shouldAllowPopup("file:///etc/passwd"), false);
});
