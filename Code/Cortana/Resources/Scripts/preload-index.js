const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', 
{
    SetName: (name) => ipcRenderer.send('set-name', name),
    OnLoadName: (callback) => ipcRenderer.on('name-updated', (_, name) => callback(name)),

    SetColour: (colourMode) => ipcRenderer.send('set-colour', colourMode),
    OnLoadColour: (callback) => ipcRenderer.on('colour-updated', (_, colourMode, rawText) => callback(colourMode, rawText)),
    GetTheme: () => ipcRenderer.invoke('getTheme'),
    OnSystemThemeUpdate: (callback) => ipcRenderer.on('system-theme-update', (_, isDark) => callback(isDark))
});