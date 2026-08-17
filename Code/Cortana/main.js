// Importing modules
const { app, BrowserWindow, shell, screen, ipcMain } = require('electron');
const path = require('path'); // For manipulating file paths.
const fs = require('fs'); // Filesystem access

// -- VARIABLES ---------------------------------
const appData = app.getPath('userData'); // Makes the other file management stuff easier
const windowStateFile = path.join(appData, 'window-state.json');
const nameFile = path.join(appData, 'user-name.txt');
// ----------------------------------------------

// Function to instantiate main window
function CreateMainWindow()
{
    let windowState = // Default window size
    {
        width: 400,
        height: 750
    };

    try
    {
        const windowStateData = fs.readFileSync(windowStateFile, 'utf8'); // Load the saved window position
        windowState = JSON.parse(windowStateData); // Use it
    }
    catch (_) {} // Basically, ignore it if the file doesn't exist.

    const primaryDisplay = screen.getPrimaryDisplay();
    const workArea = primaryDisplay.workArea; // Work area is the screen, excluding the taskbar.
    const x = windowState.x ?? workArea.x; // Only set x/y to the saved values if the saved values exist
    const y = windowState.y ?? workArea.y + workArea.height - windowState.height; // 2nd part of this line makes the window default to opening in the bottom left of the work area
    // Note to self: ?? checks if the left value is undefined and if it is, uses the right value instead.

    const win = new BrowserWindow
    ({
        backgroundColor: '#000000',
        minWidth: 400,
        minHeight: 750,
        x: x,
        y: y,
        width: windowState.width,
        height: windowState.height,
        maximizable: false,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'Resources/Images/icon.png'),
        title: "Cortana",
        alwaysOnTop: true, // I have genuinely no clue why the old version had this line separate from the win declaration
        // contextIsolation: true,
        // nodeIntegration: false,
        webPreferences: {
            preload: path.join(__dirname, 'Resources/Scripts/preload-index.js'),
            spellcheck: false,
            devTools: !app.isPackaged, // Chrome devtools are only enabled outwith the packaged app
        },
    });

    win.loadFile('index.html');

    /* This exists to stop in-app links like the GitHub link in settings
       from opening IN the app. I'm not gonna ask why _self is still the
       default target for links in electron, nor why electron doesn't make
       this any easier to do. */
    win.webContents.setWindowOpenHandler(({url}) =>
    {
        shell.openExternal(url);
        return {action: 'deny'};
    });

    win.once('ready-to-show', () => // This runs once when the window is ready
    {
        win.show();
        win.focus();
        try // Again, ignore it if the file doesn't exist - this only happens on first launch or ig the file is deleted
        {
            win.webContents.send('name-updated', fs.readFileSync(nameFile).toString()); // Load username
        }
        catch (_) {}
    });

    // Save window size and position on close.
    win.on('close', () =>
    {
        fs.writeFileSync(windowStateFile, JSON.stringify(win.getBounds()));
    });
}

app.whenReady().then(() =>
{
    CreateMainWindow();
});

// IPC Listeners
ipcMain.on('set-name', (event, name) =>
{
   fs.writeFileSync(nameFile, name); // Save the user name to a file
});