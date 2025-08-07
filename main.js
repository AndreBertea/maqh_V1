
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  // Empêche l'ouverture de nouvelles fenêtres via window.open
  win.webContents.setWindowOpenHandler(({ url }) => {
    // Ouvre les liens externes dans le navigateur par défaut
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Bloque la navigation hors de l'app
  win.webContents.on('will-navigate', (e, url) => {
    const currentUrl = new URL(`file://${path.join(__dirname, 'index.html')}`);
    if (!url.startsWith(currentUrl.origin)) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });

  win.once('ready-to-show', () => win.show());
  win.loadFile('index.html');

  if (!app.isPackaged) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


