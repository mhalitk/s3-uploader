document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const fileNameSpan = document.getElementById("fileName");
  const uploadBtn = document.getElementById("uploadBtn");
  const presignedUrlInput = document.getElementById("presignedUrl");
  const presignedUrlShareInput = document.getElementById("presignedUrlShare");
  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const statusDiv = document.getElementById("status");
  const generateLinkBtn = document.getElementById("generateLinkBtn");
  const sharableLinkInput = document.getElementById("sharableLink");
  const tabUpload = document.getElementById("tab-upload");
  const tabShare = document.getElementById("tab-share");
  const tabUploadContent = document.getElementById("tab-upload-content");
  const tabShareContent = document.getElementById("tab-share-content");

  let selectedFile = null;

  // Tab switching logic
  tabUpload.addEventListener("click", () => {
    tabUpload.classList.add("active");
    tabShare.classList.remove("active");
    tabUploadContent.style.display = "";
    tabShareContent.style.display = "none";
  });
  tabShare.addEventListener("click", () => {
    tabShare.classList.add("active");
    tabUpload.classList.remove("active");
    tabShareContent.style.display = "";
    tabUploadContent.style.display = "none";
  });

  // Prefill presignedUrl from query string if present
  const params = new URLSearchParams(window.location.search);
  if (params.has("presigned_url")) {
    presignedUrlInput.value = params.get("presigned_url");
    if (presignedUrlShareInput) presignedUrlShareInput.value = params.get("presigned_url");
    updateUploadButtonState();
  }

  // Handle file selection
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      selectedFile = e.target.files[0];
      fileNameSpan.textContent = selectedFile.name;
      updateUploadButtonState();
    }
  });

  // Handle drag and drop
  const dropZone = document.querySelector(".file-upload-label");

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dropZone.classList.add("highlight");
  }

  function unhighlight() {
    dropZone.classList.remove("highlight");
  }

  dropZone.addEventListener("drop", handleDrop, false);

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

  presignedUrlInput.addEventListener("input", updateUploadButtonState);

  // Generate sharable link (from Share tab)
  generateLinkBtn.addEventListener("click", () => {
    const url = presignedUrlShareInput.value.trim();
    if (!url) {
      sharableLinkInput.value = "";
      sharableLinkInput.placeholder = "Enter a presigned URL first";
      return;
    }
    const base = window.location.origin + window.location.pathname;
    const shareUrl = `${base}?presigned_url=${encodeURIComponent(url)}`;
    sharableLinkInput.value = shareUrl;
    sharableLinkInput.select();
  });

  // Handle upload
  uploadBtn.addEventListener("click", handleUpload);

  async function handleUpload() {
    if (!selectedFile) {
      showStatus("Please select a file first", "error");
      return;
    }

    const presignedUrl = presignedUrlInput.value.trim();
    if (!presignedUrl) {
      showStatus("Please enter a valid presigned URL", "error");
      return;
    }

    uploadBtn.disabled = true;
    progressContainer.style.display = "block";
    statusDiv.style.display = "none";

    try {
      await uploadFile(selectedFile, presignedUrl);
      showStatus("File uploaded successfully!", "success");
      resetForm();
    } catch (error) {
      let errorMessage = `Upload failed`;
      try {
        errorMessage = error?.message || (await error?.text());
      } catch (e) {
        console.error("Error reading error response:", e);
      }
      showStatus(errorMessage, "error");
    } finally {
      uploadBtn.disabled = false;
    }
  }

  async function uploadFile(file, url, options = {}) {
    const maxAttempts = options.maxAttempts || 3;
    const retryDelayMs = options.retryDelayMs || 1000;
    let attempt = 0;
    let lastError = null;
    while (attempt < maxAttempts) {
      attempt++;
      try {
        if (attempt > 1) {
          showStatus(`Network error, retrying upload (attempt ${attempt} of ${maxAttempts})...`, "warning");
          await new Promise((res) => setTimeout(res, retryDelayMs * attempt));
        }
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", url, true);
          const contentType = file.type || "application/octet-stream";
          xhr.setRequestHeader("Content-Type", contentType);
          xhr.withCredentials = false;
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 100);
              updateProgress(percentComplete);
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr);
            } else {
              const error = new Error(`Upload failed with status ${xhr.status}`);
              error.status = xhr.status;
              reject(error);
            }
          };
          xhr.onerror = () => {
            reject(new Error("Network error during upload"));
          };
          xhr.onabort = () => {
            reject(new Error("Upload was aborted"));
          };
          try {
            xhr.send(file);
          } catch (error) {
            reject(error);
          }
        });
        return;
      } catch (error) {
        lastError = error;
        if (error?.status === 403) {
          error.message = "Upload failed: Access Denied";
        }
        if (error.message !== "Network error during upload" || attempt >= maxAttempts) {
          throw error;
        }
      }
    }
    throw lastError;
  }

  function updateProgress(percent) {
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = "status";
    statusDiv.classList.add(type);
    statusDiv.style.display = "block";
  }

  function resetForm() {
    selectedFile = null;
    fileInput.value = "";
    fileNameSpan.textContent = "Choose a file or drag it here";
    presignedUrlInput.value = "";
    progressContainer.style.display = "none";
    progressBar.style.width = "0%";
    progressText.textContent = "0%";
    updateUploadButtonState();
  }
});
