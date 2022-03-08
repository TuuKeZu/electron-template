// This is free and unencumbered software released into the public domain.
// See LICENSE for details

const {app, BrowserWindow, ipcMain} = require('electron');
const log = require('electron-log');
const {autoUpdater} = require("electron-updater");
const path = require('path');

// Disable security warnings and set react app path on dev env
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;

//-------------------------------------------------------------------
// Logging
//
// THIS SECTION IS NOT REQUIRED
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

//-------------------------------------------------------------------
// Open a window that displays the version
//
// THIS SECTION IS NOT REQUIRED
//
// This isn't required for auto-updates to work, but it's easier
// for the app to show a window than to have to click "About" to see
// that updates are working.
//-------------------------------------------------------------------

const WINDOWS = {};

function sendStatusToWindow(text) {
    log.info(text);
    win.webContents.send('message', text);
}

const createMainWindow = () => {

    if(WINDOWS['MAIN'] != null){ return; }

    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(app.getAppPath(), 'src', 'windows', 'main', 'preload.js')
        },
    });

    WINDOWS['MAIN'] = win;


    win.webContents.openDevTools();

    win.on('closed', () => {
        WINDOWS['MAIN'] = null;
    });

    win.loadURL(path.join(app.getAppPath(), 'src', 'windows', 'main', 'index.html'));

    // win.webContents.send('version', app.getVersion());
    // sendStatusToWindow('Initalized Message Port!');
}

ipcMain.on('main:initialize', (event, args) => {
    const data = {
        version: app.getVersion()
    }

    event.returnValue = data;
});

autoUpdater.on('checking-for-update', () => {
    log.info('Looking for updates...');
    sendStatusToWindow('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
    log.info('Update found...');
    log.info('info');
    sendStatusToWindow('Update available.');
});

autoUpdater.on('update-not-available', (info) => {
    log.info(info);
    sendStatusToWindow('Update not available.');
});

autoUpdater.on('error', (err) => {
    log.error(err);
    sendStatusToWindow('Error in auto-updater. ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    log.info(log_message);
    sendStatusToWindow(log_message);
});


autoUpdater.on('update-downloaded', (ev, info) => {
  // Wait 5 seconds, then quit and install
  // In your application, you don't need to wait 5 seconds.
  // You could call autoUpdater.quitAndInstall(); immediately
  // sendStatusToWindow('Update downloaded');

  log.info('Restarting...');

  autoUpdater.quitAndInstall();  
});

app.on('ready', function() {
    // Create the Menu
    createMainWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

//
// CHOOSE one of the following options for Auto updates
//

//-------------------------------------------------------------------
// Auto updates - Option 1 - Simplest version
//
// This will immediately download an update, then install when the
// app quits.
//-------------------------------------------------------------------
app.on('ready', function()  {
  autoUpdater.checkForUpdatesAndNotify();
});

//-------------------------------------------------------------------
// Auto updates - Option 2 - More control
//
// For details about these events, see the Wiki:
// https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
//
// The app doesn't need to listen to any events except `update-downloaded`
//
// Uncomment any of the below events to listen for them.  Also,
// look in the previous section to see them being used.
//-------------------------------------------------------------------
// app.on('ready', function()  {
//   autoUpdater.checkForUpdates();
// });
// autoUpdater.on('checking-for-update', () => {
// })
// autoUpdater.on('update-available', (info) => {
// })
// autoUpdater.on('update-not-available', (info) => {
// })
// autoUpdater.on('error', (err) => {
// })
// autoUpdater.on('download-progress', (progressObj) => {
// })
// autoUpdater.on('update-downloaded', (info) => {
//   autoUpdater.quitAndInstall();
// })
