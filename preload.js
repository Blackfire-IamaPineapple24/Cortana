const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  askAI: (prompt) => ipcRenderer.invoke('ask-ai', prompt)
});
