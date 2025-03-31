const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const ffmpegService = require('./services/ffmpeg');
const dbService = require('./services/database');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  
  // Open DevTools in development
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  
  // Connect to MongoDB
  dbService.connect();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for FFmpeg operations
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'm4a', 'wav', 'flac', 'aac'] }
    ]
  });
  
  return result.filePaths;
});

ipcMain.handle('trim-audio', async (event, options) => {
  try {
    const results = await ffmpegService.trimAudio(options);
    return { success: true, results };
  } catch (error) {
    console.error('Error trimming audio:', error);
    return { success: false, error: error.message };
  }
});

// Add this new IPC handler for directory selection
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  return result.filePaths[0];
});

// Add this handler to get files from a directory with specific extensions
ipcMain.handle('get-directory-files', async (event, { directoryPath, extensions }) => {
  try {
    const files = fs.readdirSync(directoryPath);
    return files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return extensions.includes(ext);
      })
      .map(file => path.join(directoryPath, file));
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
});

// Add more IPC handlers for different FFmpeg operations 