const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('apiKeyAPI', {
  submitKey: (key) => ipcRenderer.send('api-key-submitted', key),
  onThemeUpdate: (callback) => ipcRenderer.on('theme-updated', (_, isLight) => callback(isLight)),
  submitLocation: (location) => ipcRenderer.send('location-submitted', location),
});

// This script lets the renderer send the API key to main.js without giving it full access to Node.js.