const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const ffmpegService = require('./services/ffmpeg');
const dbService = require('./services/database');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const isDev = require('electron-is-dev');

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

async function ensureFfmpeg(mainWindow) {
  const status = await ffmpegService.ensureFfmpegAvailability();
  
  if (!status.available) {
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'error',
      buttons: ['OK', 'Open Download Page'],
      defaultId: 1,
      cancelId: 0,
      title: 'FFmpeg Required',
      message: 'FFmpeg is required to process audio files, but it could not be installed automatically.',
      detail: 'Click "Open Download Page" for instructions on installing FFmpeg manually.'
    });
    
    if (result.response === 1) {
      shell.openExternal('https://ffmpeg.org/download.html');
    }
    
    return status;
  }
  
  if (status.source === 'bundled') {
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      buttons: ['Continue', 'Install FFmpeg Manually'],
      defaultId: 0,
      cancelId: 0,
      title: 'Bundled FFmpeg Activated',
      message: 'A bundled FFmpeg binary will be used because a system installation was not detected.',
      detail: 'You can continue using the bundled version, or click "Install FFmpeg Manually" for setup instructions.'
    });
    
    if (result.response === 1) {
      shell.openExternal('https://ffmpeg.org/download.html');
    }
  }
  
  return status;
}

app.whenReady().then(async () => {
  createWindow();
  
  // Connect to MongoDB
  dbService.connect();
  
  // Ensure FFmpeg is available
  if (mainWindow) {
    await ensureFfmpeg(mainWindow);
  }
  
  // Check for updates
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
  
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
      { name: 'Media Files', extensions: ['mp3', 'm4a', 'wav', 'flac', 'aac', 'mp4'] }
    ]
  });
  
  return result.filePaths;
});

ipcMain.handle('trim-audio', async (event, options) => {
  try {
    const results = await ffmpegService.trimAudio({
      ...options,
      onProgress: (file, percent) => {
        if (mainWindow) {
          mainWindow.webContents.send('trim-progress', {
            file,
            percent: typeof percent === 'number' ? percent : 0
          });
        }
      }
    });
    return { success: true, results };
  } catch (error) {
    console.error('Error trimming audio:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('convert-format', async (event, options) => {
  try {
    const results = await ffmpegService.convertFormat({
      ...options,
      onProgress: (file, percent) => {
        if (mainWindow) {
          mainWindow.webContents.send('convert-progress', {
            file,
            percent: typeof percent === 'number' ? percent : 0
          });
        }
      }
    });
    return { success: true, results };
  } catch (error) {
    console.error('Error converting files:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('extract-audio', async (event, options) => {
  try {
    const results = await ffmpegService.extractAudio({
      ...options,
      onProgress: (file, percent) => {
        if (mainWindow) {
          mainWindow.webContents.send('extract-progress', {
            file,
            percent: typeof percent === 'number' ? percent : 0
          });
        }
      }
    });
    return { success: true, results };
  } catch (error) {
    console.error('Error extracting audio:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('merge-media', async (event, options) => {
  try {
    const results = await ffmpegService.mergeMedia({
      ...options,
      onProgress: (file, percent) => {
        if (mainWindow) {
          mainWindow.webContents.send('merge-progress', {
            file,
            percent: typeof percent === 'number' ? percent : 0
          });
        }
      }
    });
    return { success: true, results };
  } catch (error) {
    console.error('Error merging media:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('probe-media', async (_event, filePath) => {
  try {
    const metadata = await ffmpegService.probeMedia(filePath);
    return { success: true, metadata };
  } catch (error) {
    console.error('Error probing media:', error);
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