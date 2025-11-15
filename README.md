# Audio Multi Settings

A desktop application for batch audio processing operations, built with Electron. This application provides an easy-to-use graphical interface for trimming, converting, and managing audio files.

## Features

- **Batch Audio Trimming**: Trim multiple audio files to specified durations
- **Multiple File Selection**: Select individual files or entire directories
- **Flexible Output**: Choose same directory output or custom output locations
- **Progress Tracking**: Real-time progress bars and status updates
- **Multiple Audio Formats**: Support for MP3, M4A, WAV, FLAC, AAC files
- **Automatic FFmpeg Handling**: Bundled FFmpeg binaries for easy setup
- **Cross-platform**: Works on Windows, macOS, and Linux

## Quick Start

### Installation

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd ffmpeg-script-for-auto-trimming-multiple-files
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)

The application will automatically handle FFmpeg installation. If FFmpeg is not found on your system, it will use bundled binaries.

## Usage

### Basic Audio Trimming

1. **Launch the application** using `npm start`
2. **Select files** using one of these methods:
   - Click "Select Files" to choose individual audio files
   - Click "Select Directory" to process all audio files in a folder
3. **Configure settings**:
   - Set trim duration (default: 30 minutes)
   - Choose output location (same directory or custom)
4. **Click "Start Processing"** to begin batch trimming

### Supported Audio Formats

- MP3 (.mp3)
- M4A (.m4a)
- WAV (.wav)
- FLAC (.flac)
- AAC (.aac)

### Output Options

- **Same Directory**: Trimmed files are saved alongside originals with "_trimmed" suffix
- **Custom Directory**: Choose a different output location for all processed files

## Development

### Available Scripts

- `npm start` - Launch the application in development mode
- `npm run build` - Build the application for distribution
- `npm test` - Run tests (currently no tests configured)

### Project Structure

```
├── main.js              # Electron main process
├── preload.js           # Preload script for security
├── src/
│   ├── index.html       # Main UI
│   ├── renderer.js      # Frontend logic
│   └── styles.css       # Application styles
├── services/
│   ├── ffmpeg.js        # Audio processing service
│   └── database.js      # Data persistence
└── script_trim_30min.bat # Legacy batch script
```

### Building for Distribution

To create a distributable version of the application:

```bash
npm run build
```

This will create platform-specific installers in the `dist/` directory.

## Troubleshooting

### FFmpeg Issues

- The application automatically detects and configures FFmpeg
- If FFmpeg fails to install automatically, download it from [ffmpeg.org](https://ffmpeg.org/download.html)
- Add FFmpeg to your system PATH or place binaries in the project root

### Common Problems

- **Application won't start**: Ensure Node.js v14+ is installed
- **No audio files found**: Check file extensions are supported (MP3, M4A, WAV, FLAC, AAC)
- **Processing fails**: Verify input files are not corrupted and have proper permissions

## Legacy Batch Script

For command-line usage, a legacy batch script (`script_trim_30min.bat`) is included:

1. Edit the script to set your directory path
2. Modify file extensions if needed (currently set to .m4a)
3. Run the batch file directly

## License

MIT License - see package.json for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
