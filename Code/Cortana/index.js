// Importing modules
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Function to instantiate main window
const createMainWindow = () =>
{
    const win = new BrowserWindow
    ({
        devTools: false,
        minWidth: 400,
        minHeight: 750,
        maximizable: false,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'Resources/Images/', 'icon.png'),
        title: "Cortana",
    });

    win.loadFile('index.html');
}

app.whenReady().then(() =>
{
    createMainWindow();
});