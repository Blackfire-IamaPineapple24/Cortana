const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', 
{
    SetName: (name) => ipcRenderer.send('set-name', name),
    OnLoadName: (callback) => ipcRenderer.on('name-updated', (_, name) => callback(name))
});