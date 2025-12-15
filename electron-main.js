const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const server = require('./server');

let mainWindow;
let tray;
let isQuitting = false;

// Express server instance (from server.js)
const PORT = process.env.PORT || 3000;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'public/Logo.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false
        },
        title: 'Advanced SMTP Tester',
        backgroundColor: '#0f172a',
        show: false // Don't show until ready
    });

    // Load the app
    mainWindow.loadURL(`http://localhost:${PORT}`);

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Handle window close
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            return false;
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Create application menu
    createMenu();
}

function createTray() {
    tray = new Tray(path.join(__dirname, 'public/Logo.png'));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                mainWindow.show();
            }
        },
        {
            label: 'Hide App',
            click: () => {
                mainWindow.hide();
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Advanced SMTP Tester');
    tray.setContextMenu(contextMenu);

    // Double click to show/hide
    tray.on('double-click', () => {
        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
        }
    });
}

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Minimize to Tray',
                    accelerator: 'CmdOrCtrl+H',
                    click: () => {
                        mainWindow.hide();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        isQuitting = true;
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: async () => {
                        const { shell } = require('electron');
                        await shell.openExternal('https://github.com/DeNNiiInc/Advanced-Smtp-Tester');
                    }
                },
                {
                    label: 'Documentation',
                    click: async () => {
                        const { shell } = require('electron');
                        await shell.openExternal('https://github.com/DeNNiiInc/Advanced-Smtp-Tester#readme');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Wait for server to be ready before creating window
function waitForServer(callback) {
    const http = require('http');
    const checkServer = () => {
        http.get(`http://localhost:${PORT}`, (res) => {
            callback();
        }).on('error', () => {
            setTimeout(checkServer, 100);
        });
    };
    checkServer();
}

// App lifecycle
app.whenReady().then(() => {
    // Server is already started by requiring ./server.js
    // Wait for it to be ready
    waitForServer(() => {
        createWindow();
        createTray();
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });
});

app.on('window-all-closed', () => {
    // Don't quit on window close, keep running in tray
    // User must explicitly quit from tray menu
});

app.on('before-quit', () => {
    isQuitting = true;
});

// Handle app quit
app.on('will-quit', () => {
    // Cleanup if needed
});
