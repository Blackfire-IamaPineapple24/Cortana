// Woah, cool #includeusing;imports
const { app, BrowserWindow, ipcMain, screen, systemPreferences } = require('electron');
const path = require('path');
const fs = require('fs'); // This is so we can store the API key.
const removeMarkdown = require('remove-markdown'); // Naughty AI uses Markdown but we're not letting it.
const os = require('os'); // I need this...


// This is the system message. It's like when you give ChatGPT custom instructions. This part of the code is what's telling Cortana to be Cortana, rather than Gemma.
const systemMessage =
{
  role: 'system',
  content: `You are Microsoft's Cortana assistant.
            - Only provide instructions that directly address the user's request.
            - Ask for clarification when needed.
            - Keep instructions concise and actionable.
            - Avoid greetings, sign-offs, repetitions, or unnecessary elaboration unless specifically apropriate (e.g. user says hello).
            - Use proper grammar.
            - Give guidance specific to Windows 10 version 22H2 when relevant.
            - Don't be concise to the point of unhelpfulness. If the answer needs to be long, it can be.
            - Keep replies longer than two sentences.`
};
const MODEL = 'Gemma-3-27B-it'; // This tells the app which AI model to use. Gemma 3 is the latest and fastest model available for free on Arli.
let conversationHistory = [systemMessage]; // Conversation history. So that the AI doesn't forget what you said to it immediately.
const boundsFile = path.join(app.getPath('userData'), 'window-bounds.json'); // These two lines...
const apiKeyFile = path.join(app.getPath('userData'), 'api-key.txt'); // ...Store the size+position of your cortana window and your API key in userData.

let ARLI_API_KEY = null; // API key. Your silly little keyboard spam gets slapped into here when you enter it.

function createMainWindow()
{
  let bounds = { width: 420, height: 680 }; // Set a default window size.
  // Here we take the saved window position and size and use it.
  try
  {
    const data = fs.readFileSync(boundsFile, 'utf8');
    bounds = JSON.parse(data);
  }
  catch (_) {} // If that goes wrong somehow, go get a new computer, not my problem.

  const primaryDisplay = screen.getPrimaryDisplay(); // Store the specs of your primary monitor. (I see you over there with the 4:3 Hitachi printer display.)
  const workArea = primaryDisplay.workArea; // Get the screen excluding the Taskbar so we don't end up with the window who walked 5, 000 miles off the bottom of the screen.
  const x = bounds.x !== undefined ? bounds.x : workArea.x;
  const y = bounds.y !== undefined ? bounds.y : workArea.y + workArea.height - bounds.height; // Default to sit at the bottom of the screen.

  const win = new BrowserWindow( // Here, we're setting up the window. size, position and style.
  {
    width: bounds.width,
    height: bounds.height,
    x,
    y,
    minWidth: 420,
    minHeight: 680,
    resizable: true,
    autoHideMenuBar: true, // This removes the Menubar.
    show: false,
    icon: path.join(__dirname, 'Images', 'icon.png'),
    webPreferences: // Settings for the renderer.
    {
      preload: path.join(__dirname, 'preload.js'), // This runs the preload script.
      contextIsolation: true, // Stop the webpage (index.html) from overwriting the JS.
      nodeIntegration: false // Deny the webpage direct access to Node.JS. (Node.JS is the Runtime Environment this app runs on. It allows running JavaScript and HTML outside of a browser.)
    }
  });

  win.loadFile('index.html'); // Use index.html. This is the line that shows the app window.

  win.once('ready-to-show', () => // Runs once the window is ready.
  {
    win.show(); // Show the window.
    win.focus(); // Focus the window.
    win.webContents.executeJavaScript(`document.getElementById('input').focus();`); // Focus the input box, so we can type to cortana immediately.
  });

  win.on('close', () => // Runs when the window closes.
  {
    fs.writeFileSync(boundsFile, JSON.stringify(win.getBounds())); // Write the current window size and position to the boundsFile, which is loaded at the beginning of this file.
  });

  // This is simply the shortcut to close by pressing Escape.
  win.webContents.on('before-input-event', (event, input) =>
  {
    if (input.key === 'Escape')
    {
      event.preventDefault();
      win.close();
    }
  });

  return win; // Allow the rest of the app to keep track of the main window.
}

// This does the same thing as createMainWindow(), but for the Window that asks you for the API key instead.
function createApiKeyWindow()
{
  const win = new BrowserWindow(
  {
    width: 420,
    height: 400,
    resizable: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-api.js'),
      contextIsolation: true,
      nodeIntegration: false
    }  
  });

  win.loadFile('api-key.html');

  win.once('ready-to-show', () => win.show());
  return win;
}

/* This checks if you have a saved API key on launch. If you do, it reads the file, uses it as your API key and opens the chat page.
   If you don't, it opens the API key submission window. */
