/**
 * CiteMind Desktop — Electron Main Process
 * Spawns the backend API server and loads the frontend.
 */

const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const log = require('electron-log');

// Setup logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

const isDev = process.env.NODE_ENV === 'development';
const PORT = process.env.CITEMIND_PORT || 3001;
const API_PORT = process.env.CITEMIND_API_PORT || 3000;

let mainWindow = null;
let apiProcess = null;
let splashWindow = null;

// ─── Paths ───
const getResourcePath = (relativePath) => {
  if (isDev) {
    return path.join(__dirname, '../..', relativePath);
  }
  // In packaged app, extraResources are at process.resourcesPath
  return path.join(process.resourcesPath, relativePath);
};

const WEB_DIST = isDev
  ? path.join(__dirname, '../../apps/web/dist')
  : path.join(process.resourcesPath, 'web');

const API_DIR = isDev
  ? path.join(__dirname, '../../services/api')
  : path.join(process.resourcesPath, 'api');

// ─── Splash Window ───
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 320,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const splashHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 480px; height: 320px;
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #F8FAFC; border-radius: 16px; overflow: hidden;
    }
    .logo { font-size: 42px; font-weight: 700; margin-bottom: 8px; }
    .tagline { font-size: 14px; color: #94A3B8; margin-bottom: 32px; }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid #334155;
      border-top-color: #3B82F6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .status { margin-top: 20px; font-size: 12px; color: #64748B; }
  </style>
</head>
<body>
  <div class="logo">◆ CiteMind</div>
  <div class="tagline">AI-Powered Research Notebook</div>
  <div class="spinner"></div>
  <div class="status" id="status">Starting backend services...</div>
  <script>
    const { ipcRenderer } = require('electron');
    ipcRenderer.on('status', (_, msg) => {
      document.getElementById('status').textContent = msg;
    });
  </script>
</body>
</html>`;

  const splashPath = path.join(app.getPath('temp'), 'citemind-splash.html');
  fs.writeFileSync(splashPath, splashHtml);
  splashWindow.loadFile(splashPath);
  splashWindow.center();
}

function updateSplashStatus(msg) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('status', msg);
  }
}

// ─── Start Backend API ───
function startBackend() {
  return new Promise((resolve, reject) => {
    log.info('Starting backend API server...');
    updateSplashStatus('Starting backend API server...');

    const apiEntry = path.join(API_DIR, 'dist', 'index.js');
    const hasBuiltApi = fs.existsSync(apiEntry);

    let cmd, args, cwd;
    if (hasBuiltApi) {
      // Production: run compiled JS
      cmd = process.execPath;
      args = [apiEntry];
      cwd = API_DIR;
    } else {
      // Development: run with ts-node or node directly
      const pkgJson = path.join(API_DIR, 'package.json');
      const hasPkg = fs.existsSync(pkgJson);
      if (hasPkg) {
        cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        args = ['run', 'start'];
        cwd = API_DIR;
      } else {
        reject(new Error('Backend API not found at ' + API_DIR));
        return;
      }
    }

    log.info(`Spawning: ${cmd} ${args.join(' ')} in ${cwd}`);

    apiProcess = spawn(cmd, args, {
      cwd,
      env: {
        ...process.env,
        PORT: String(API_PORT),
        NODE_ENV: isDev ? 'development' : 'production',
        DATABASE_URL: process.env.DATABASE_URL || `file:${path.join(app.getPath('userData'), 'citemind.db')}`,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        reject(new Error('Backend startup timeout (30s)'));
      }
    }, 30000);

    apiProcess.stdout.on('data', (data) => {
      const line = data.toString().trim();
      log.info('[API]', line);
      if (!started && (line.includes('listening') || line.includes('ready') || line.includes('3000'))) {
        started = true;
        clearTimeout(timeout);
        updateSplashStatus('Backend ready. Loading app...');
        setTimeout(resolve, 500);
      }
    });

    apiProcess.stderr.on('data', (data) => {
      log.warn('[API stderr]', data.toString().trim());
    });

    apiProcess.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    apiProcess.on('exit', (code) => {
      if (!started) {
        clearTimeout(timeout);
        reject(new Error(`Backend exited with code ${code}`));
      } else {
        log.warn(`Backend exited with code ${code}`);
      }
    });
  });
}

// ─── Create Main Window ───
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
  });

  // Load frontend
  const webIndex = path.join(WEB_DIST, 'index.html');
  const hasWebBuild = fs.existsSync(webIndex);

  if (isDev && !hasWebBuild) {
    // Dev mode: assume Vite dev server is running
    mainWindow.loadURL(`http://localhost:${PORT}`);
    mainWindow.webContents.openDevTools();
  } else if (hasWebBuild) {
    mainWindow.loadFile(webIndex);
  } else {
    dialog.showErrorBox('Build Missing', `Frontend build not found at ${webIndex}. Run 'npm run build:web' first.`);
    app.quit();
    return;
  }

  mainWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ─── App Lifecycle ───
app.whenReady().then(async () => {
  createSplashWindow();

  try {
    await startBackend();
    createMainWindow();
  } catch (err) {
    log.error('Failed to start:', err);
    updateSplashStatus('Error: ' + err.message);
    dialog.showErrorBox('Startup Error', `Failed to start CiteMind:\n\n${err.message}\n\nCheck logs at:\n${log.transports.file.getFile().path}`);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (apiProcess) {
    apiProcess.kill();
    apiProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (apiProcess) {
    apiProcess.kill('SIGTERM');
  }
});

app.on('quit', () => {
  if (apiProcess) {
    apiProcess.kill('SIGKILL');
  }
});

// ─── IPC Handlers ───
ipcMain.handle('app:version', () => app.getVersion());

ipcMain.handle('app:platform', () => process.platform);

ipcMain.handle('dialog:open-file', async (_, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result.filePaths;
});

ipcMain.handle('dialog:save-file', async (_, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result.filePath;
});

ipcMain.handle('shell:open-path', async (_, filePath) => {
  shell.openPath(filePath);
});

ipcMain.handle('shell:open-external', async (_, url) => {
  shell.openExternal(url);
});

// Auto-updater (basic setup)
if (!isDev) {
  const { autoUpdater } = require('electron-updater');
  autoUpdater.checkForUpdatesAndNotify();
}
