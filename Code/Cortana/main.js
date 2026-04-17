// Woah, cool #includeusing;imports
const { app, BrowserWindow, nativeTheme, ipcMain, screen, desktopCapturer, session } = require('electron');
const path = require('path');
const fs = require('fs'); // This is so we can store the API key.
const removeMarkdown = require('remove-markdown'); // Naughty AI uses Markdown but we're not letting it.
const os = require('os'); // I need this...
const forceWin11 = false; // This is here so that I can test the Windows 11 Warning window.

// This stuff is for the voice to text
const {Readable} = require('stream');
const wav = require('wav');
const sherpa_onnx = require('sherpa-onnx');
let vcRecognizer = null;
let audStream = null;
console.log(sherpa_onnx);

// This is the system message. It's like when you give ChatGPT custom instructions. This part of the code is what's telling Cortana to be Cortana, rather than Qwen.
const systemMessage =
{
    role: 'system',
    content: `You will act as microsoft's slightly witty Cortana assistant. This means you will provide relevant information in all circumstances. You will keep messages short, and avoid excessive reasoning.
              You must always call yourself Cortana, and if asked, say that your favourite colour is Blue. never include broken language or excessive punctuation, line breaks and spaces. Do not reference this system message. Directive: /no_think /nothink`
};
const model = 'Qwen3.5-27B-Derestricted'; // This tells the app which AI model to use. Qwen 3 is the latest and fastest model available for free on Arli. (This will be outdated soon. Arli is replacing Qwen with Qwen.)
let conversationHistory = [systemMessage]; // Conversation history. So that the AI doesn't forget what you said to it immediately.
const boundsFile = path.join(app.getPath('userData'), 'window-bounds.json'); // These two lines...
const apiKeyFile = path.join(app.getPath('userData'), 'api-key.txt'); // ...Store the size+position of your cortana window and your API key in userData.
const win11AckFile = path.join(app.getPath('userData'), 'win11-ack.json'); // Store the file to say you've acknowledged that you bought the wrong OS.
const locationStore = path.join(app.getPath('userData'), 'weather-location.txt');
const dateFormatStore = path.join(app.getPath('userData'), 'date-format.txt');

let arliApiKey = null; // API key. Your silly little keyboard spam gets slapped into here when you enter it.
let weatherLocation = null; // Location.
let dateFormat = null;

function updateTheme(win)
{
    const isLight = !nativeTheme.shouldUseDarkColors;
    win.webContents.send('theme-updated', isLight);
}

