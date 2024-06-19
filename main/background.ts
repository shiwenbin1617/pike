import path from 'path';
import { app, ipcMain, BrowserWindow } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';
import { GlobalKeyboardListener, IGlobalKeyEvent } from 'node-global-key-listener';
import sudo from 'sudo-prompt';
import { getSelected } from './hooks/useClipboard';
import { trackLeftClick, trackRightClick } from './hooks/mouseListener';

// Options for sudo-prompt
const options = {
  name: 'Electron App'
};

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

let mainWindow: BrowserWindow | null = null;

/**
 * Adjust permissions for MacKeyServer
 */
const setPermissionsForMacKeyServer = () => {
  return new Promise((resolve, reject) => {
    sudo.exec('chmod +x "' + path.join(__dirname, '../node_modules/node-global-key-listener/bin/MacKeyServer') + '"', options, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Failed to set permissions for MacKeyServer: ${stderr || error.message}`));
      } else {
        console.log('Permissions set for MacKeyServer');
        resolve(null);
      }
    });
  });
};

/**
 * Create the main window
 */
const createMainWindow = async () => {
  mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isProd) {
    await mainWindow.loadURL('app://./home');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }
};

/**
 * Set up global keyboard listener
 */
const setupGlobalKeyListener = () => {
  const gkl = new GlobalKeyboardListener();

  gkl.addListener((e, down) => {
    if (
      e.state === "DOWN" &&
      e.name === "SPACE" &&
      (down["LEFT META"] || down["RIGHT META"])
    ) {
      // Call your function here
      return true;
    }
  });

  gkl.addListener((e, down) => {
    if (
      e.state === "DOWN" &&
      e.name === "F" &&
      (down["LEFT ALT"] || down["RIGHT ALT"])
    ) {
      // Call your function here
      return true;
    }
  });

  let isShiftPressed = false;

  const shiftMListener = (e: IGlobalKeyEvent, down) => {
    const { name } = e;

    if (name === 'LEFT SHIFT' || name === 'RIGHT SHIFT') {
      isShiftPressed = down;
      return;
    }

    if (name === 'M' && isShiftPressed && down) {
      console.log("使用了键盘" + name + "键");
    }
  };

  gkl.addListener(shiftMListener);
};

/**
 * Initialize mouse tracking for left and right clicks
 */
const initializeMouseTracking = async () => {

  trackLeftClick(
      async (x, y, count) => {
        // 按下鼠标时记录位置，并设置拖动状态
        console.log('Mouse clicked at:', x, y);
      },
      async (x, y, count) => {
        console.log('Double clicked at:', x, y);
        await new Promise(resolve => setTimeout(resolve, 300));
        const selectedContent = await getSelected();
        if (selectedContent.text === '') {
          console.log('No content selected');
        } else {
          console.log('Selected Content:', selectedContent);
        }
      },
      async (x, y, count) => {
        console.log('Drag count ===', count, ' at:', x, y);
        await new Promise(resolve => setTimeout(resolve, 300));
        const selectedContent = await getSelected();
        if (selectedContent.text === '') {
          console.log('No content selected');
        } else {
          console.log('Selected Content:', selectedContent);
        }
      }
  )
}


/**
 * Initialize the application
 */
const initializeApp = async () => {
  try {
    await app.whenReady();
    await createMainWindow();
    setupGlobalKeyListener();
    await initializeMouseTracking();
  } catch (error) {
    console.error('Failed to initialize the app:', error);
    app.quit();
  }
};

// Main
await (async () => {
  try {
    await setPermissionsForMacKeyServer();
    await initializeApp();
  } catch (error) {
    console.error(error);
    app.quit();
  }
})();

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createMainWindow();
  }
});

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`);
});