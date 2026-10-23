// Processo principale di Electron: apre una sola finestra e carica l'interfaccia.
// Nessun accesso alla rete, nessun Node nel renderer: è tutto finto.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('node:path');

const isMac = process.platform === 'darwin';
const devUrl = process.env.FAKEHACKING_DEV_URL;

function buildMenu() {
  if (!isMac) {
    Menu.setApplicationMenu(null);
    return;
  }
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { role: 'appMenu' },
      { role: 'editMenu' },
      { label: 'Vista', submenu: [{ role: 'togglefullscreen', label: 'Schermo intero' }] },
      { role: 'windowMenu' },
    ]),
  );
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    backgroundColor: '#1e1e1e',
    title: 'Hacking',
    titleBarStyle: 'hidden',
    ...(isMac
      ? { trafficLightPosition: { x: 12, y: 9 } }
      : { titleBarOverlay: { color: '#323233', symbolColor: '#cccccc', height: 30 } }),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: !app.isPackaged,
    },
  });

  // Niente finestre esterne né navigazione: l'app vive in una sola pagina.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://github.com/')) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event) => event.preventDefault());

  const query = { platform: process.platform };
  if (devUrl) win.loadURL(`${devUrl}?platform=${process.platform}`);
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), { query });

  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
  });
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => app.quit());
