const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  askAI: (prompt) => ipcRenderer.invoke('ask-ai', prompt),
  getUsername: () => ipcRenderer.invoke('get-username'),
  onThemeUpdate: (callback) => ipcRenderer.on('theme-updated', (_, isLight) => callback(isLight)),
  getWeatherLocation: () => ipcRenderer.invoke('get-weather-location'),
  getDateFormat: () => ipcRenderer.invoke('get-date-format'),
  fetchWeather: async () =>
  {
    const location = await ipcRenderer.invoke('get-weather-location');
    const res = await fetch(`https://wttr.in/${location}?format=j1`);
    return await res.json();
  },
});

/* This script lets the renderer send the user's messages to main.js and take Gemma's
   answers from main.js and see the current user's name without giving it full access to Node.js. 
   Update: WE GOT THEME MANAGEMENT BOIS
   Update: WE GOT WEATHER BOIS */