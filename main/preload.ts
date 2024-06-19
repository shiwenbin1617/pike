import { contextBridge, ipcRenderer } from 'electron';

/**
 * 创建事件处理程序函数
 * @param {string} eventName - 事件名称
 * @param {function} callback - 回调函数
 */
const createEventHandler = (eventName, callback) => {
  // 定义事件处理程序
  const handler = (event, data) => callback(data);

  // 绑定事件
  ipcRenderer.on(eventName, handler);

  // 返回取消绑定的函数
  return () => {
    ipcRenderer.removeListener(eventName, handler);
  };
};

// 封装的 IPC 处理对象
const handler = {
  send(channel, value) {
    try {
      ipcRenderer.send(channel, value);
    } catch (error) {
      console.error(`Error sending IPC message on channel ${channel}:`, error);
    }
  },
  on(channel, callback) {
    return createEventHandler(channel, callback);
  },
  removeListener(channel, callback) {
    ipcRenderer.removeListener(channel, callback);
  },
  onTextSelected(callback) {
    return createEventHandler('text-selected', callback);
  },
  sendTextSelection(rect) {
    if (typeof rect === 'object' && rect !== null && 'x' in rect && 'y' in rect) {
      ipcRenderer.send('text-selected', { rect });
    } else {
      console.error('Invalid rect object');
    }
  },
  onShowToolbar(callback) {
    return createEventHandler('show-toolbar', callback);
  },
  clipboard: {
    readText: (type) => ipcRenderer.invoke('clipboard-read-text', type).catch(console.error),
    writeText: (text) => ipcRenderer.invoke('clipboard-write-text', text).catch(console.error),
    read: (format) => ipcRenderer.invoke('clipboard-read', format).catch(console.error)
  }
};

// 暴露处理接口到上下文隔离的渲染进程中
contextBridge.exposeInMainWorld('electronAPI', handler);