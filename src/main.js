// This is free and unencumbered software released into the public domain.
// See LICENSE for details

const {app, BrowserWindow, ipcMain} = require('electron');
const { IsPackaged, isPackaged } = require('electron-is-packaged');

const log = require('electron-log');
const path = require('path');

// Disable security warnings and set react app path on dev env
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;

log.info('App starting...');


const WINDOWS = {};

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
}

const createLoadingWindow = () => {

    if(WINDOWS['LOADING'] != null){ return; }

    const win = new BrowserWindow({
        width: 350,
        height: 450,
        frame: null,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(app.getAppPath(), 'src', 'windows', 'loading', 'preload.js')
        },
    });

    WINDOWS['LOADING'] = win;


    // win.webContents.openDevTools();

    win.on('closed', () => {
        WINDOWS['LOADING'] = null;
    });

    win.loadURL(path.join(app.getAppPath(), 'src', 'windows', 'loading', 'index.html'));
}

const InitializeUpdates = () => {

    // Significally boost startup time by importing for AutoUpdater after the creation of loading-screen.
    const {autoUpdater} = require("electron-updater");

    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';

    // Bypass AutoUpdater when in development enviroment
    if(!isPackaged){
        log.info('You are in development enviroment. AutoUpdate was successfully ignored');

        setTimeout(() => {  
            WINDOWS['LOADING'].close();
            createMainWindow();
            return;
        }, 200);
    }

    // Check for updates
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('checking-for-update', () => {
        log.info('Looking for updates...');
        WINDOWS['LOADING'].webContents.send('status:looking');
    });
    
    autoUpdater.on('update-available', (info) => {
        log.info('Update found...');
        log.info(info);
        WINDOWS['LOADING'].webContents.send('status:available');
    });
    
    autoUpdater.on('update-not-available', (info) => {
        log.info('No update available. Starting normally');

        setTimeout(() => { 
            WINDOWS['LOADING'].close();
            createMainWindow();
            return;
        }, 2000);

    });
    
    autoUpdater.on('error', (err) => {
        log.info('Error occured with autoUpdater');
        log.error(err);
        WINDOWS['LOADING'].webContents.send('status:error', err);
    });
    
    autoUpdater.on('download-progress', (progressObj) => {
        WINDOWS['LOADING'].webContents.send('status:process', {
            progress: progressObj.percent,
            speed: progressObj.bytesPerSecond,
            transfered: progressObj.transferred,
            total: progressObj.total
        });
    });

    autoUpdater.on('update-downloaded', (ev, info) => {
        log.info('Restarting in 2000ms...');
        log.info(info);

        WINDOWS['LOADING'].webContents.send('status:restarting');
        
        setTimeout(() => {
            autoUpdater.quitAndInstall();
        }, 2000);
    });
}

ipcMain.on('main:initialize', (event, args) => {
    const data = {
        version: app.getVersion()
    }

    event.returnValue = data;
});

ipcMain.on('loading:ready', () => {
    InitializeUpdates();
});

app.on('ready', function() {
    createLoadingWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', function()  {
    
});