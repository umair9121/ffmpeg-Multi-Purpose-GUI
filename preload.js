const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // File operations
  selectFiles: () => ipcRenderer.invoke('select-files'),
  
  // FFmpeg operations
  trimAudio: (options) => ipcRenderer.invoke('trim-audio', options),
  convertFormat: (options) => ipcRenderer.invoke('convert-format', options),
  extractAudio: (options) => ipcRenderer.invoke('extract-audio', options),
  mergeMedia: (options) => ipcRenderer.invoke('merge-media', options),
  onTrimProgress: (callback) => {
    ipcRenderer.on('trim-progress', (_event, data) => {
      if (typeof callback === 'function') {
        callback(data);
      }
    });
  },
  
  // Database operations
  savePreset: (preset) => ipcRenderer.invoke('save-preset', preset),
  getPresets: () => ipcRenderer.invoke('get-presets'),
  
  // Directory helpers
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getDirectoryFiles: (options) => ipcRenderer.invoke('get-directory-files', options)
});