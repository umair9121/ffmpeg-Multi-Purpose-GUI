const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');

let configured = false;
let ffmpegSource = null;

async function findSystemFfmpeg() {
  return new Promise((resolve) => {
    execFile('ffmpeg', ['-version'], (error) => {
      if (error) {
        resolve(null);
      } else {
        resolve('ffmpeg');
      }
    });
  });
}

function configureWithStatic() {
  if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
    const ffprobePath = ffprobeStatic?.path || ffprobeStatic;
    if (ffprobePath && fs.existsSync(ffprobePath)) {
      ffmpeg.setFfprobePath(ffprobePath);
    }
    configured = true;
    ffmpegSource = 'bundled';
    return true;
  }
  return false;
}

async function ensureFfmpegAvailability() {
  if (configured) {
    return { available: true, source: ffmpegSource || 'cached' };
  }
  
  // Try system ffmpeg first
  const systemPath = await findSystemFfmpeg();
  if (systemPath) {
    ffmpeg.setFfmpegPath(systemPath);
    const ffprobePath = await new Promise((resolve) => {
      execFile('ffprobe', ['-version'], (error) => {
        if (error) {
          resolve(null);
        } else {
          resolve('ffprobe');
        }
      });
    });
    if (ffprobePath) {
      ffmpeg.setFfprobePath(ffprobePath);
    }
    configured = true;
    ffmpegSource = 'system';
    return { available: true, source: 'system' };
  }
  
  // Fall back to bundled static binaries
  if (configureWithStatic()) {
    return { available: true, source: 'bundled' };
  }
  
  return { available: false, source: null };
}

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
    const { files, startTime, duration, outputFormat, suffix, outputDirectory } = options;
    const results = [];
    
    for (const file of files) {
      const inputExt = path.extname(file);
      const baseName = path.basename(file, inputExt);
      const dirName = path.dirname(file);
      const targetDir = outputDirectory && outputDirectory.trim() !== '' ? outputDirectory : dirName;
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Determine output extension
      const outExt = outputFormat === 'same' ? inputExt : `.${outputFormat}`;
      const outputPath = path.join(targetDir, `${baseName}${suffix}${outExt}`);
      
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

module.exports = {
  ...ffmpegService,
  ensureFfmpegAvailability
};