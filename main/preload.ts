const { ipcRenderer, contextBridge } = require('electron');

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
      console.log(`Sending IPC message on channel ${channel}:`, value);
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
  }
};

// 暴露处理接口到上下文隔离的渲染进程中
contextBridge.exposeInMainWorld('electron', handler);

