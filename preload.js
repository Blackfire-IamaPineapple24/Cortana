const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  askAI: (prompt) => ipcRenderer.invoke('ask-ai', prompt)
});

/* This script lets the renderer send the user's messages to main.js and take Gemma's
   answers from main.js without giving it full access to Node.js. */