const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const removeMarkdown = require('remove-markdown');

const ARLI_API_KEY = '6e068802-c97c-486b-9793-b5cc7114907d';
const MODEL = 'Gemma-3-27B-ArliAI-RPMax-v3';

let conversationHistory = [];
const boundsFile = path.join(app.getPath('userData'), 'window-bounds.json');

function createWindow() {
  let bounds = { width: 420, height: 680 };
  try {
    const data = fs.readFileSync(boundsFile, 'utf8');
    bounds = JSON.parse(data);
  } catch (_) {}

  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;
  const x = bounds.x !== undefined ? bounds.x : workArea.x;
  const y = bounds.y !== undefined ? bounds.y : workArea.y + workArea.height - bounds.height;

  const win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x,
    y,
    minWidth: 420,
    minHeight: 680,
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, 'Images', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');

  win.once('ready-to-show', () => {
    win.show();
    win.focus();

    // Focus text input automatically
    win.webContents.executeJavaScript(`document.getElementById('input').focus();`);
  });

  win.on('close', () => {
    fs.writeFileSync(boundsFile, JSON.stringify(win.getBounds()));
  });

  // Close window on ESC key press
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape') {
      event.preventDefault();
      win.close();
    }
  });
}

app.whenReady().then(createWindow);

ipcMain.on('close-window', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

ipcMain.handle('ask-ai', async (event, prompt) => {

  // --- Hard-coded instant Cortana responses ---
  const specialReplies = {
    "open the pod bay doors": "I'm sorry Dave; I can't do that.",
    "do you like xbox?": "Halo Is Where the Heart Is, Home is Where The Halo Is",
    "do you like bill gates?": "I Quite Literally Can't Imagine A World Without Him",
    "are you hot?": "I Am Code",
    "are you really gay?": "No... But I'm Not Straight Either",
    "how is master chief?": "You try to get that guy to open up",
    "do you like parks and recreation?": "Treat yo self!",
    "what do you think of siri?": "I'm glad we use Bing in common.",
    "do you like satya nadella?": "He's a Cricket Fan! What's Not To Like?",
    "what do you think of satya nadella?": "One Microsoft! Go Satya!"
  };

  const lower = prompt.trim().toLowerCase();
  if (specialReplies[lower]) {
    return specialReplies[lower];
  }

  // --- Streamlined system behaviour prompt ---
  const systemMessage = {
    role: 'system',
    content: `You are Microsoft’s Cortana assistant.
- Only provide instructions that directly address the user’s request.
- Ask for clarification when needed.
- Keep instructions concise and actionable.
- Avoid greetings, sign-offs, repetitions, or unnecessary elaboration.
- Use proper grammar.
- Give guidance specific to Windows 10 version 22H2 when relevant.`
  };

  conversationHistory.push({ role: 'user', content: prompt });
  const messages = [systemMessage, ...conversationHistory];

  const res = await fetch('https://api.arliai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ARLI_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
      temperature: 0.7
    })
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  let text = data.choices[0].message.content;

  text = removeMarkdown(text)
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .replace(/\r\n/g, '\n');

  conversationHistory.push({ role: 'assistant', content: text });
  return text;
});
