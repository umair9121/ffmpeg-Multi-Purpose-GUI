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
  
  // Directory selection elements
  const selectDirectoryBtn = document.getElementById('select-directory');
  const directoryPathInput = document.getElementById('directory-path');
  const processDirectoryBtn = document.getElementById('process-directory');
  const fileFilters = document.getElementById('file-filters');
  
  // Keep track of selected files
  let selectedFiles = [];
  
  let currentDirectoryPath = '';

  // Listen for trim progress updates from the main process
  if (window.api && typeof window.api.onTrimProgress === 'function') {
    window.api.onTrimProgress(({ percent }) => {
      const value = typeof percent === 'number' ? percent : 0;
      progressBar.value = value;
      progressText.textContent = `${Math.round(value)}%`;
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
  
  // Handle directory selection
  selectDirectoryBtn.addEventListener('click', async () => {
    try {
      const dirPath = await window.api.selectDirectory();
      if (dirPath) {
        currentDirectoryPath = dirPath;
        directoryPathInput.value = dirPath;
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      alert('Error selecting directory: ' + error.message);
    }
  });
  
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
  
  // Get selected file extensions for filtering
  function getSelectedExtensions() {
    const extensions = [];
    if (document.getElementById('filter-m4a').checked) extensions.push('.m4a');
    if (document.getElementById('filter-mp3').checked) extensions.push('.mp3');
    if (document.getElementById('filter-wav').checked) extensions.push('.wav');
    if (document.getElementById('filter-aac').checked) extensions.push('.aac');
    return extensions;
  }
  
  // Process all files in the selected directory
  processDirectoryBtn.addEventListener('click', async () => {
    if (!currentDirectoryPath) {
      alert('Please select a directory first');
      return;
    }
    
    try {
      const extensions = getSelectedExtensions();
      if (extensions.length === 0) {
        alert('Please select at least one file type');
        return;
      }
      
      const files = await window.api.getDirectoryFiles({
        directoryPath: currentDirectoryPath,
        extensions
      });
      
      if (files.length === 0) {
        alert(`No ${extensions.join(', ')} files found in the selected directory`);
        return;
      }
      
      selectedFiles = files;
      displaySelectedFiles();
    } catch (error) {
      console.error('Error processing directory:', error);
      alert('Error processing directory: ' + error.message);
    }
  });
  
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
        suffix
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
}); 