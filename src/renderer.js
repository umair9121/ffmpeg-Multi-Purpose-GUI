document.addEventListener('DOMContentLoaded', () => {
  // Navigation buttons
  const navButtons = document.querySelectorAll('.nav-button');
  const sections = document.querySelectorAll('.section');
  
  // Trim section elements
  const selectFilesBtn = document.getElementById('select-files');
  const selectedFilesContainer = document.getElementById('selected-files');
  const startTrimBtn = document.getElementById('start-trim');
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');

  // Convert section elements
  const convertSelectFilesBtn = document.getElementById('convert-select-files');
  const convertSelectedFilesContainer = document.getElementById('convert-selected-files');
  const startConvertBtn = document.getElementById('start-convert');
  const convertProgressContainer = document.getElementById('convert-progress-container');
  const convertProgressBar = document.getElementById('convert-progress-bar');
  const convertProgressText = document.getElementById('convert-progress-text');
  const convertSelectDirectoryBtn = document.getElementById('convert-select-directory');
  const convertDirectoryPathInput = document.getElementById('convert-directory-path');
  const convertProcessDirectoryBtn = document.getElementById('convert-process-directory');
  const convertOutputSameRadio = document.getElementById('convert-output-same');
  const convertOutputCustomRadio = document.getElementById('convert-output-custom');
  const convertCustomOutputSelector = document.getElementById('convert-custom-output-selector');
  const convertSelectOutputDirectoryBtn = document.getElementById('convert-select-output-directory');
  const convertCustomOutputPathInput = document.getElementById('convert-custom-output-path');

  // Extract section elements
  const extractSelectFilesBtn = document.getElementById('extract-select-files');
  const extractSelectedFilesContainer = document.getElementById('extract-selected-files');
  const startExtractBtn = document.getElementById('start-extract');
  const extractProgressContainer = document.getElementById('extract-progress-container');
  const extractProgressBar = document.getElementById('extract-progress-bar');
  const extractProgressText = document.getElementById('extract-progress-text');
  const extractSelectDirectoryBtn = document.getElementById('extract-select-directory');
  const extractDirectoryPathInput = document.getElementById('extract-directory-path');
  const extractProcessDirectoryBtn = document.getElementById('extract-process-directory');
  const extractOutputSameRadio = document.getElementById('extract-output-same');
  const extractOutputCustomRadio = document.getElementById('extract-output-custom');
  const extractCustomOutputSelector = document.getElementById('extract-custom-output-selector');
  const extractSelectOutputDirectoryBtn = document.getElementById('extract-select-output-directory');
  const extractCustomOutputPathInput = document.getElementById('extract-custom-output-path');
  
  // Directory selection elements
  const selectDirectoryBtn = document.getElementById('select-directory');
  const directoryPathInput = document.getElementById('directory-path');
  const processDirectoryBtn = document.getElementById('process-directory');
  const fileFilters = document.getElementById('file-filters');
  const outputSameRadio = document.getElementById('output-same');
  const outputCustomRadio = document.getElementById('output-custom');
  const customOutputSelector = document.getElementById('custom-output-selector');
  const selectOutputDirectoryBtn = document.getElementById('select-output-directory');
  const customOutputPathInput = document.getElementById('custom-output-path');
  
  // Keep track of selected files
  let selectedFiles = [];
  let convertSelectedFiles = [];
  let extractSelectedFiles = [];
  
  let currentDirectoryPath = '';
  let customOutputPath = '';
  let convertDirectoryPath = '';
  let convertCustomOutputPath = '';
  let extractDirectoryPath = '';
  let extractCustomOutputPath = '';

  // Listen for trim progress updates from the main process
  if (window.api && typeof window.api.onTrimProgress === 'function') {
    window.api.onTrimProgress(({ percent }) => {
      const value = typeof percent === 'number' ? percent : 0;
      progressBar.value = value;
      progressText.textContent = `${Math.round(value)}%`;
    });
  }

  if (window.api && typeof window.api.onConvertProgress === 'function') {
    window.api.onConvertProgress(({ percent }) => {
      const value = typeof percent === 'number' ? percent : 0;
      convertProgressBar.value = value;
      convertProgressText.textContent = `${Math.round(value)}%`;
    });
  }

  if (window.api && typeof window.api.onExtractProgress === 'function') {
    window.api.onExtractProgress(({ percent }) => {
      const value = typeof percent === 'number' ? percent : 0;
      extractProgressBar.value = value;
      extractProgressText.textContent = `${Math.round(value)}%`;
    });
  }
  
  // Handle navigation
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Get the target section id from the button id
      const sectionId = button.id.replace('btn-', 'section-');
      
      // Update active button
      navButtons.forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      
      // Show the target section
      sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionId) {
          section.classList.add('active');
        }
      });
    });
  });
  
  // Handle file selection
  selectFilesBtn.addEventListener('click', async () => {
    try {
      const files = await window.api.selectFiles();
      if (files && files.length > 0) {
        selectedFiles = files;
        displaySelectedFiles();
      }
    } catch (error) {
      console.error('Error selecting files:', error);
      alert('Error selecting files: ' + error.message);
    }
  });

  if (convertSelectFilesBtn) {
    convertSelectFilesBtn.addEventListener('click', async () => {
      try {
        const files = await window.api.selectFiles();
        if (files && files.length > 0) {
          convertSelectedFiles = files;
          displayConvertSelectedFiles();
        }
      } catch (error) {
        console.error('Error selecting files for conversion:', error);
        alert('Error selecting files: ' + error.message);
      }
    });
  }

  if (extractSelectFilesBtn) {
    extractSelectFilesBtn.addEventListener('click', async () => {
      try {
        const files = await window.api.selectFiles();
        if (files && files.length > 0) {
          extractSelectedFiles = files;
          displayExtractSelectedFiles();
        }
      } catch (error) {
        console.error('Error selecting files for extraction:', error);
        alert('Error selecting files: ' + error.message);
      }
    });
  }
  
  // Handle directory selection
  selectDirectoryBtn.addEventListener('click', async () => {
    try {
      const dirPath = await window.api.selectDirectory();
      if (dirPath) {
        currentDirectoryPath = dirPath;
        directoryPathInput.value = dirPath;
        await loadDirectoryFiles(true);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      alert('Error selecting directory: ' + error.message);
    }
  });

  if (convertSelectDirectoryBtn) {
    convertSelectDirectoryBtn.addEventListener('click', async () => {
      try {
        const dirPath = await window.api.selectDirectory();
        if (dirPath) {
          convertDirectoryPath = dirPath;
          convertDirectoryPathInput.value = dirPath;
        }
      } catch (error) {
        console.error('Error selecting convert directory:', error);
        alert('Error selecting directory: ' + error.message);
      }
    });
  }

  if (extractSelectDirectoryBtn) {
    extractSelectDirectoryBtn.addEventListener('click', async () => {
      try {
        const dirPath = await window.api.selectDirectory();
        if (dirPath) {
          extractDirectoryPath = dirPath;
          extractDirectoryPathInput.value = dirPath;
        }
      } catch (error) {
        console.error('Error selecting extract directory:', error);
        alert('Error selecting directory: ' + error.message);
      }
    });
  }

  function updateOutputDirectoryVisibility() {
    if (outputCustomRadio.checked) {
      customOutputSelector.classList.remove('hidden');
    } else {
      customOutputSelector.classList.add('hidden');
    }
  }

  outputSameRadio.addEventListener('change', updateOutputDirectoryVisibility);
  outputCustomRadio.addEventListener('change', updateOutputDirectoryVisibility);
  updateOutputDirectoryVisibility();

  if (selectOutputDirectoryBtn) {
    selectOutputDirectoryBtn.addEventListener('click', async () => {
      try {
        const dirPath = await window.api.selectDirectory();
        if (dirPath) {
          customOutputPath = dirPath;
          customOutputPathInput.value = dirPath;
        }
      } catch (error) {
        console.error('Error selecting output directory:', error);
        alert('Error selecting output directory: ' + error.message);
      }
    });
  }

  function updateConvertOutputDirectoryVisibility() {
    if (!convertOutputSameRadio || !convertOutputCustomRadio || !convertCustomOutputSelector) {
      return;
    }

    if (convertOutputCustomRadio.checked) {
      convertCustomOutputSelector.classList.remove('hidden');
    } else {
      convertCustomOutputSelector.classList.add('hidden');
    }
  }

  if (convertOutputSameRadio && convertOutputCustomRadio) {
    convertOutputSameRadio.addEventListener('change', updateConvertOutputDirectoryVisibility);
    convertOutputCustomRadio.addEventListener('change', updateConvertOutputDirectoryVisibility);
    updateConvertOutputDirectoryVisibility();
  }

  if (convertSelectOutputDirectoryBtn) {
    convertSelectOutputDirectoryBtn.addEventListener('click', async () => {
      try {
        const dirPath = await window.api.selectDirectory();
        if (dirPath) {
          convertCustomOutputPath = dirPath;
          convertCustomOutputPathInput.value = dirPath;
        }
      } catch (error) {
        console.error('Error selecting convert output directory:', error);
        alert('Error selecting output directory: ' + error.message);
      }
    });
  }

  function updateExtractOutputDirectoryVisibility() {
    if (!extractOutputSameRadio || !extractOutputCustomRadio || !extractCustomOutputSelector) {
      return;
    }

    if (extractOutputCustomRadio.checked) {
      extractCustomOutputSelector.classList.remove('hidden');
    } else {
      extractCustomOutputSelector.classList.add('hidden');
    }
  }

  if (extractOutputSameRadio && extractOutputCustomRadio) {
    extractOutputSameRadio.addEventListener('change', updateExtractOutputDirectoryVisibility);
    extractOutputCustomRadio.addEventListener('change', updateExtractOutputDirectoryVisibility);
    updateExtractOutputDirectoryVisibility();
  }

  if (extractSelectOutputDirectoryBtn) {
    extractSelectOutputDirectoryBtn.addEventListener('click', async () => {
      try {
        const dirPath = await window.api.selectDirectory();
        if (dirPath) {
          extractCustomOutputPath = dirPath;
          extractCustomOutputPathInput.value = dirPath;
        }
      } catch (error) {
        console.error('Error selecting extract output directory:', error);
        alert('Error selecting output directory: ' + error.message);
      }
    });
  }
  
  // Display selected files in the UI
  function displaySelectedFiles() {
    selectedFilesContainer.innerHTML = '';
    
    if (selectedFiles.length === 0) {
      selectedFilesContainer.innerHTML = '<p>No files selected</p>';
      return;
    }
    
    const list = document.createElement('ul');
    
    selectedFiles.forEach((file, index) => {
      const item = document.createElement('li');
      item.textContent = file;
      
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.classList.add('remove-file');
      removeBtn.addEventListener('click', () => {
        selectedFiles.splice(index, 1);
        displaySelectedFiles();
      });
      
      item.appendChild(removeBtn);
      list.appendChild(item);
    });
    
    selectedFilesContainer.appendChild(list);
  }

  function displayConvertSelectedFiles() {
    if (!convertSelectedFilesContainer) {
      return;
    }

    convertSelectedFilesContainer.innerHTML = '';

    if (convertSelectedFiles.length === 0) {
      convertSelectedFilesContainer.innerHTML = '<p>No files selected</p>';
      return;
    }

    const list = document.createElement('ul');

    convertSelectedFiles.forEach((file, index) => {
      const item = document.createElement('li');
      item.textContent = file;

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.classList.add('remove-file');
      removeBtn.addEventListener('click', () => {
        convertSelectedFiles.splice(index, 1);
        displayConvertSelectedFiles();
      });

      item.appendChild(removeBtn);
      list.appendChild(item);
    });

    convertSelectedFilesContainer.appendChild(list);
  }
  displayConvertSelectedFiles();

  function displayExtractSelectedFiles() {
    if (!extractSelectedFilesContainer) {
      return;
    }

    extractSelectedFilesContainer.innerHTML = '';

    if (extractSelectedFiles.length === 0) {
      extractSelectedFilesContainer.innerHTML = '<p>No files selected</p>';
      return;
    }

    const list = document.createElement('ul');

    extractSelectedFiles.forEach((file, index) => {
      const item = document.createElement('li');
      item.textContent = file;

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.classList.add('remove-file');
      removeBtn.addEventListener('click', () => {
        extractSelectedFiles.splice(index, 1);
        displayExtractSelectedFiles();
      });

      item.appendChild(removeBtn);
      list.appendChild(item);
    });

    extractSelectedFilesContainer.appendChild(list);
  }
  displayExtractSelectedFiles();
  
  // Get selected file extensions for filtering
  function getSelectedExtensions() {
    const extensions = [];
    if (document.getElementById('filter-m4a').checked) extensions.push('.m4a');
    if (document.getElementById('filter-mp3').checked) extensions.push('.mp3');
    if (document.getElementById('filter-wav').checked) extensions.push('.wav');
    if (document.getElementById('filter-aac').checked) extensions.push('.aac');
    return extensions;
  }

  function getConvertSelectedExtensions() {
    const extensions = [];
    if (document.getElementById('convert-filter-m4a').checked) extensions.push('.m4a');
    if (document.getElementById('convert-filter-mp3').checked) extensions.push('.mp3');
    if (document.getElementById('convert-filter-wav').checked) extensions.push('.wav');
    if (document.getElementById('convert-filter-aac').checked) extensions.push('.aac');
    return extensions;
  }

  function getExtractSelectedExtensions() {
    const extensions = [];
    if (document.getElementById('extract-filter-m4a').checked) extensions.push('.m4a');
    if (document.getElementById('extract-filter-mp3').checked) extensions.push('.mp3');
    if (document.getElementById('extract-filter-wav').checked) extensions.push('.wav');
    if (document.getElementById('extract-filter-aac').checked) extensions.push('.aac');
    if (document.getElementById('extract-filter-flac').checked) extensions.push('.flac');
    return extensions;
  }
  
  async function loadDirectoryFiles(showErrors = false) {
    if (!currentDirectoryPath) {
      if (showErrors) {
        alert('Please select a directory first');
      }
      return false;
    }
    
    try {
      const extensions = getSelectedExtensions();
      if (extensions.length === 0) {
        if (showErrors) {
          alert('Please select at least one file type');
        }
        return false;
      }
      
      const files = await window.api.getDirectoryFiles({
        directoryPath: currentDirectoryPath,
        extensions
      });
      
      if (files.length === 0) {
        if (showErrors) {
          alert(`No ${extensions.join(', ')} files found in the selected directory`);
        }
        return false;
      }
      
      selectedFiles = files;
      displaySelectedFiles();
      return true;
    } catch (error) {
      console.error('Error processing directory:', error);
      if (showErrors) {
        alert('Error processing directory: ' + error.message);
      }
      return false;
    }
  }

  async function loadConvertDirectoryFiles(showErrors = false) {
    if (!convertDirectoryPath) {
      if (showErrors) {
        alert('Please select a directory first');
      }
      return false;
    }

    try {
      const extensions = getConvertSelectedExtensions();
      if (extensions.length === 0) {
        if (showErrors) {
          alert('Please select at least one file type');
        }
        return false;
      }

      const files = await window.api.getDirectoryFiles({
        directoryPath: convertDirectoryPath,
        extensions
      });

      if (files.length === 0) {
        if (showErrors) {
          alert(`No ${extensions.join(', ')} files found in the selected directory`);
        }
        return false;
      }

      convertSelectedFiles = files;
      displayConvertSelectedFiles();
      return true;
    } catch (error) {
      console.error('Error loading convert directory:', error);
      if (showErrors) {
        alert('Error processing directory: ' + error.message);
      }
      return false;
    }
  }

  async function loadExtractDirectoryFiles(showErrors = false) {
    if (!extractDirectoryPath) {
      if (showErrors) {
        alert('Please select a directory first');
      }
      return false;
    }

    try {
      const extensions = getExtractSelectedExtensions();
      if (extensions.length === 0) {
        if (showErrors) {
          alert('Please select at least one file type');
        }
        return false;
      }

      const files = await window.api.getDirectoryFiles({
        directoryPath: extractDirectoryPath,
        extensions
      });

      if (files.length === 0) {
        if (showErrors) {
          alert(`No ${extensions.join(', ')} files found in the selected directory`);
        }
        return false;
      }

      extractSelectedFiles = files;
      displayExtractSelectedFiles();
      return true;
    } catch (error) {
      console.error('Error loading extract directory:', error);
      if (showErrors) {
        alert('Error processing directory: ' + error.message);
      }
      return false;
    }
  }

  function parseTimestamp(value) {
    if (typeof value !== 'string' || value.trim() === '') {
      return null;
    }

    const segments = value.trim().split(':').map(segment => segment.trim());
    if (segments.length === 0 || segments.length > 3) {
      return null;
    }

    const numbers = segments.map(Number);
    if (numbers.some(num => Number.isNaN(num) || num < 0)) {
      return null;
    }

    while (numbers.length < 3) {
      numbers.unshift(0);
    }

    const [hours, minutes, seconds] = numbers;
    if (minutes >= 60 || seconds >= 60) {
      return null;
    }

    return (hours * 3600) + (minutes * 60) + seconds;
  }

  function secondsToTimestamp(totalSeconds) {
    if (typeof totalSeconds !== 'number' || !Number.isFinite(totalSeconds)) {
      return '00:00:00';
    }

    const seconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [hours, minutes, remainingSeconds].map(part => String(part).padStart(2, '0'));
    return parts.join(':');
  }
  
  // Process all files in the selected directory
  processDirectoryBtn.addEventListener('click', async () => {
    await loadDirectoryFiles(true);
  });

  if (convertProcessDirectoryBtn) {
    convertProcessDirectoryBtn.addEventListener('click', async () => {
      await loadConvertDirectoryFiles(true);
    });
  }

  if (extractProcessDirectoryBtn) {
    extractProcessDirectoryBtn.addEventListener('click', async () => {
      await loadExtractDirectoryFiles(true);
    });
  }
  
  // Handle trim operation
  startTrimBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file to trim');
      return;
    }
    
    const startTime = document.getElementById('trim-start').value || '00:00:00';
    const durationInput = document.getElementById('trim-duration').value || '00:30:00';
    const durationType = document.getElementById('duration-type').value;
    const outputFormat = document.getElementById('output-format').value;
    const suffix = document.getElementById('output-suffix').value;
    const useCustomOutput = outputCustomRadio.checked;
    
    if (useCustomOutput && !customOutputPath) {
      alert('Please select an output directory when using custom output.');
      return;
    }
    
    // Calculate duration if using end time
    let duration = durationInput;
    if (durationType === 'end-time') {
      // Here you'd need to calculate the difference between end time and start time
      // This is a simplification
      duration = durationInput;
    }
    
    // Show progress
    progressContainer.classList.remove('hidden');
    progressBar.value = 0;
    progressText.textContent = '0%';
    
    try {
      const response = await window.api.trimAudio({
        files: selectedFiles,
        startTime,
        duration,
        outputFormat,
        suffix,
        outputDirectory: useCustomOutput ? customOutputPath : null
      });
      
      if (!response?.success) {
        throw new Error(response?.error || 'Unknown error while trimming files');
      }
      
      const results = response.results || [];
      
      // Hide progress
      progressContainer.classList.add('hidden');
      
      // Show success message
      alert(`Successfully processed ${results.length} files`);
    } catch (error) {
      console.error('Error trimming files:', error);
      alert('Error trimming files: ' + error.message);
      progressContainer.classList.add('hidden');
    }
  });

  if (startConvertBtn) {
    startConvertBtn.addEventListener('click', async () => {
      if (convertSelectedFiles.length === 0) {
        alert('Please select at least one file to convert');
        return;
      }

      const targetFormat = document.getElementById('convert-target-format').value;
      if (!targetFormat) {
        alert('Please select a target format');
        return;
      }

      const suffixInput = document.getElementById('convert-output-suffix').value;
      const suffix = typeof suffixInput === 'string' ? suffixInput : '';
      const useCustomOutput = convertOutputCustomRadio.checked;

      if (useCustomOutput && !convertCustomOutputPath) {
        alert('Please select an output directory when using custom output.');
        return;
      }

      if (convertProgressContainer) {
        convertProgressContainer.classList.remove('hidden');
        convertProgressBar.value = 0;
        convertProgressText.textContent = '0%';
      }

      try {
        const response = await window.api.convertFormat({
          files: convertSelectedFiles,
          targetFormat,
          suffix,
          outputDirectory: useCustomOutput ? convertCustomOutputPath : null
        });

        if (!response?.success) {
          throw new Error(response?.error || 'Unknown error while converting files');
        }

        alert(`Successfully converted ${response.results.length} files`);
      } catch (error) {
        console.error('Error converting files:', error);
        alert('Error converting files: ' + error.message);
      } finally {
        if (convertProgressContainer) {
          convertProgressContainer.classList.add('hidden');
        }
      }
    });
  }

  if (startExtractBtn) {
    startExtractBtn.addEventListener('click', async () => {
      if (extractSelectedFiles.length === 0) {
        alert('Please select at least one file to extract audio from');
        return;
      }

      const startTimeInput = document.getElementById('extract-start-time').value || '00:00:00';
      const endTimeInput = document.getElementById('extract-end-time').value || '';

      const startSeconds = parseTimestamp(startTimeInput);
      const endSeconds = parseTimestamp(endTimeInput);

      if (startSeconds === null) {
        alert('Please provide a valid start time in the format HH:MM:SS');
        return;
      }

      if (endSeconds === null) {
        alert('Please provide a valid end time in the format HH:MM:SS');
        return;
      }

      if (endSeconds <= startSeconds) {
        alert('End time must be later than start time');
        return;
      }

      const startTime = secondsToTimestamp(startSeconds);
      const duration = secondsToTimestamp(endSeconds - startSeconds);

      const outputFormat = document.getElementById('extract-output-format').value;
      if (!outputFormat) {
        alert('Please select an output format');
        return;
      }

      const audioCodecSelect = document.getElementById('extract-audio-codec');
      const audioCodec = audioCodecSelect ? audioCodecSelect.value : 'auto';
      const bitrateInput = document.getElementById('extract-bitrate');
      const sampleRateInput = document.getElementById('extract-sample-rate');
      const channelsInput = document.getElementById('extract-channels');
      const mapInput = document.getElementById('extract-map');
      const filtersInput = document.getElementById('extract-filters');

      const audioBitrate = bitrateInput ? bitrateInput.value.trim() : '';
      const sampleRateRaw = sampleRateInput ? sampleRateInput.value.trim() : '';
      const channelsRaw = channelsInput ? channelsInput.value.trim() : '';
      const audioTrack = mapInput ? mapInput.value.trim() : '';
      const audioFilters = filtersInput ? filtersInput.value.trim() : '';

      const sampleRate = sampleRateRaw !== '' && !Number.isNaN(Number(sampleRateRaw)) ? Number(sampleRateRaw) : null;
      const channels = channelsRaw !== '' && !Number.isNaN(Number(channelsRaw)) ? Number(channelsRaw) : null;

      const suffixInput = document.getElementById('extract-output-suffix').value;
      const suffix = typeof suffixInput === 'string' ? suffixInput : '';

      const useCustomOutput = extractOutputCustomRadio && extractOutputCustomRadio.checked;
      if (useCustomOutput && !extractCustomOutputPath) {
        alert('Please select an output directory when using custom output.');
        return;
      }

      if (extractProgressContainer) {
        extractProgressContainer.classList.remove('hidden');
        extractProgressBar.value = 0;
        extractProgressText.textContent = '0%';
      }

      try {
        const response = await window.api.extractAudio({
          files: extractSelectedFiles,
          startTime,
          duration,
          outputFormat,
          suffix,
          outputDirectory: useCustomOutput ? extractCustomOutputPath : null,
          audioCodec,
          audioBitrate: audioBitrate || null,
          sampleRate,
          channels,
          audioTrack: audioTrack || null,
          audioFilters: audioFilters || null
        });

        if (!response?.success) {
          throw new Error(response?.error || 'Unknown error while extracting audio');
        }

        alert(`Successfully extracted audio from ${response.results.length} files`);
      } catch (error) {
        console.error('Error extracting audio:', error);
        alert('Error extracting audio: ' + error.message);
      } finally {
        if (extractProgressContainer) {
          extractProgressContainer.classList.add('hidden');
        }
      }
    });
  }
}); 