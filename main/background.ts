import path from 'path';
import { app, ipcMain, BrowserWindow, globalShortcut, screen } from 'electron';
import serve from 'electron-serve';
import sudo from 'sudo-prompt';

// 导入自定义模块和函数
import { createWindow } from './helpers';
import { getSelected } from './hooks/useClipboard';
import { trackLeftClick, trackRightClick } from './hooks/mouseListener';

// sudo-prompt 选项
const options = {
  name: 'Electron App'
};

// 判断是否为生产环境
const isProd = process.env.NODE_ENV === 'production';

// 生产环境下使用静态资源
// 开发环境下设置用户数据文件夹路径
if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

let mainWindow: BrowserWindow | null = null;
let framelessWindow: BrowserWindow | null = null;

/**
 * 为 MacKeyServer 设置权限
 */
const setPermissionsForMacKeyServer = () => {
  return new Promise((resolve, reject) => {
    const command = `chmod +x "${path.join(__dirname, '../node_modules/node-global-key-listener/bin/MacKeyServer')}"`;

    sudo.exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`为 MacKeyServer 设置权限失败: ${stderr || error.message}`));
      } else {
        console.log('已为 MacKeyServer 设置权限');
        resolve(null);
      }
    });
  });
};

/**
 * 创建主窗口
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
    mainWindow.webContents.openDevTools(); // 打开开发者工具
  }
};

/**
 * 切换无框窗口的显示状态
 */
const toggleFramelessWindow = async () => {
  if (framelessWindow) {
    framelessWindow.close();
    framelessWindow = null;
  } else {
    framelessWindow = new BrowserWindow({
      width: 800,
      height: 300,
      frame: false,
      alwaysOnTop: true,
      show: false, // 默认隐藏
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    framelessWindow.webContents.on('did-finish-load', () => {
      console.log('Frameless window content loaded successfully');
      framelessWindow!.show();
      framelessWindow!.focus();
    });

    if (isProd) {
      await framelessWindow.loadURL('app://./frameless');
    } else {
      const port = process.argv[2];
      await framelessWindow.loadURL(`http://localhost:${port}/frame`);
    }

    // 中心位置调整
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    console.log('屏幕宽高：', width, height);
    framelessWindow.setBounds({
      x: Math.round((width - 800) / 2),
      y: Math.round((height - 300) / 2 - ((height - 300)) * 0.15),
      width: 800,
      height: 300,
    });

    framelessWindow.on('closed', () => {
      framelessWindow = null;
    });
  }
};

/**
 * 初始化鼠标跟踪功能
 */
const initializeMouseTracking = async () => {
  trackLeftClick(
    async (x, y, count) => {
      console.log('鼠标点击位置：', x, y);
    },
    async (x, y, count) => {
      console.log('双击位置：', x, y);
      await new Promise(resolve => setTimeout(resolve, 10));
      const selectedContent = await getSelected();
      if (selectedContent.text === '') {
        console.log('没有选中内容');
      } else {
        console.log('选中内容：', selectedContent);
      }
    },
    async (x, y, count) => {
      console.log('拖拽次数 ==', count, ' 位置：', x, y);
      await new Promise(resolve => setTimeout(resolve, 10));
      const selectedContent = await getSelected();
      if (selectedContent.text === '') {
        console.log('没有选中内容');
      } else {
        console.log('选中内容：', selectedContent);
      }
    }
  )
};

/**
 * 初始化应用程序
 */
const initializeApp = async () => {
  try {
    await app.whenReady();
    await createMainWindow();
    // await initializeMouseTracking();

    // 注册全局快捷键监听
    globalShortcut.register('CommandOrControl+M', () => {
      console.log('CommandOrControl+M detected');
      toggleFramelessWindow();
    });

    console.log('Global keyboard shortcut set up successfully.');
  } catch (error) {
    console.error('初始化应用失败：', error);
    app.quit();
  }
};

// 主入口
(async () => {
  try {
    await setPermissionsForMacKeyServer();
    await initializeApp();
  } catch (error) {
    console.error(error);
    app.quit();
  }
})();

/**
 * 应用程序事件监听
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  try {
    if (!mainWindow || mainWindow.isDestroyed()) {
      await createMainWindow();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  } catch (error) {
    console.error('Error during activate event:', error);
  }
});

app.on('will-quit', () => {
  // 注销所有快捷键
  globalShortcut.unregisterAll();
});

/**
 * IPC 事件监听
 */
ipcMain.on('close-frameless-window', () => {
  console.log('bg关闭无框窗口...');
  if (framelessWindow) {
    console.log('关闭无框窗口...');
    framelessWindow.close();
  }
});

ipcMain.on('open-main-window', (event, inputValue) => {
  console.log('bg打开主窗口...', inputValue);
});