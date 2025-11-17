const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');

let configured = false;
let ffmpegSource = null;
const SUPPORTED_AUDIO_FORMATS = ['mp3', 'm4a', 'wav', 'aac'];

const codecMap = {
  mp3: 'libmp3lame',
  m4a: 'aac',
  aac: 'aac',
  wav: 'pcm_s16le'
};

function resolveCodec(targetFormat) {
  return codecMap[targetFormat] || null;
}

function normalizeBitrate(bitrate) {
  if (bitrate === undefined || bitrate === null) {
    return null;
  }
  const value = String(bitrate).trim();
  if (!value) {
    return null;
  }
  if (/[a-zA-Z]$/.test(value)) {
    return value;
  }
  return `${value}k`;
}

function toPositiveInteger(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
}

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
   * Convert audio files to another format
   * @param {Object} options
   * @param {Array<string>} options.files
   * @param {string} options.targetFormat
   * @param {string} [options.suffix]
   * @param {string|null} [options.outputDirectory]
   * @param {Function} [options.onProgress]
   * @returns {Promise<Array<string>>}
   */
  convertFormat: async (options) => {
    const { files, targetFormat, suffix = '_converted', outputDirectory, onProgress } = options;

    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No files provided for conversion.');
    }

    if (!targetFormat || !SUPPORTED_AUDIO_FORMATS.includes(targetFormat)) {
      throw new Error('Unsupported target format.');
    }

    const results = [];

    for (const file of files) {
      const inputExt = path.extname(file);
      const baseName = path.basename(file, inputExt);
      const dirName = path.dirname(file);
      const targetDir = outputDirectory && outputDirectory.trim() !== '' ? outputDirectory : dirName;

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const sanitizedSuffix = typeof suffix === 'string' ? suffix : '';
      const outputPath = path.join(targetDir, `${baseName}${sanitizedSuffix}.${targetFormat}`);

      await new Promise((resolve, reject) => {
        let command = ffmpeg(file).output(outputPath).toFormat(targetFormat);

        const codec = resolveCodec(targetFormat);
        if (codec) {
          command = command.audioCodec(codec);
        }

        command
          .on('progress', (progress) => {
            if (onProgress) {
              onProgress(file, progress.percent);
            }
          })
          .on('end', () => {
            results.push(outputPath);
            resolve();
          })
          .on('error', (err) => {
            reject(new Error(`Error converting ${file}: ${err.message}`));
          })
          .run();
      });
    }

    return results;
  },
  /**
   * Extract audio segments from media files
   * @param {Object} options
   * @param {Array<string>} options.files
   * @param {string} options.startTime
   * @param {string} options.duration
   * @param {string} options.outputFormat
   * @param {string} [options.suffix]
   * @param {string|null} [options.outputDirectory]
   * @param {Function} [options.onProgress]
   * @returns {Promise<Array<string>>}
   */
  extractAudio: async (options) => {
    const {
      files,
      startTime = '00:00:00',
      duration,
      outputFormat = 'mp3',
      suffix = '_extract',
      outputDirectory,
      onProgress,
      audioCodec = 'auto',
      audioBitrate,
      sampleRate,
      channels,
      audioTrack,
      audioFilters
    } = options;

    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No files provided for extraction.');
    }

    if (!duration) {
      throw new Error('Duration is required for audio extraction.');
    }

    if (!SUPPORTED_AUDIO_FORMATS.includes(outputFormat)) {
      throw new Error('Unsupported output format for extraction.');
    }

    const normalizedCodec = typeof audioCodec === 'string' ? audioCodec.toLowerCase() : 'auto';
    const bitrateOption = normalizeBitrate(audioBitrate);
    const sampleRateOption = toPositiveInteger(sampleRate);
    const channelOption = toPositiveInteger(channels);
    const filtersOption = typeof audioFilters === 'string' && audioFilters.trim() !== '' ? audioFilters.trim() : null;
    const mapOption = typeof audioTrack === 'string' && audioTrack.trim() !== '' ? audioTrack.trim() : null;

    const results = [];

    for (const file of files) {
      const inputExt = path.extname(file);
      const baseName = path.basename(file, inputExt);
      const dirName = path.dirname(file);
      const targetDir = outputDirectory && outputDirectory.trim() !== '' ? outputDirectory : dirName;

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const sanitizedSuffix = typeof suffix === 'string' ? suffix : '';
      const outputPath = path.join(targetDir, `${baseName}${sanitizedSuffix}.${outputFormat}`);

      await new Promise((resolve, reject) => {
        const inputFormat = inputExt.replace('.', '').toLowerCase();
        const targetFormat = outputFormat.toLowerCase();
        let command = ffmpeg(file)
          .setStartTime(startTime)
          .duration(duration)
          .noVideo()
          .output(outputPath)
          .toFormat(outputFormat);

        if (mapOption) {
          command = command.outputOptions(['-map', mapOption]);
        }

        const streamCopyRequested = normalizedCodec === 'copy';
        const streamCopyAllowed = streamCopyRequested &&
          inputFormat === targetFormat &&
          !filtersOption &&
          !bitrateOption &&
          !sampleRateOption &&
          !channelOption;

        if (streamCopyRequested && !streamCopyAllowed) {
          console.warn(`Stream copy requested for ${file} but requirements not met (format mismatch or filters/options present). Falling back to re-encoding.`);
        }

        if (streamCopyAllowed) {
          command = command.outputOptions('-c copy');
        } else {
          const codec = normalizedCodec === 'auto' ? resolveCodec(targetFormat) : normalizedCodec;
          if (codec) {
            command = command.audioCodec(codec);
          }
          if (bitrateOption) {
            command = command.audioBitrate(bitrateOption);
          }
          if (sampleRateOption) {
            command = command.audioFrequency(sampleRateOption);
          }
          if (channelOption) {
            command = command.audioChannels(channelOption);
          }
          if (filtersOption) {
            command = command.audioFilters(filtersOption);
          }
        }

        command
          .on('progress', (progress) => {
            if (onProgress) {
              onProgress(file, progress.percent);
            }
          })
          .on('end', () => {
            results.push(outputPath);
            resolve();
          })
          .on('error', (err) => {
            reject(new Error(`Error extracting audio from ${file}: ${err.message}`));
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