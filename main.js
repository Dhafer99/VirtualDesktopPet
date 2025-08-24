// main.js - Enhanced system integration version
const { app, BrowserWindow, screen, ipcMain, powerMonitor, nativeTheme } = require('electron');
const path = require('path');
const os = require('os');

let mainWindow;
let systemStats = {
  lastCpuUsage: 0,
  lastMemoryUsage: 0,
  batteryLevel: 100,
  isCharging: true
};

function createWindow() {
  // Get screen dimensions
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: 200,
    height: 280,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    x: screenWidth - 220, // Bottom right corner
    y: screenHeight - 300,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.setSkipTaskbar(true);
  
  // Handle window movement
  ipcMain.on('move-window', (event, deltaX, deltaY) => {
    const [currentX, currentY] = mainWindow.getPosition();
    mainWindow.setPosition(currentX + deltaX, currentY + deltaY);
  });
  
  // Handle app quit
  ipcMain.on('quit-app', () => {
    app.quit();
  });
  
  // Start system monitoring
  startSystemMonitoring();
}

// System monitoring functions
function startSystemMonitoring() {
  // Monitor system stats every 10 seconds
  setInterval(() => {
    updateSystemStats();
  }, 10000);
  
  // Monitor power events
  powerMonitor.on('suspend', () => {
    mainWindow.webContents.send('system-event', { type: 'suspend' });
  });
  
  powerMonitor.on('resume', () => {
    mainWindow.webContents.send('system-event', { type: 'resume' });
  });
  
  powerMonitor.on('on-ac', () => {
    mainWindow.webContents.send('system-event', { type: 'charging' });
  });
  
  powerMonitor.on('on-battery', () => {
    mainWindow.webContents.send('system-event', { type: 'battery' });
  });
  
  // Monitor theme changes
  nativeTheme.on('updated', () => {
    mainWindow.webContents.send('system-event', { 
      type: 'theme-change', 
      dark: nativeTheme.shouldUseDarkColors 
    });
  });
}

function updateSystemStats() {
  const cpuUsage = process.getCPUUsage();
  const memoryUsage = process.getSystemMemoryInfo();
  
  // Calculate CPU percentage (simplified)
  const cpuPercent = (cpuUsage.percentCPUUsage * 100).toFixed(1);
  
  // Get memory usage percentage
  const memPercent = ((memoryUsage.total - memoryUsage.free) / memoryUsage.total * 100).toFixed(1);
  
  // Send stats to renderer if they've changed significantly
  if (Math.abs(cpuPercent - systemStats.lastCpuUsage) > 10 || 
      Math.abs(memPercent - systemStats.lastMemoryUsage) > 10) {
    
    mainWindow.webContents.send('system-stats', {
      cpu: cpuPercent,
      memory: memPercent,
      platform: os.platform(),
      uptime: os.uptime()
    });
    
    systemStats.lastCpuUsage = cpuPercent;
    systemStats.lastMemoryUsage = memPercent;
  }
}

// IPC handlers for system info requests
ipcMain.handle('get-system-info', () => {
  return {
    platform: os.platform(),
    arch: os.arch(),
    totalmem: os.totalmem(),
    freemem: os.freemem(),
    uptime: os.uptime(),
    cpus: os.cpus().length,
    theme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
