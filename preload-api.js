const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('apiKeyAPI', {
  submitKey: (key) => ipcRenderer.send('api-key-submitted', key)
});
