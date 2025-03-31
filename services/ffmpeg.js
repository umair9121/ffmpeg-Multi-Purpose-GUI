const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

// Set ffmpeg path if needed (for packaged app)
// ffmpeg.setFfmpegPath(path.join(process.resourcesPath, 'bin', 'ffmpeg.exe'));

const ffmpegService = {
  /**
   * Trim audio or video files
   * @param {Object} options - Trim options
   * @param {Array} options.files - Array of file paths
   * @param {string} options.startTime - Start time for trimming
   * @param {string} options.duration - Duration of the trimmed segment
   * @param {string} options.outputFormat - Output format (or 'same' to maintain input format)
   * @param {string} options.suffix - Suffix to add to the output filename
   * @param {Function} options.onProgress - Progress callback function
   * @returns {Promise<Array>} - Array of output file paths
   */
  trimAudio: async (options) => {
    const { files, startTime, duration, outputFormat, suffix } = options;
    const results = [];
    
    for (const file of files) {
      const inputExt = path.extname(file);
      const baseName = path.basename(file, inputExt);
      const dirName = path.dirname(file);
      
      // Determine output extension
      const outExt = outputFormat === 'same' ? inputExt : `.${outputFormat}`;
      const outputPath = path.join(dirName, `${baseName}${suffix}${outExt}`);
      
      await new Promise((resolve, reject) => {
        let command = ffmpeg(file)
          .setStartTime(startTime)
          .duration(duration);
        
        // Copy codec if same format, otherwise transcode
        if (outputFormat === 'same') {
          command = command.outputOptions('-c copy');
        }
        
        command.output(outputPath)
          .on('progress', (progress) => {
            if (options.onProgress) {
              options.onProgress(file, progress.percent);
            }
          })
          .on('end', () => {
            results.push(outputPath);
            resolve();
          })
          .on('error', (err) => {
            reject(new Error(`Error processing ${file}: ${err.message}`));
          })
          .run();
      });
    }
    
    return results;
  },
  
  /**
   * Process files in a directory
   * @param {Object} options - Processing options
   * @param {string} options.directoryPath - Directory containing files
   * @param {Array} options.extensions - File extensions to process
   * @param {Function} options.processFunction - Function to process each file
   * @returns {Promise<Array>} - Array of processed file results
   */
  processDirectory: async (options) => {
    const { directoryPath, extensions, processFunction } = options;
    
    try {
      const files = fs.readdirSync(directoryPath)
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return extensions.includes(ext);
        })
        .map(file => path.join(directoryPath, file));
      
      return await processFunction(files);
    } catch (error) {
      throw new Error(`Error processing directory: ${error.message}`);
    }
  },
  
  // Add more FFmpeg operations here: convert, extract audio, merge, etc.
};

module.exports = ffmpegService; 