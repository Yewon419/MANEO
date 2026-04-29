// preload.js — renderer에 안전하게 노출할 API
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('maneo', {
  // 세이브
  save: {
    load: () => ipcRenderer.invoke('save:load'),
    write: (data) => ipcRenderer.invoke('save:write', data),
    update: (patch) => ipcRenderer.invoke('save:update', patch),
  },
  // 경로
  getPath: () => ipcRenderer.invoke('app:get-path'),
  // 윈도우 조작
  window: {
    setBounds: (bounds) => ipcRenderer.invoke('window:set-bounds', bounds),
    getBounds: () => ipcRenderer.invoke('window:get-bounds'),
    setIgnoreMouse: (ignore, opts) =>
      ipcRenderer.invoke('window:set-ignore-mouse', ignore, opts),
  },
  // 디버그
  isDebug: () => ipcRenderer.invoke('debug:enabled'),
});
