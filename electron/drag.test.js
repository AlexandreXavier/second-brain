const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parseUriList, isImagePath } = require("./drag.js");

test("parseUriList returns URL from plain string", () => {
  assert.equal(parseUriList("https://example.com"), "https://example.com");
});

test("parseUriList skips comment lines", () => {
  assert.equal(parseUriList("# Comment\r\nhttps://example.com"), "https://example.com");
});

test("parseUriList returns first URL when multiple present", () => {
  assert.equal(parseUriList("https://a.com\r\nhttps://b.com"), "https://a.com");
});

test("parseUriList returns null for empty string", () => {
  assert.equal(parseUriList(""), null);
});

test("isImagePath returns true for jpg", () => {
  assert.equal(isImagePath("photo.jpg"), true);
});

test("isImagePath returns true for png", () => {
  assert.equal(isImagePath("screenshot.png"), true);
});

test("isImagePath returns true for webp", () => {
  assert.equal(isImagePath("image.webp"), true);
});

test("isImagePath returns false for pdf", () => {
  assert.equal(isImagePath("document.pdf"), false);
});
