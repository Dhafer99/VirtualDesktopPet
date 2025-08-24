const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  moveWindow: (deltaX, deltaY) => {
    ipcRenderer.send('move-window', deltaX, deltaY);
  },
  
  quit: () => {
    ipcRenderer.send('quit-app');
  },
  
  // System monitoring capabilities
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // System event listeners
  onSystemEvent: (callback) => {
    ipcRenderer.on('system-event', (event, data) => callback(data));
  },
  
  onSystemStats: (callback) => {
    ipcRenderer.on('system-stats', (event, data) => callback(data));
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});