const { app, BrowserWindow, Menu } = require("electron");
const path = require("node:path");
const { resolveRendererUrl, createWindowOptions, shouldAllowPopup } = require("./window.js");
const { buildMenuTemplate } = require("./menu.js");

const isDev = !app.isPackaged;
const distDir = path.join(__dirname, "..", "dist");

function createWindow() {
  const options = createWindowOptions();
  options.webPreferences.preload = path.join(__dirname, "preload.js");

  const win = new BrowserWindow(options);

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (shouldAllowPopup(url)) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 500,
          height: 600,
          webPreferences: { nodeIntegration: false, contextIsolation: true },
        },
      };
    }
    return { action: "deny" };
  });

  const menu = Menu.buildFromTemplate(buildMenuTemplate({
    onCapture: () => win.webContents.send("menu-action", "open-capture"),
    onToggleTheme: () => win.webContents.send("menu-action", "toggle-theme"),
  }));
  Menu.setApplicationMenu(menu);

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
