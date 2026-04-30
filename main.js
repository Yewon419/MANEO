// main.js — Electron 메인 프로세스
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// Windows 투명 윈도우 호환
app.disableHardwareAcceleration();

const WIDGET_SIZE = 300;
const SAVE_PATH = path.join(app.getPath('userData'), 'save.json');
const isDev = process.argv.includes('--dev');

// dev 모드: 옛 sprite 경로/스크립트 캐시 무력화
if (isDev) {
  app.commandLine.appendSwitch('disable-http-cache');
}

/** @type {BrowserWindow | null} */
let mainWindow = null;

async function createWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  const saved = loadSave();
  const x = saved?.window?.x ?? Math.round(screenW - WIDGET_SIZE - 40);
  const y = saved?.window?.y ?? Math.round(screenH - WIDGET_SIZE - 40);

  mainWindow = new BrowserWindow({
    width: WIDGET_SIZE,
    height: WIDGET_SIZE,
    x,
    y,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 'floating' — 풀스크린 앱 위에는 안 뜸
  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });

  if (isDev) {
    // 옛 sprite 경로/JS가 캐시에 박혀 새 경로 fetch를 덮는 문제 방지
    await mainWindow.webContents.session.clearCache();
  }

  mainWindow.loadFile('index.html');

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // 윈도우 이동 시 위치 저장
  mainWindow.on('moved', () => {
    const [wx, wy] = mainWindow.getPosition();
    updateSave((s) => {
      s.window = { x: wx, y: wy };
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── 세이브 파일 I/O ──

function loadSave() {
  try {
    if (fs.existsSync(SAVE_PATH)) {
      return JSON.parse(fs.readFileSync(SAVE_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('[main] save.json 읽기 실패:', e.message);
  }
  return null;
}

function writeSave(data) {
  try {
    fs.writeFileSync(SAVE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[main] save.json 쓰기 실패:', e.message);
  }
}

function updateSave(mutator) {
  const data = loadSave() || {};
  mutator(data);
  writeSave(data);
}

// ── IPC 핸들러 ──

ipcMain.handle('save:load', () => loadSave());
ipcMain.handle('save:write', (_event, data) => writeSave(data));
ipcMain.handle('save:update', (_event, patch) => {
  updateSave((s) => Object.assign(s, patch));
});

ipcMain.handle('app:get-path', () => ({
  userData: app.getPath('userData'),
  appRoot: __dirname,
}));

// 위젯 탈출 — setBounds로 위치 이동
ipcMain.handle('window:set-bounds', (_event, bounds) => {
  if (mainWindow) {
    mainWindow.setBounds(bounds);
  }
});

ipcMain.handle('window:get-bounds', () => {
  return mainWindow ? mainWindow.getBounds() : null;
});

// 클릭 관통 설정 (탈출 시 배경 투명 영역 클릭 통과)
ipcMain.handle('window:set-ignore-mouse', (_event, ignore, opts) => {
  if (mainWindow) {
    mainWindow.setIgnoreMouseEvents(ignore, opts || {});
  }
});

// 디버그 모드 (Ctrl+Shift+D)
ipcMain.handle('debug:enabled', () => isDev);

// ── 앱 라이프사이클 ──

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
