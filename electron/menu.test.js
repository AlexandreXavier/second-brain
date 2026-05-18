const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const { buildMenuTemplate } = require("./menu.js");

function findByAccelerator(items, accel) {
  for (const item of items) {
    if (item.accelerator === accel) return item;
    if (item.submenu) {
      const found = findByAccelerator(item.submenu, accel);
      if (found) return found;
    }
  }
  return null;
}

function findAllByRole(items, role) {
  const found = [];
  for (const item of items) {
    if (item.role === role) found.push(item);
    if (item.submenu) found.push(...findAllByRole(item.submenu, role));
  }
  return found;
}

test("⌘N item has accelerator CmdOrCtrl+N", () => {
  const template = buildMenuTemplate({ onCapture: mock.fn(), onToggleTheme: mock.fn() });
  const item = findByAccelerator(template, "CmdOrCtrl+N");
  assert.ok(item, "no item with accelerator CmdOrCtrl+N found");
});

test("⌘N click fires onCapture callback", () => {
  const onCapture = mock.fn();
  const template = buildMenuTemplate({ onCapture, onToggleTheme: mock.fn() });
  const item = findByAccelerator(template, "CmdOrCtrl+N");
  item.click();
  assert.equal(onCapture.mock.calls.length, 1);
});

test("Edit submenu includes cut, copy, paste and selectAll roles", () => {
  const template = buildMenuTemplate({ onCapture: mock.fn(), onToggleTheme: mock.fn() });
  for (const role of ["cut", "copy", "paste", "selectAll"]) {
    assert.equal(findAllByRole(template, role).length, 1, `missing role: ${role}`);
  }
});
