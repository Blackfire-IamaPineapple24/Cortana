const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('win11API',
{
    acknowledge: () => ipcRenderer.send('win11-acknowledged'),
    onThemeUpdate: (callback) => ipcRenderer.on('theme-updated', (_, isLight) => callback(isLight))
});