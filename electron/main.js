const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const { resolveRendererUrl, createWindowOptions } = require("./window.js");

const isDev = !app.isPackaged;
const distDir = path.join(__dirname, "..", "dist");

function createWindow() {
  const win = new BrowserWindow(createWindowOptions());
  win.loadURL(resolveRendererUrl(isDev, distDir));
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
