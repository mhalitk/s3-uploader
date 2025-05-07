document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const fileNameSpan = document.getElementById('fileName');
    const uploadBtn = document.getElementById('uploadBtn');
    const presignedUrlInput = document.getElementById('presignedUrl');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const statusDiv = document.getElementById('status');

    let selectedFile = null;

    // Handle file selection
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            fileNameSpan.textContent = selectedFile.name;
            updateUploadButtonState();
        }
    });

    // Handle drag and drop
    const dropZone = document.querySelector('.file-upload-label');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('highlight');
    }

    function unhighlight() {
        dropZone.classList.remove('highlight');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file) {
            selectedFile = file;
            fileInput.files = dt.files; // Set the file input's files
            fileNameSpan.textContent = file.name;
            updateUploadButtonState();
        }
    }


    // Update upload button state based on form validity
    function updateUploadButtonState() {
        uploadBtn.disabled = !(selectedFile && presignedUrlInput.validity.valid);
    }

    presignedUrlInput.addEventListener('input', updateUploadButtonState);

    // Handle upload
    uploadBtn.addEventListener('click', handleUpload);


    async function handleUpload() {
        if (!selectedFile) {
            showStatus('Please select a file first', 'error');
            return;
        }


        const presignedUrl = presignedUrlInput.value.trim();
        if (!presignedUrl) {
            showStatus('Please enter a valid presigned URL', 'error');
            return;
        }


        uploadBtn.disabled = true;
        progressContainer.style.display = 'block';
        statusDiv.style.display = 'none';

        try {
            const response = await uploadFile(selectedFile, presignedUrl);
            if (response.status >= 200 && response.status < 300) {
                showStatus('File uploaded successfully!', 'success');
                resetForm();
            } else {
                let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
                try {
                    const errorText = response.responseText || await response.text();
                    errorMessage += ` - ${errorText}`;
                } catch (e) {
                    console.error('Error reading error response:', e);
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Upload error:', error);
            showStatus(`Error: ${error.message}`, 'error');
        } finally {
            uploadBtn.disabled = false;
        }
    }

    function uploadFile(file, url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.open('PUT', url, true);

            // Set the content type explicitly
            const contentType = file.type || 'application/octet-stream';
            xhr.setRequestHeader('Content-Type', contentType);
            
            // Remove any headers that might interfere with the presigned URL
            // The presigned URL already contains all necessary authentication
            
            // Enable CORS if needed
            xhr.withCredentials = false;

            // Track upload progress
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    updateProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                console.log('Upload response status:', xhr.status);
                console.log('Response headers:', xhr.getAllResponseHeaders());
                
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr);
                } else {
                    const error = new Error(`Upload failed with status ${xhr.status}`);
                    error.status = xhr.status;
                    error.responseText = xhr.responseText;
                    reject(error);
                }
            };

            xhr.onerror = () => {
                console.error('Network error during upload');
                reject(new Error('Network error during upload'));
            };

            xhr.onabort = () => {
                console.error('Upload was aborted');
                reject(new Error('Upload was aborted'));
            };

            try {
                console.log('Starting upload with headers:', {
                    'Content-Type': contentType
                });
                xhr.send(file);
            } catch (error) {
                console.error('Error sending file:', error);
                reject(error);
            }
        });
    }

    function updateProgress(percent) {
        progressBar.style.width = `${percent}%`;
        progressText.textContent = `${percent}%`;
    }

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = 'status';
        statusDiv.classList.add(type);
        statusDiv.style.display = 'block';
    }

    function resetForm() {
        selectedFile = null;
        fileInput.value = '';
        fileNameSpan.textContent = 'Choose a file or drag it here';
        presignedUrlInput.value = '';
        progressContainer.style.display = 'none';
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        updateUploadButtonState();
    }
});
