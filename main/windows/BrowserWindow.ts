const { BrowserWindow, app, ipcMain, clipboard } = require("electron");
const path = require("path");

module.exports = () => {
  let win;

  /**
   * Initialize the window: if it exists and visible, close it; otherwise, create and show it.
   * @param {BrowserWindow} mainWindow - The main application window.
   * @returns {BrowserWindow|null} The created or existing win instance.
   */
  const init = (mainWindow) => {
    if (win && win.isVisible()) {
      // If the window is already visible, close it
      win.close();
    } else {
      // If the window does not exist or isn't visible, create and show it
      createWindow(mainWindow);
    }
    return win;
  };

  /**
   * Create the BrowserWindow instance.
   * @param {BrowserWindow} mainWindow - The main application window.
   */
  const createWindow = (mainWindow) => {
    win = new BrowserWindow({
      width: 250,
      height: 50,
      autoHideMenuBar: true,
      alwaysOnTop: true,
      show: false,
      webPreferences: {
        contextIsolation: true,
        webSecurity: false,
        backgroundThrottling: false,
        devTools: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'preload.js')
      }
    });

    win.loadURL(`file://${path.join(__dirname, 'index.html')}`);
    win.once('ready-to-show', () => win.show());
    win.on("closed", () => {
      win = null;
    });
  };

  /**
   * Get the current BrowserWindow instance (if exists).
   * @returns {BrowserWindow|null} The current window instance or null if it does not exist.
   */
  const getWindow = () => win;

  return {
    init,
    getWindow,
  };
};

// // Usage example
// app.on('ready', () => {
//   const windowManager = require('./path/to/your/windowManagerModule')();
//   const mainWindow = new BrowserWindow(/* your main window configs */);
//   const panelWindow = windowManager.init(mainWindow);
//
//   // Do something with the panel window.
//   console.log(panelWindow); // Should log the BrowserWindow instance.
//
//   // Example of toggling the window state
//   setTimeout(() => {
//     const toggledPanelWindow = windowManager.init(mainWindow);
//     console.log(toggledPanelWindow); // Should log the toggled BrowserWindow instance.
//   }, 5000); // Toggle the window state after 5 seconds
// });