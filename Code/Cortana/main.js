// Importing modules
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// Function to instantiate main window
function createMainWindow()
{
    const win = new BrowserWindow
    ({
        backgroundColor: '#000000',
        devTools: false,
        minWidth: 400,
        minHeight: 750,
        maximizable: false,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'Resources/Images/', 'icon.png'),
        title: "Cortana",
    });

    /* This exists to stop in-app links like the GitHub link in settings
       from opening IN the app. I'm not gonna ask why _self is still the
       default target for links in electron, nor why electron doesn't make
       this any easier to do. */
    win.webContents.setWindowOpenHandler(({url}) =>
    {
        shell.openExternal(url);
        return {action: 'deny'};
    });

    win.loadFile('index.html');
}

app.whenReady().then(() =>
{
    createMainWindow();
});