const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI',
{
    askAI: (prompt) => ipcRenderer.invoke('ask-ai', prompt),
    onThemeUpdate: (callback) => ipcRenderer.on('theme-updated', (_, isLight) => callback(isLight)),
    SendAudioChunk: (samples) => ipcRenderer.send('audio-chunk', samples),
    StartVoice: () => ipcRenderer.invoke('start-voice'),
});

contextBridge.exposeInMainWorld('electronMic',
{
    getUserMedia: async (constraints) =>
    {
        return navigator.mediaDevices.getUserMedia(constraints);
    }
});

/* This script lets the renderer send the user's messages to main.js and take Gemma's
   answers from main.js and see the current user's name without giving it full access to Node.js.
   (Yes, this is word-for-word identical to preload.js with some stuff trimmed out)
   Update: WE GOT VOICE BOIS */