// Multi-language support
const translations = {
    en: {
        loading: 'Loading your files...',
        ready: 'Ready to Download',
        downloadAll: 'Download All Files',
        filesReady: (count) => `${count} file${count !== 1 ? 's' : ''} ready`,
        downloading: 'Downloading...',
        success: 'Download complete!',
        error: 'Download failed. Please try again.',
        passwordRequired: 'This share is password protected.',
        unlock: 'Unlock Files',
        passwordError: 'Incorrect password. Please try again.'
    },
    es: {
        loading: 'Cargando tus archivos...',
        ready: 'Listo para Descargar',
        downloadAll: 'Descargar Todos los Archivos',
        filesReady: (count) => `${count} archivo${count !== 1 ? 's' : ''} listo${count !== 1 ? 's' : ''}`,
        downloading: 'Descargando...',
        success: '¡Descarga completa!',
        error: 'Error al descargar. Inténtalo de nuevo.',
        passwordRequired: 'Este recurso está protegido con contraseña.',
        unlock: 'Desbloquear Archivos',
        passwordError: 'Contraseña incorrecta. Inténtalo de nuevo.'
    },
    fr: {
        loading: 'Chargement de vos fichiers...',
        ready: 'Prêt à Télécharger',
        downloadAll: 'Télécharger Tous les Fichiers',
        filesReady: (count) => `${count} fichier${count !== 1 ? 's' : ''} prêt${count !== 1 ? 's' : ''}`,
        downloading: 'Téléchargement...',
        success: 'Téléchargement terminé!',
        error: 'Échec du téléchargement. Veuillez réessayer.',
        passwordRequired: 'Ce partage est protégé par mot de passe.',
        unlock: 'Déverrouiller les Fichiers',
        passwordError: 'Mot de passe incorrect. Veuillez réessayer.'
    },
    de: {
        loading: 'Ihre Dateien werden geladen...',
        ready: 'Bereit zum Herunterladen',
        downloadAll: 'Alle Dateien Herunterladen',
        filesReady: (count) => `${count} Datei${count !== 1 ? 'en' : ''} bereit`,
        downloading: 'Wird heruntergeladen...',
        success: 'Download abgeschlossen!',
        error: 'Download fehlgeschlagen. Bitte versuchen Sie es erneut.',
        passwordRequired: 'Diese Freigabe ist passwortgeschützt.',
        unlock: 'Dateien Entsperren',
        passwordError: 'Falsches Passwort. Bitte versuchen Sie es erneut.'
    },
    hi: {
        loading: 'आपकी फ़ाइलें लोड हो रही हैं...',
        ready: 'डाउनलोड के लिए तैयार',
        downloadAll: 'सभी फ़ाइलें डाउनलोड करें',
        filesReady: (count) => `${count} फ़ाइल${count !== 1 ? 'ें' : ''} तैयार`,
        downloading: 'डाउनलोड हो रहा है...',
        success: 'डाउनलोड पूर्ण!',
        error: 'डाउनलोड विफल। कृपया पुनः प्रयास करें।',
        passwordRequired: 'यह शेयर पासवर्ड से सुरक्षित है।',
        unlock: 'फ़ाइलें अनलॉक करें',
        passwordError: 'गलत पासवर्ड। कृपया पुनः प्रयास करें।'
    }
};

let currentLang = 'en';
let shareData = null;
let shareId = null;
let password = null;

// Get share ID from URL
const pathParts = window.location.pathname.split('/');
shareId = pathParts[pathParts.length - 1];

// Load share data
async function loadShare() {
    try {
        const response = await fetch(`/api/download/${shareId}`);

        if (!response.ok) {
            showError();
            return;
        }

        shareData = await response.json();
        currentLang = shareData.language || 'en';

        // Update branding
        document.getElementById('brandName').textContent = shareData.brandName;

        // Check if password required
        if (shareData.requiresPassword) {
            showPasswordPrompt();
        } else {
            showDownloadPage();
        }

    } catch (error) {
        console.error('Load error:', error);
        showError();
    }
}

// Show password prompt
function showPasswordPrompt() {
    document.getElementById('loadingCard').style.display = 'none';
    document.getElementById('passwordCard').style.display = 'block';

    const t = translations[currentLang];
    document.getElementById('headerText').textContent = t.passwordRequired;

    // Handle password submission
    document.getElementById('verifyBtn').addEventListener('click', verifyPassword);
    document.getElementById('passwordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') verifyPassword();
    });
}