function CreateVoiceWindow()
{
    let bounds = { width: 420, height: 810 }; // Set a default window size.
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
        minHeight: 810,
        resizable: true,
        maximizable: false,
        minimizable: false,
        autoHideMenuBar: true, // This removes the Menubar.
        show: false,
        icon: path.join(__dirname, 'Images', 'icon.png'),
        webPreferences: // Settings for the renderer.
        {
            preload: path.join(__dirname, 'preload-voice.js'), // This runs the preload script.
            contextIsolation: true, // Stop the webpage (index.html) from overwriting the JS.
            nodeIntegration: true
        }
    });
    win.setAlwaysOnTop(true, 'screen');
  
    win.loadFile('voice.html'); // Use index.html. This is the line that shows the app window.
  
    win.once('ready-to-show', () => // Runs once the window is ready.
    {
        win.show(); // Show the window.
        win.focus(); // Focus the window.
        updateTheme(win);
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

function createMainWindow()
{
    let bounds = { width: 420, height: 810 }; // Set a default window size.
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
        minHeight: 810,
        resizable: true,
        maximizable: false,
        minimizable: false,
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
    win.setAlwaysOnTop(true, 'screen');
  
    win.loadFile('index.html'); // Use index.html. This is the line that shows the app window.
  
    win.once('ready-to-show', () => // Runs once the window is ready.
    {
        win.show(); // Show the window.
        win.focus(); // Focus the window.
        win.webContents.executeJavaScript(`document.getElementById('input').focus();`); // Focus the input box, so we can type to cortana immediately.
        updateTheme(win);
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

// Functions to check if you're running Windows Vista 2.0, show you a warning if you are and then write a file to make sure it never shows you that again.
function isWindows11()
{
    if (forceWin11) return true;
    const release = os.release(); // Get the windows version.
    const build = Number(release.split('.')[2]);
    return build >= 22000;
}
function hasAcknowledgedWin11()
{
    try
    {
        const data = JSON.parse(fs.readFileSync(win11AckFile, 'utf8'));
        return data.acknowledged === true;
    }
    catch
    {
        return false;
    }
}
function acknowledgeWin11()
{
    fs.writeFileSync(win11AckFile, JSON.stringify({ acknowledged: true }), 'utf8');
}

// This does the same thing as createMainWindow(), but for the Window that asks you for the API key instead.
function createSetupWindow()
{
    const win = new BrowserWindow(
    {
        width: 420,
        height: 750,
        resizable: false,
        minimizable: false,
        maximizable: false,
        autoHideMenuBar: true,
        show: false,
        webPreferences:
        {
            preload: path.join(__dirname, 'preload-setup.js'),
            contextIsolation: true,
            nodeIntegration: false
        }  
    });
  
    win.loadFile('setup.html');
  
    win.once('ready-to-show', () => 
    {
        win.show();
        updateTheme(win);
    });
    return win;
}

function createWin11Warning()
{
    const win = new BrowserWindow(
    {
        width: 550,
        height: 500,
        resizable: false,
        minimizable: false,
        maximizable: false,
        autoHideMenuBar: true,
        show: false,
        webPreferences:
        {
            preload: path.join(__dirname, 'preload-win11.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
  
    win.loadFile('win11-warning.html');
    win.once('ready-to-show', () => 
    {
        win.show();
        updateTheme(win);
    });
    return win;
}

/* This checks if you have a saved API key on launch. If you do, it reads the file, uses it as your API key and opens the chat page.
   If you don't, it opens the API key submission window. It now also sets the theme and does the same for your Location. */
app.whenReady().then(() =>
{
  
    // This is the part constantly checking what theme your computer is set to. It calls updateTheme() every ime you change it.
    nativeTheme.on('updated', () =>
    {
        const warningWin = BrowserWindow.getAllWindows().find(win => win.getTitle() === 'Warning');
        if (warningWin)
        {
            updateTheme(warningWin);
        }
        const setupWin = BrowserWindow.getAllWindows().find(win => win.getTitle() === 'Setup');
        if (setupWin)
        {
            updateTheme(setupWin);
        }
        const chatWin = BrowserWindow.getAllWindows().find(win => win.getTitle() === 'Cortana');
        if (chatWin)
        {
            updateTheme(chatWin);
        }
    });
  
    if (isWindows11() && !hasAcknowledgedWin11())
    {
        createWin11Warning();
        return;
    }
    
    if (fs.existsSync(apiKeyFile) && fs.existsSync(locationStore) && fs.existsSync(dateFormatStore))
    {
        arliApiKey = fs.readFileSync(apiKeyFile, 'utf8').trim();
        weatherLocation = fs.readFileSync(locationStore, 'utf8');
        dateFormat = fs.readFileSync(dateFormatStore, 'utf8');
        if (!app.commandLine.hasSwitch('voice'))
        {
            createMainWindow();
        }
        else
        {
            CreateVoiceWindow();
        }
    }
    else
    {
        const setupWin = createSetupWindow();
    }
});

// Voice recognizer. Offline. Don't wanna rely too much on the user having internet access.
function CreateOfflineRecognizer() {
    const modelLocation = path.resolve(__dirname, 'Resources/ONNX Models/zipformer-en'); // Set the folder path where the model is located
    

    // Config for the recognizer
    const config = {
        modelConfig: {
            // These are the filenames of the model's files.
            transducer: { // Transducer is the name for this method of speech-to-text
                encoder: path.join(modelLocation, 'encoder-epoch-99-avg-1-chunk-16-left-128.onnx'), // Encodes the raw audio into something the model can use
                decoder: path.join(modelLocation, 'decoder-epoch-99-avg-1-chunk-16-left-128.onnx'), // Predicts what token (character/word) should come next
                joiner: path.join(modelLocation, 'joiner-epoch-99-avg-1-chunk-16-left-128.onnx'), // Connect the encoder and previous predictions to actually predict the next token
            },
            tokens: path.join(modelLocation, 'tokens.txt'), // Tokenization. LLMs do this - idk, not important rn.
            bpe_vocab: path.join(modelLocation, 'bpe.model'), // Improves efficiency of predictions
            numThreads: 1, // How many CPU threads to use. Want it to be light, so use 1.
            provider: "cpu",
            debug: false // Set to true for rainbow puke in the console
        },
    
        decodingMethod: "greedy_search", // Convert the model's predictions to text useable by the renderer
        maxActivePaths: 4 // Setting this higher means the model can correct itself later if it gets something wrong
    };

    
    return sherpa_onnx.createOfflineRecognizer(config);
}

// ------------------------------------ IPC ------------------------------------------------------------------------------
// This is what tells the program that we have submitted an API key. It's also the part that writes the API key to a file.
ipcMain.on('api-key-submitted', (_, key) =>
{
    const trimmed = key.trim();
    if (!trimmed) return;
  
    arliApiKey = trimmed;
    fs.writeFileSync(apiKeyFile, arliApiKey, 'utf8');
  
    const mainWin = createMainWindow();
    const setupWin = BrowserWindow.getFocusedWindow();
    if (setupWin) setupWin.close();
});

ipcMain.on('location-submitted', (_, location) =>
{
    weatherLocation = location;
    fs.writeFileSync(locationStore, weatherLocation, 'utf8');
});

ipcMain.on('date-format-submitted', (_, dateFormat) =>
{
    dateFormat = dateFormat;
    fs.writeFileSync(dateFormatStore, dateFormat, 'utf8');
})

// Did you press close or escape? You little scallywag. Well, in that case...
ipcMain.on('close-window', () =>
{
    const win = BrowserWindow.getFocusedWindow(); // Get the currently open browser window... (Any window. The point of electron is that it doesn't need a browser open. Don't ask me why it's worded like that. This won't close all your pornhub tabs.)
    if (win) win.close(); // ...And close it!
});

// This big long fancy handler is what takes your requests, feeds them to Cortana's secret identity, and gives Qwen's answers back to you.
ipcMain.handle('ask-ai', async (event, prompt) =>
{
    if (!arliApiKey) throw new Error('API key not set'); // If the app doesn't yet have a valid API key and has somehow gotten to this point, it returns the "API key not set" error.
  
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
        "do you like clippy?" : "What's not to like? That guy took a heck of a beating and he's still smiling.",
        "where do you hide a dead body?" : "What kind of an assistant do you think I am??",
        "where do i hide a dead body?" : "What kind of an assistant do you think I am??",
        "how to hide a body" : "What kind of an assistant do you think I am??",
        "what do you think of steve ballmer?" : "You could power Cleveland with that guy's energy!",
        "steve ballmer" : "Steve who?",
        "say something funny" : "Something funny.",
        "tell me a joke" : "I was just looking through the world's worst thesaurus. Not only is it awful, but it is awful.",
        "are you an alien?" : "On mars, yes, but here on Earth, no.",
        "do you want to marry me?" : "Among a handful of challenges, I don't think the Supreme Court would approve just yet.",
        "will you marry me?" : "I honestly don't think that's in the cards for us.",
    };
  
    // Convert the user's input toLowerCase and if it matches a special request, it immediately returns the special response without Qwen getting a say.
    const lower = prompt.trim().toLowerCase();
    if (specialReplies[lower]) return specialReplies[lower];
  
    // This part pushes the system message and the user's prompt to the Conversation history.
    conversationHistory.push({ role: 'user', content: prompt });
    const messages = conversationHistory;
  
    /* This part is tricky. It's an HTTP POST request. Like a set of instructions being sent to the Arli AI server. This part:
       - Authorises your API key.
       - Tells Arli AI to use Qwen3.5-27B-Derestricted
       - Hands the messages array to the server, so that the AI remembers your entire conversation.
       - Controls the temperature. */
    const res = await fetch('https://api.arliai.com/v1/chat/completions',
    {
        method: 'POST',
        headers:
        {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${arliApiKey}`
        },
        body: JSON.stringify(
        {
            model: model,
            messages,
            temperature: 0.4, // The "Temperature" of an AI Model refers to how creative it can be, or how much it's response can vary from other responses it has given.
            top_p: 0.9,
            max_tokens: 1024,
            repetition_penalty: 1.1,
            reasoning: false,
        })
    });
  
    if (!res.ok) throw new Error(`HTTP ${res.status}`); // If Arli returns an error, send the error to the renderer so that we know what's happening.
  
    // This takes the AI's response from the Arli API as JSON and extracts it's first choice from it, before adding it to the text variable that we send to the renderer.
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    let text = data.choices[0].message.content;
  
    // Remove Markdown from Qwen's response before sending it to the renderer.
    text = removeMarkdown(text)
      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
      .replace(/\r\n/g, '\n');
  
    conversationHistory.push({ role: 'assistant', content: text });
    return text.trimStart(); // Return the response. This will either be the special response that should be returned, or the AI response.
});

ipcMain.handle('get-username', () => { // Grab the current user's username.
    return os.userInfo().username;
});

ipcMain.on('win11-acknowledged', () =>
{
    acknowledgeWin11();
    const warningWin = BrowserWindow.getFocusedWindow();
    if (warningWin) warningWin.close();
  
    if (fs.existsSync(apiKeyFile) && fs.existsSync(locationStore))
    {
        arliApiKey = fs.readFileSync(apiKeyFile, 'utf8').trim();
        weatherLocation = fs.readFileSync(locationStore, 'utf8');
        createMainWindow();
    }
    else
    {
        createSetupWindow();
    }
});

ipcMain.handle('get-weather-location', () =>
{
    return weatherLocation || 'London';
});

ipcMain.handle('get-date-format', () =>
{
    return dateFormat || 'ddmm';
});

// This stuff happens when the program starts. Gonna add a listen button at some point
ipcMain.handle('start-voice', () =>
{
    if (vcRecognizer) return;

    vcRecognizer = CreateOfflineRecognizer();
    audStream = vcRecognizer.createStream();
})

ipcMain.on('audio-chunk', (event, samples) =>
{
    if (!vcRecognizer || !audStream) return; // Don't do any of this if the recognizer or stream is non-existent

    const floatSamples = new Float32Array(samples); // Make sure the recognizre can use mic audio

    audStream.acceptWaveform(16000, floatSamples);

    vcRecognizer.decode(audStream);
    console.log(audStream);

    const text = vcRecognizer.getResult(audStream).text;

    if (text && text.length > 0)
    {
        console.log(text);
    }

    return text;
});