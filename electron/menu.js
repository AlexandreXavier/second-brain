function buildMenuTemplate({ onCapture, onToggleTheme }) {
  return [
    {
      label: "Arquivo",
      submenu: [
        { label: "Nova captura", accelerator: "CmdOrCtrl+N", click: onCapture },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Editar",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "Ver",
      submenu: [
        { label: "Alternar tema", click: onToggleTheme },
        { type: "separator" },
        { role: "reload" },
        { role: "toggleDevTools" },
      ],
    },
    {
      label: "Janela",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
      ],
    },
  ];
}

module.exports = { buildMenuTemplate };
