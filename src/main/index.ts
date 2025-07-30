import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  nativeImage
} from 'electron';
import path, { join } from 'path';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import Store from 'electron-store';

// If you have an app icon under resources/, keep this import.
// Otherwise you can remove it and the tray will use an empty icon.
import icon from '../../resources/icon.png?asset';

import { OutageMonitor } from './monitor';
import { performAction, type PowerAction } from './power';

// -----------------------------
// Settings & defaults
// -----------------------------
type Settings = {
  targetIp: string;
  action: PowerAction;
  failureSeconds: number;
  confirmCountdown: number;
  startWithWindows: boolean;
  enabled: boolean;
  snoozeMinutes: number;
};

const defaults: Settings = {
  targetIp: '192.168.1.50',
  action: 'hibernate',
  failureSeconds: 8,
  confirmCountdown: 20,
  startWithWindows: true,
  enabled: true,
  snoozeMinutes: 5
};

const store = new Store<Settings>({ defaults });


// -----------------------------
// Globals
// -----------------------------
let tray: Tray | null = null;
let settingsWin: BrowserWindow | null = null;
let confirmWin: BrowserWindow | null = null;

const preloadFile = join(__dirname, '../preload/index.mjs');

const rendererUrl = process.env['ELECTRON_RENDERER_URL'];

// Monitor instance
const monitor = new OutageMonitor({
  targetIp: store.get('targetIp'),
  failureSeconds: store.get('failureSeconds'),
  intervalMs: 1000
});

// -----------------------------
// Helpers
// -----------------------------
function applyLoginItem() {
  app.setLoginItemSettings({
    openAtLogin: store.get('startWithWindows')
  });
}

function createSettingsWindow() {
  if (settingsWin) return settingsWin;

  settingsWin = new BrowserWindow({
    width: 560,
    height: 900,
    show: false, // start hidden; show when user clicks tray
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: preloadFile,
      sandbox: false
    }
  });

  if (rendererUrl) settingsWin.loadURL(rendererUrl);
  else settingsWin.loadFile(join(__dirname, '../renderer/index.html'));

  // Keep app alive in tray when window is closed
  settingsWin.on('close', (e) => {
    e.preventDefault();
    settingsWin?.hide();
  });

  settingsWin.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  return settingsWin;
}

function showSettings() {
  const win = createSettingsWindow();
  win.show();
  win.focus();
  console.log(store)
  win.webContents.send('settings:load', store.store);
}

function createConfirmWindow() {
  if (confirmWin) return confirmWin;

  confirmWin = new BrowserWindow({
    width: 420,
    height: 230,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: preloadFile,
      sandbox: false
    }
  });

  // Route renderer to a confirm view (hash-based)
  if (rendererUrl) confirmWin.loadURL(rendererUrl + '#/confirm');
  else confirmWin.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'confirm' });

  confirmWin.on('closed', () => (confirmWin = null));
  return confirmWin;
}

function showConfirm(action: PowerAction, countdown: number) {
  const win = createConfirmWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  win.webContents.send('confirm:show', { action, countdown });
}

function createTray() {
  // Use your PNG/ICO if available; fallback to empty image to avoid errors
  const trayIcon = icon ? nativeImage.createFromPath(icon) : nativeImage.createEmpty();
  tray = new Tray(trayIcon);

  const updateMenu = () => {
    const enabled = store.get('enabled');
    const menu = Menu.buildFromTemplate([
      { label: 'Open Settings', click: () => showSettings() },
      { type: 'separator' },
      { label: 'Simulate Outage (test)', click: () => showConfirm(store.get('action'), 5) },
      {
        label: enabled ? 'Pause Monitoring' : 'Resume Monitoring',
        click: () => {
          store.set('enabled', !enabled);
          if (store.get('enabled')) monitor.start();
          else monitor.stop();
          updateMenu();
        }
      },
      { type: 'separator' },
      { label: 'Quit', click: () => app.exit(0) }
    ]);
    tray!.setContextMenu(menu);
  };

  tray.setToolTip('Power Guard');
  tray.on('click', () => showSettings());
  updateMenu();
}

ipcMain.handle('settings:get', () => store.store);

ipcMain.handle('settings:save', (_e, s: Partial<Settings>) => {
  const prevStart = store.get('startWithWindows');

  // Persist new settings
  store.set({ ...store.store, ...s });

  // Apply changed monitor parameters
  monitor.update({
    targetIp: store.get('targetIp'),
    failureSeconds: store.get('failureSeconds')
  });

  // Apply login-at-start toggle
  if (s.startWithWindows !== undefined && s.startWithWindows !== prevStart) {
    applyLoginItem();
  }
});

ipcMain.handle('confirm:accept', async () => {
  confirmWin?.close();
  await performAction(store.get('action'));
});

ipcMain.handle('confirm:cancel', async () => {
  confirmWin?.close();
  // Snooze monitoring for N minutes to avoid immediate retrigger
  monitor.stop();
  setTimeout(
      () => store.get('enabled') && monitor.start(),
      store.get('snoozeMinutes') * 60_000
  );
});

// Optional: UI test hook
ipcMain.handle('confirm:test', async () => {
  showConfirm(store.get('action'), 5);
});

// -----------------------------
// Single-instance & app lifecycle
// -----------------------------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('Second instance in dev — continuing without lock.');
  } else {
    app.quit();
  }
} else {
  app.on('second-instance', () => {
    showSettings();
  });

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.power.guard');

    applyLoginItem();
    createSettingsWindow(); // create (hidden) so it's ready fast
    createTray();

    // Electron Toolkit helper to optimize keyboard shortcuts
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    if (store.get('enabled')) monitor.start();
  });

  // Keep app running in tray when all windows are closed
  app.on('window-all-closed', (e) => {
    e.preventDefault();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createSettingsWindow();
  });
}