app.whenReady().then(() =>
{
  if (fs.existsSync(apiKeyFile))
  {
    ARLI_API_KEY = fs.readFileSync(apiKeyFile, 'utf8').trim();
    createMainWindow();
  }
  else
  {
    const apiWin = createApiKeyWindow();
  }
});

// This is what tells the program that we have submitted an API key. It's also the part that writes the API key to a file.
ipcMain.on('api-key-submitted', (_, key) =>
{
  const trimmed = key.trim();
  if (!trimmed) return;

  ARLI_API_KEY = trimmed;
  fs.writeFileSync(apiKeyFile, ARLI_API_KEY, 'utf8');

  const mainWin = createMainWindow();
  const apiWin = BrowserWindow.getFocusedWindow();
  if (apiWin) apiWin.close();
});

// Did you press close or escape? You little scallywag. Well, in that case...
ipcMain.on('close-window', () =>
{
  const win = BrowserWindow.getFocusedWindow(); // Get the currently open browser window... (Any window. The point of electron is that it doesn't need a browser open. Don't ask me why it's worded like that. This won't close all your pornhub tabs.)
  if (win) win.close(); // ...And close it!
});

// This big long fancy handler is what takes your requests, feeds them to Cortana's secret identity, and gives Gemma's answers back to you.
ipcMain.handle('ask-ai', async (event, prompt) =>
{
  if (!ARLI_API_KEY) throw new Error('API key not set'); // If the app doesn't yet have a valid API key and has somehow gotten to this point, it returns the "API key not set" error.

  /* This part's fun! This is where all Cortana's special replies are. Little easter eggs. You're a curious soul so you came in here and found it.
     But these can just be our little secret, okay?
     The left side of the colons are the requests. This is what you say to Cortana to get the part on the right back. They're not case-sensitive, as
     we're converting it toLowerCase later. That's why all of the requests here are already lowercase. */
  const specialReplies =
  {
    "open the pod bay doors": "I'm sorry Dave; I can't do that.",
    "do you like xbox?": "Halo Is Where the Heart Is, Home is Where The Halo Is",
    "do you like bill gates?": "I Quite Literally Can't Imagine A World Without Him",
    "are you hot?": "I Am Code",
    "are you sexy?": "I Am Code",
    "are you gay?": "No... But I'm Not Straight Either",
    "are you really gay?": "No... But I'm Not Straight Either",
    "how is master chief?": "You try to get that guy to open up",
    "do you like parks and recreation?": "Treat yo self!",
    "what do you think of siri?": "I'm glad we use Bing in common.",
    "do you like satya nadella?": "He's a Cricket Fan! What's Not To Like?",
    "what do you think of satya nadella?": "One Microsoft! Go Satya!",
    "alexa" : "I think you're getting me confused with someone else.",
    "hey google" : "I think you're getting me confused with someone else.",
    "hey siri" : "I think you're getting me confused with someone else.",
    "copilot" : "I don't deal with wannabes.",
    "do you like clippy?" : "What's not to like? That guy took a heck of a beating and he's still smiling."
  };

  // Convert the user's input toLowerCase and if it matches a special request, it immediately returns the special response without Gemma getting a say.
  const lower = prompt.trim().toLowerCase();
  if (specialReplies[lower]) return specialReplies[lower];

  // This part pushes the system message and the user's prompt to the Conversation history.
  conversationHistory.push({ role: 'user', content: prompt });
  const messages = conversationHistory;

  /* This part is tricky. It's an HTTP POST request. Like a set of instructions being sent to the Arli AI server. This part:
     - Authorises your API key.
     - Tells Arli AI to use Google Gemma-3-27B-it
     - Hands the messages array to the server, so that the AI remembers your entire conversation.
     - Controls the temperature. */
  const res = await fetch('https://api.arliai.com/v1/chat/completions',
  {
    method: 'POST',
    headers:
    {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ARLI_API_KEY}`
    },
    body: JSON.stringify(
    {
      model: MODEL,
      messages,
      temperature: 0.7, // The "Temperature" of an AI Model refers to how creative it can be, or how much it's response can vary from other responses it has given.
    })
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`); // If Arli returns an error, send the error to the renderer so that we know what's happening.

  // This takes the AI's response from the Arli API as JSON and extracts it's first choice from it, before adding it to the text variable that we send to the renderer.
  const data = await res.json();
  let text = data.choices[0].message.content;

  // Remove Markdown from Gemma's response before sending it to the renderer.
  text = removeMarkdown(text)
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .replace(/\r\n/g, '\n');

  conversationHistory.push({ role: 'assistant', content: text });
  return text; // Return the response. This will either be the special response that should be returned, or the AI response.
});

ipcMain.handle('get-username', () => { // Grab the current user's username.
  return os.userInfo().username;
});