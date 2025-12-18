let selectedFiles = [];

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const uploadBtn = document.getElementById('uploadBtn');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const uploadCard = document.getElementById('uploadCard');
const resultCard = document.getElementById('resultCard');

// Upload area click
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

// File input change
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

// Handle files
function handleFiles(files) {
    selectedFiles = [...selectedFiles, ...Array.from(files)];
    renderFileList();
    uploadBtn.disabled = selectedFiles.length === 0;
}

// Render file list
function renderFileList() {
    fileList.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const fileIcon = getFileIcon(file.type);
        const fileSize = formatFileSize(file.size);

        fileItem.innerHTML = `
      <div class="file-info">
        <div class="file-icon">${fileIcon}</div>
        <div class="file-details">
          <h4>${file.name}</h4>
          <div class="file-size">${fileSize}</div>
        </div>
      </div>
      <button class="remove-btn" onclick="removeFile(${index})">Remove</button>
    `;

        fileList.appendChild(fileItem);
    });
}

// Remove file
function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
    uploadBtn.disabled = selectedFiles.length === 0;
}

// Get file icon
function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📁';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Upload files
uploadBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    uploadBtn.disabled = true;
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';

    try {
        const formData = new FormData();

        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

        formData.append('expirationDays', document.getElementById('expirationDays').value);
        formData.append('language', document.getElementById('language').value);
        formData.append('brandName', document.getElementById('brandName').value);

        const password = document.getElementById('password').value;
        if (password) {
            formData.append('password', password);
        }

        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress <= 90) {
                progressFill.style.width = progress + '%';
            }
        }, 200);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        clearInterval(progressInterval);
        progressFill.style.width = '100%';

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }

        const result = await response.json();

        // Show result
        setTimeout(() => {
            showResult(result);
        }, 500);

    } catch (error) {
        console.error('Upload error:', error);
        showToast('Upload failed: ' + error.message, 'error');
        uploadBtn.disabled = false;
        progressBar.style.display = 'none';
    }
});

// Show result
function showResult(result) {
    document.getElementById('qrImage').src = result.qrCode;
    document.getElementById('shareUrlInput').value = result.shareUrl;
    document.getElementById('fileCount').textContent = result.fileCount;
    document.getElementById('totalSize').textContent = formatFileSize(result.totalSize);
    document.getElementById('expiresIn').textContent = document.getElementById('expirationDays').selectedOptions[0].text;

    uploadCard.style.display = 'none';
    resultCard.classList.add('active');

    showToast('QR code generated successfully!', 'success');
}

// Copy URL
document.getElementById('copyBtn').addEventListener('click', async () => {
    const urlInput = document.getElementById('shareUrlInput');

    try {
        await navigator.clipboard.writeText(urlInput.value);
        showToast('URL copied to clipboard!', 'success');
    } catch (error) {
        urlInput.select();
        document.execCommand('copy');
        showToast('URL copied to clipboard!', 'success');
    }
});

// Download QR Code
document.getElementById('downloadQrBtn').addEventListener('click', () => {
    const qrImage = document.getElementById('qrImage');
    const shareUrl = document.getElementById('shareUrlInput').value;
    const shareId = shareUrl.split('/').pop(); // Extract share ID from URL

    // Create download link
    const link = document.createElement('a');
    link.href = qrImage.src;
    link.download = `qr-code-${shareId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('QR code downloaded!', 'success');
});

// Show toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}
