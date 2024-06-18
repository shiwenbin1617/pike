const { contextBridge, ipcRenderer } = require('electron');

const handler = {
  send(channel, value) {
    ipcRenderer.send(channel, value);
  },
  on(channel, callback) {
    const subscription = (_event, ...args) => callback(...args);
    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  removeListener(channel, callback) {
    ipcRenderer.removeListener(channel, callback);
  },
  onTextSelected(callback) {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('text-selected', handler);
    return () => {
      ipcRenderer.removeListener('text-selected', handler);
    };
  },
  sendTextSelection(rect) {
    ipcRenderer.send('text-selected', { rect });
  },
  onShowToolbar(callback) {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('show-toolbar', handler);
    return () => {
      ipcRenderer.removeListener('show-toolbar', handler);
    };
  }
};

contextBridge.exposeInMainWorld('electronAPI', handler);