// Verify password
async function verifyPassword() {
    const passwordInput = document.getElementById('passwordInput');
    password = passwordInput.value;

    if (!password) return;

    try {
        const response = await fetch(`/api/download/${shareId}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (response.ok) {
            showDownloadPage();
        } else {
            const t = translations[currentLang];
            document.getElementById('passwordError').textContent = t.passwordError;
            document.getElementById('passwordError').style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }

    } catch (error) {
        console.error('Verification error:', error);
        showToast('Verification failed', 'error');
    }
}

// Show download page
function showDownloadPage() {
    const t = translations[currentLang];

    document.getElementById('loadingCard').style.display = 'none';
    document.getElementById('passwordCard').style.display = 'none';
    document.getElementById('downloadCard').style.display = 'block';

    document.getElementById('headerText').textContent = t.ready;
    document.getElementById('downloadTitle').textContent = t.ready;
    document.getElementById('fileCountText').textContent = t.filesReady(shareData.fileCount);
    document.getElementById('downloadBtnText').textContent = t.downloadAll;

    // Render file list
    renderFileList();

    // Setup download button
    document.getElementById('downloadAllBtn').addEventListener('click', downloadAll);

    // AUTO-TRIGGER DOWNLOAD (works on Android/Desktop, requires tap on iOS)
    // Attempt automatic download after a short delay
    setTimeout(() => {
        const downloadBtn = document.getElementById('downloadAllBtn');

        // Try to trigger click programmatically (works on some browsers)
        if (navigator.userAgent.match(/Android/i) || !navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
            // Android or Desktop - trigger automatic download
            downloadBtn.click();
        } else {
            // iOS - show prominent message
            document.getElementById('downloadTitle').innerHTML = '👆 Tap Below to Download';
            document.getElementById('downloadTitle').style.color = '#6366f1';
            document.getElementById('downloadTitle').style.fontSize = '1.8rem';

            // Make button pulse to draw attention
            downloadBtn.style.animation = 'pulse 1.5s infinite';
        }
    }, 500);
}

// Render file list
function renderFileList() {
    const fileListContainer = document.getElementById('downloadFileList');
    fileListContainer.innerHTML = '<h3 style="margin-bottom: 1rem;">Files:</h3>';

    shareData.files.forEach((file, index) => {
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
      <button class="btn btn-primary" onclick="downloadFile(${file.id}, '${file.name}')" style="padding: 0.5rem 1rem; font-size: 0.9rem;">
        ⬇️ Download
      </button>
    `;

        fileListContainer.appendChild(fileItem);
    });
}

// Download all files
async function downloadAll() {
    const t = translations[currentLang];
    const downloadBtn = document.getElementById('downloadAllBtn');
    const progressBar = document.getElementById('downloadProgress');
    const progressFill = document.getElementById('downloadProgressFill');
    const statusText = document.getElementById('downloadStatus');

    downloadBtn.disabled = true;
    progressBar.style.display = 'block';
    statusText.textContent = t.downloading;

    try {
        // Build URL with password if needed
        let url = `/api/download/${shareId}/zip`;
        if (password) {
            url += `?password=${encodeURIComponent(password)}`;
        }

        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress <= 90) {
                progressFill.style.width = progress + '%';
            }
        }, 300);

        // Trigger download
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Download failed');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `files-${shareId}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);

        clearInterval(progressInterval);
        progressFill.style.width = '100%';
        statusText.textContent = t.success;

        setTimeout(() => {
            progressBar.style.display = 'none';
            downloadBtn.disabled = false;
        }, 2000);

        showToast(t.success, 'success');

    } catch (error) {
        console.error('Download error:', error);
        statusText.textContent = t.error;
        showToast(t.error, 'error');
        downloadBtn.disabled = false;
    }
}

// Download individual file
async function downloadFile(fileId, fileName) {
    try {
        let url = `/api/download/${shareId}/file/${fileId}`;
        if (password) {
            url += `?password=${encodeURIComponent(password)}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Download failed');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);

        showToast(`Downloaded: ${fileName}`, 'success');

    } catch (error) {
        console.error('Download error:', error);
        showToast('Download failed', 'error');
    }
}

// Show error
function showError() {
    document.getElementById('loadingCard').style.display = 'none';
    document.getElementById('errorCard').style.display = 'block';
}

// Utility functions
function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📁';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Initialize
loadShare();
