const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('apiKeyAPI', {
  submitKey: (key) => ipcRenderer.send('api-key-submitted', key)
});

// This script lets the renderer send the API key to main.js without giving it full access to Node.js.