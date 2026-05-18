function resolveRendererUrl(isDev, distDir) {
  if (isDev) return "http://localhost:5173";
  return `file://${distDir}/index.html`;
}

function createWindowOptions() {
  return {
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  };
}

module.exports = { resolveRendererUrl, createWindowOptions };
