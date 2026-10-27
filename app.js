import { isUrl, analyzeUrl } from './analyzer.js';

// Shorteners list for redirection checks
const SHORTENED_DOMAINS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'rebrand.ly', 'is.gd', 
  'buff.ly', 'adf.ly', 'ow.ly', 't.me', 'shorte.st', 'cutt.ly', 
  'lnky.in', 'lnk.to', 'short.io', 'tiny.cc', 'qr.ae', 'rb.gy', 'bit.do'
];

// Application State
const state = {
  activeSection: 'scan-section', // 'scan-section' or 'generate-section'
  activeTab: 'view-camera',
  html5QrCode: null,
  isScanning: false,
  scanHistory: JSON.parse(localStorage.getItem('qr_safety_history') || '[]'),
  
  // Generator State
  qrCodeInstance: null,
  logoBase64: null,
  
  // PDF Export Cache
  lastAnalysisResult: null
};

// DOM References
const DOM = {
  // Navigation
  navTabs: document.querySelectorAll('.nav-tab'),
  navSections: document.querySelectorAll('.nav-section'),
  
  // Scanner Tabs and views
  tabs: document.querySelectorAll('.tab-btn'),
  views: document.querySelectorAll('.scan-content-view'),
  
  // Camera Elements
  cameraContainer: document.getElementById('camera-container'),
  cameraPlaceholder: document.getElementById('camera-placeholder'),
  cameraControls: document.getElementById('camera-controls'),
  cameraSelect: document.getElementById('camera-select'),
  startCameraBtn: document.getElementById('start-camera-btn'),
  stopCameraBtn: document.getElementById('stop-camera-btn'),
  
  // File Upload Elements
  uploadDropzone: document.getElementById('upload-dropzone'),
  fileInput: document.getElementById('file-input'),
  browseFilesBtn: document.getElementById('browse-files-btn'),
  
  // Manual Input Elements
  urlInput: document.getElementById('url-input'),
  checkUrlBtn: document.getElementById('check-url-btn'),
  
  // Results Panel Elements
  resultsDashboard: document.getElementById('results-dashboard'),
  stateIdle: document.getElementById('state-idle'),
  stateLoading: document.getElementById('state-loading'),
  stateAnalysis: document.getElementById('state-analysis'),
  loadingHeader: document.getElementById('loading-header-text'),
  loadingSubText: document.getElementById('loading-sub-text'),
  
  // Analysis Output
  analysisOverview: document.getElementById('analysis-overview'),
  riskGauge: document.getElementById('risk-gauge'),
  scoreNumber: document.getElementById('score-number'),
  statusBadge: document.getElementById('status-badge'),
  statusMessage: document.getElementById('status-message'),
  decodedPayloadText: document.getElementById('decoded-payload-text'),
  copyPayloadBtn: document.getElementById('copy-payload-btn'),
  visitSiteBtn: document.getElementById('visit-site-btn'),
  downloadPdfBtn: document.getElementById('download-pdf-btn'),
  resetBtn: document.getElementById('reset-btn'),
  findingsList: document.getElementById('findings-list'),
  

  // History Elements
  historyGrid: document.getElementById('history-grid'),
  clearHistoryBtn: document.getElementById('clear-history-btn'),
  
  // --- Generator Elements ---
  genUrlInput: document.getElementById('gen-url-input'),
  genDotsStyle: document.getElementById('gen-dots-style'),
  genDotsColor: document.getElementById('gen-dots-color'),
  genBgColor: document.getElementById('gen-bg-color'),
  genBgTransparent: document.getElementById('gen-bg-transparent'),
  genCornersSquareStyle: document.getElementById('gen-corners-square-style'),
  genCornersDotStyle: document.getElementById('gen-corners-dot-style'),
  genCornersSquareColor: document.getElementById('gen-corners-square-color'),
  genCornersDotColor: document.getElementById('gen-corners-dot-color'),
  
  // Logo
  logoUploadBtn: document.getElementById('logo-upload-btn'),
  logoFileInput: document.getElementById('logo-file-input'),
  logoStatusRow: document.getElementById('logo-status-row'),
  logoFilename: document.getElementById('logo-filename'),
  logoRemoveBtn: document.getElementById('logo-remove-btn'),
  logoSliders: document.getElementById('logo-sliders'),
  genLogoSize: document.getElementById('gen-logo-size'),
  genLogoMargin: document.getElementById('gen-logo-margin'),
  logoSizeVal: document.getElementById('logo-size-val'),
  logoMarginVal: document.getElementById('logo-margin-val'),
  
  // Preview and Download
  genSafetyAlert: document.getElementById('gen-safety-alert'),
  genSafetyIcon: document.getElementById('gen-safety-icon'),
  genSafetyTitle: document.getElementById('gen-safety-title'),
  genSafetyDesc: document.getElementById('gen-safety-desc'),
  genSafetyScore: document.getElementById('gen-safety-score'),
  generatorCanvas: document.getElementById('generator-canvas'),
  downloadPngBtn: document.getElementById('download-png-btn'),
  downloadSvgBtn: document.getElementById('download-svg-btn'),
  
  // Decryption State
  stateDecrypt: document.getElementById('state-decrypt'),
  decryptPasswordInput: document.getElementById('decrypt-password-input'),
  decryptSubmitBtn: document.getElementById('decrypt-submit-btn'),
  decryptCancelBtn: document.getElementById('decrypt-cancel-btn'),
  
  // Visual Sandbox
  sandboxPreviewContainer: document.getElementById('sandbox-preview-container'),
  sandboxScreenshot: document.getElementById('sandbox-screenshot'),
  sandboxLoader: document.getElementById('sandbox-loader'),
  sandboxError: document.getElementById('sandbox-error'),
  
  // Generator Encryption
  genEncryptToggle: document.getElementById('gen-encrypt-toggle'),
  genEncryptPasswordGroup: document.getElementById('gen-encrypt-password-group'),
  genEncryptPassword: document.getElementById('gen-encrypt-password'),
  decodedLinkBox: document.getElementById('decoded-link-box')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTopNavigation();
  initTabs();
  initCameraEvents();
  initUploadEvents();
  initManualEvents();
  initResultsEvents();
  renderHistory();
  
  // Generator Initialization
  initGeneratorAccordion();
  initGeneratorEvents();
  initQRCodeInstance();
  
  // Initialize Lucide Icons
  lucide.createIcons();
});

// --- Top Navigation Controller ---
function initTopNavigation() {
  DOM.navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetSectionId = tab.getAttribute('data-nav');
      
      DOM.navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      DOM.navSections.forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
      });
      
      const targetSec = document.getElementById(targetSectionId);
      targetSec.classList.add('active');
      targetSec.style.display = 'block';
      
      // Stop scanner if leaving scanning panel
      if (state.activeSection === 'scan-section' && targetSectionId !== 'scan-section') {
        stopCameraScanner();
      }
      
      state.activeSection = targetSectionId;
      
      if (targetSectionId === 'scan-section') {
        resetCameraUI();
      } else {
        // Redraw QR once opened to ensure proper canvas calculations
        updateGeneratedQR();
      }
    });
  });
}

// --- Tab Controller (Scanner Modes) ---
function initTabs() {
  DOM.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetViewId = tab.getAttribute('data-tab');
      if (!targetViewId) return;
      
      DOM.tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      DOM.views.forEach(v => v.classList.remove('active'));
      document.getElementById(targetViewId).classList.add('active');
      
      if (state.activeTab === 'view-camera' && targetViewId !== 'view-camera') {
        stopCameraScanner();
      }
      
      state.activeTab = targetViewId;
      
      if (targetViewId === 'view-camera') {
        resetCameraUI();
      }
    });
  });
}

// --- Camera Scanner Logic ---
function initCameraEvents() {
  DOM.startCameraBtn.addEventListener('click', startCameraScanner);
  DOM.stopCameraBtn.addEventListener('click', stopCameraScanner);
  DOM.cameraSelect.addEventListener('change', () => {
    if (state.isScanning) {
      stopCameraScanner().then(() => {
        startScanning(DOM.cameraSelect.value);
      });
    }
  });
}

function resetCameraUI() {
  DOM.cameraPlaceholder.style.display = 'flex';
  DOM.cameraControls.style.display = 'none';
  DOM.cameraContainer.classList.remove('active-stream');
}

function startCameraScanner() {
  if (state.isScanning) return;
  
  showState('idle');
  DOM.cameraPlaceholder.style.display = 'none';
  DOM.cameraControls.style.display = 'flex';
  
  state.html5QrCode = new Html5Qrcode("reader");
  
  Html5Qrcode.getCameras().then(devices => {
    DOM.cameraSelect.innerHTML = '';
    
    if (devices && devices.length > 0) {
      devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.id;
        option.text = device.label || `Camera ${DOM.cameraSelect.length + 1}`;
        DOM.cameraSelect.appendChild(option);
      });
      
      if (devices.length > 1) {
        DOM.cameraSelect.style.display = 'block';
      } else {
        DOM.cameraSelect.style.display = 'none';
      }
      
      const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
      const cameraId = backCamera ? backCamera.id : devices[0].id;
      DOM.cameraSelect.value = cameraId;
      
      startScanning(cameraId);
    } else {
      startScanning({ facingMode: "environment" });
    }
  }).catch(err => {
    console.warn("Failed to list cameras, attempting environment fallback", err);
    startScanning({ facingMode: "environment" });
  });
}

function startScanning(cameraConfig) {
  showState('idle');
  
  state.html5QrCode.start(
    cameraConfig,
    {
      fps: 15,
      qrbox: (width, height) => {
        const minEdge = Math.min(width, height);
        const qrboxSize = Math.floor(minEdge * 0.65);
        return { width: qrboxSize, height: qrboxSize };
      }
    },
    (decodedText) => {
      stopCameraScanner();
      handleScanSuccess(decodedText);
    },
    () => {}
  ).then(() => {
    state.isScanning = true;
    DOM.cameraContainer.classList.add('active-stream');
  }).catch(err => {
    console.error("Camera scanner start failed:", err);
    alert("Could not start camera scanner. Please grant permission and refresh.");
    resetCameraUI();
  });
}

function stopCameraScanner() {
  if (!state.isScanning || !state.html5QrCode) {
    resetCameraUI();
    return Promise.resolve();
  }
  
  return state.html5QrCode.stop().then(() => {
    state.isScanning = false;
    state.html5QrCode = null;
    resetCameraUI();
  }).catch(err => {
    console.error("Error stopping scanner:", err);
    resetCameraUI();
  });
}

// --- Image File Upload Logic ---
function initUploadEvents() {
  const dropzone = DOM.uploadDropzone;
  
  DOM.browseFilesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.fileInput.click();
  });
  
  dropzone.addEventListener('click', () => {
    DOM.fileInput.click();
  });
  
  DOM.fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });
  
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    }, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    }, false);
  });
  
  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  });
}

function handleFileUpload(file) {
  if (!file) return;
  
  DOM.loadingHeader.textContent = 'Decoding Data';
  DOM.loadingSubText.textContent = 'Analyzing link heuristics and scoring threat factors...';
  showState('loading');
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const maxDim = 1024;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth"
        });
        
        if (code) {
          handleScanSuccess(code.data);
        } else {
          console.warn("jsQR could not find a QR code, trying html5-qrcode fallback...");
          fallbackScanFile(file);
        }
      } catch (err) {
        console.error("jsQR processing error, running html5-qrcode fallback:", err);
        fallbackScanFile(file);
      }
    };
    img.onerror = function() {
      alert("Failed to load the image file.");
      showState('idle');
    };
    img.src = e.target.result;
  };
  reader.onerror = function() {
    alert("Failed to read the file.");
    showState('idle');
  };
  reader.readAsDataURL(file);
}

function fallbackScanFile(file) {
  const tempScanner = new Html5Qrcode("reader");
  tempScanner.scanFile(file, false)
    .then(decodedText => {
      tempScanner.clear();
      handleScanSuccess(decodedText);
    })
    .catch(err => {
      console.warn("Fallback file scanning failed:", err);
      tempScanner.clear();
      alert("No valid QR code was detected in this image. Please make sure the QR code is clear and well-lit.");
      showState('idle');
    });
}

// --- Manual Input URL Logic ---
function initManualEvents() {
  DOM.checkUrlBtn.addEventListener('click', handleManualUrlCheck);
  DOM.urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleManualUrlCheck();
    }
  });
}

function handleManualUrlCheck() {
  const urlVal = DOM.urlInput.value.trim();
  if (!urlVal) {
    alert("Please enter a URL to check.");
    return;
  }
  
  DOM.loadingHeader.textContent = 'Decoding Data';
  DOM.loadingSubText.textContent = 'Analyzing link heuristics and scoring threat factors...';
  showState('loading');
  setTimeout(() => {
    handleScanSuccess(urlVal);
  }, 600);
}

// --- Redirect Unshortening resolver ---
async function unshortenUrl(shortUrl) {
  // Method 1: Direct proxy trace (corsproxy.io respects redirects and returns final url in response.url)
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(shortUrl)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
    
    const response = await fetch(proxyUrl, {
      method: 'HEAD',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (response.url && response.url !== proxyUrl) {
      // Extract target url if corsproxy wrapper is appended
      const targetUrl = response.url.replace('https://corsproxy.io/?', '');
      const decodedTarget = decodeURIComponent(targetUrl);
      if (isUrl(decodedTarget)) {
        return decodedTarget;
      }
    }
  } catch (err) {
    console.warn("Direct proxy resolution failed, trying API fallback", err);
  }
  
  // Method 2: unshorten.me public API (proxied to resolve CORS)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const apiCall = `https://unshorten.me/api/v2/unshorten?url=${encodeURIComponent(shortUrl)}`;
    
    const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(apiCall)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    if (data.success && data.resolved_url) {
      return data.resolved_url;
    }
  } catch (err) {
    console.error("All unshortening methods failed:", err);
  }
  
  return null;
}

// --- Results Management ---
function initResultsEvents() {
  DOM.copyPayloadBtn.addEventListener('click', () => {
    const text = DOM.decodedPayloadText.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const copyIcon = DOM.copyPayloadBtn.querySelector('i') || DOM.copyPayloadBtn.querySelector('svg');
      copyIcon.setAttribute('data-lucide', 'check');
      DOM.copyPayloadBtn.style.color = 'var(--color-safe)';
      lucide.createIcons();
      
      setTimeout(() => {
        copyIcon.setAttribute('data-lucide', 'copy');
        DOM.copyPayloadBtn.style.color = '';
        lucide.createIcons();
      }, 2000);
    });
  });
  
  DOM.visitSiteBtn.addEventListener('click', (e) => {
    const score = parseInt(DOM.scoreNumber.textContent, 10);
    if (score >= 20) {
      const confirmProceed = confirm(
        `⚠️ SECURITY WARNING!\n\nThis website has a threat score of ${score}/100 and is flagged as ${score >= 50 ? 'DANGEROUS' : 'SUSPICIOUS'}.\n\nVisiting this link could expose you to phishing, credential theft, or malware.\n\nDo you still wish to open this link?`
      );
      if (!confirmProceed) {
        e.preventDefault();
      }
    }
  });
  
  DOM.resetBtn.addEventListener('click', () => {
    showState('idle');
    DOM.urlInput.value = '';
    state.lastAnalysisResult = null;
  });
  
  DOM.downloadPdfBtn.addEventListener('click', () => {
    if (state.lastAnalysisResult) {
      generatePdfReport(state.lastAnalysisResult);
    } else {
      alert("No diagnostic data available to export.");
    }
  });
  
  DOM.clearHistoryBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear your local scan history?")) {
      state.scanHistory = [];
      localStorage.removeItem('qr_safety_history');
      renderHistory();
    }
  });

}

function showState(stateName) {
  DOM.stateIdle.classList.remove('active');
  DOM.stateLoading.classList.remove('active');
  DOM.stateAnalysis.classList.remove('active');
  DOM.stateDecrypt.classList.remove('active');
  DOM.stateDecrypt.style.display = 'none';
  
  if (stateName === 'idle') DOM.stateIdle.classList.add('active');
  if (stateName === 'loading') DOM.stateLoading.classList.add('active');
  if (stateName === 'analysis') DOM.stateAnalysis.classList.add('active');
  if (stateName === 'decrypt') {
    DOM.stateDecrypt.classList.add('active');
    DOM.stateDecrypt.style.display = 'flex';
  }
}

async function handleScanSuccess(payload) {
  // Check if payload is password encrypted
  if (payload.startsWith("AES-QR:")) {
    const ciphertext = payload.substring(7);
    showState('decrypt');
    
    DOM.decryptSubmitBtn.onclick = () => {
      const password = DOM.decryptPasswordInput.value;
      if (!password) {
        alert("Please enter the decryption password.");
        return;
      }
      
      try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, password);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        
        if (decryptedText) {
          DOM.decryptPasswordInput.value = '';
          handleScanSuccess(decryptedText);
        } else {
          alert("Incorrect password. Please try again.");
        }
      } catch (err) {
        console.error("AES Decryption Error:", err);
        alert("Decryption failed. Please check the password and try again.");
      }
    };
    
    DOM.decryptCancelBtn.onclick = () => {
      DOM.decryptPasswordInput.value = '';
      showState('idle');
    };
    
    lucide.createIcons();
    return;
  }
  let isPayloadUrl = isUrl(payload);
  
  if (isPayloadUrl) {
    const hostname = new URL(payload).hostname.toLowerCase();
    
    // Check if shortened link
    let isShortener = false;
    for (const shortener of SHORTENED_DOMAINS) {
      if (hostname === shortener || hostname.endsWith('.' + shortener)) {
        isShortener = true;
        break;
      }
    }
    
    if (isShortener) {
      DOM.loadingHeader.textContent = 'Resolving Link';
      DOM.loadingSubText.textContent = 'Traced shortened URL. Expanding destination...';
      showState('loading');
      
      const resolvedUrl = await unshortenUrl(payload);
      
      if (resolvedUrl && isUrl(resolvedUrl)) {
        const analysisResult = analyzeUrl(resolvedUrl);
        // Inject unshorten tracking details
        analysisResult.findings.unshift({
          type: 'redirect_traced',
          severity: 'low',
          message: 'Redirect Traced: Shortener expanded successfully.',
          tip: `Original Link: ${payload} -> Resolved Destination: ${resolvedUrl}`
        });
        displayAnalysis(analysisResult, true);
        addToHistory(resolvedUrl, true, analysisResult.score, analysisResult.status);
        return;
      } else {
        const analysisResult = analyzeUrl(payload);
        analysisResult.findings.unshift({
          type: 'redirect_failed',
          severity: 'medium',
          message: 'Redirect resolution failed.',
          tip: 'This is a shortened URL, but we could not securely resolve its destination. Proceed with absolute caution.'
        });
        displayAnalysis(analysisResult, true);
        addToHistory(payload, true, analysisResult.score, analysisResult.status);
        return;
      }
    } else {
      // Normal URL analysis (not shortened)
      const analysisResult = analyzeUrl(payload);
      displayAnalysis(analysisResult, true);
      addToHistory(payload, true, analysisResult.score, analysisResult.status);
      return;
    }
  }
  
  // Normal plain text heuristics check
  const analysisResult = {
    url: payload,
    score: 0,
    status: 'safe',
    findings: [
      {
        type: 'plain_text',
        severity: 'pass',
        message: 'The payload contains text, not a website link.',
        tip: 'Since this is not a link, opening it will not expose you to browser redirects or web exploits.'
      }
    ]
  };
  
  displayAnalysis(analysisResult, isPayloadUrl);
  addToHistory(payload, isPayloadUrl, analysisResult.score, analysisResult.status);
}

function displayAnalysis(result, isPayloadUrl) {
  state.lastAnalysisResult = result;
  showState('analysis');  // Decoded panel vs Wi-Fi card routing
  DOM.decodedLinkBox.style.display = 'block';
    
    DOM.decodedPayloadText.textContent = result.url;
    
    if (isPayloadUrl) {
      DOM.visitSiteBtn.style.display = 'inline-flex';
      DOM.visitSiteBtn.href = result.url;
    } else {
      DOM.visitSiteBtn.style.display = 'none';
    }

    // Handle Visual Sandbox Preview
    if (isPayloadUrl) {
      DOM.sandboxPreviewContainer.style.display = 'block';
      DOM.sandboxLoader.style.display = 'flex';
      DOM.sandboxScreenshot.style.display = 'none';
      DOM.sandboxError.style.display = 'none';
      
      const screenshotUrl = `https://api.microlink.io?url=${encodeURIComponent(result.url)}&screenshot=true&embed=screenshot.url`;
      DOM.sandboxScreenshot.src = screenshotUrl;
      
      DOM.sandboxScreenshot.onload = () => {
        DOM.sandboxLoader.style.display = 'none';
        DOM.sandboxScreenshot.style.display = 'block';
      };
      
      DOM.sandboxScreenshot.onerror = () => {
        DOM.sandboxLoader.style.display = 'none';
        DOM.sandboxError.style.display = 'block';
      };
    } else {
      DOM.sandboxPreviewContainer.style.display = 'none';
    }

  DOM.analysisOverview.className = 'analysis-overview';
  DOM.analysisOverview.classList.add(`status-${result.status}`);
  DOM.statusBadge.textContent = result.status;
  
  if (result.status === 'safe') {
    DOM.statusMessage.textContent = isPayloadUrl 
      ? 'This URL shows no suspicious characteristics and appears safe.'
      : 'This QR code contains plain text data.';
  } else if (result.status === 'suspicious') {
    DOM.statusMessage.textContent = 'Caution: This link triggers safety warning flags. Review details below.';
  } else if (result.status === 'danger') {
    DOM.statusMessage.textContent = 'Warning: This link displays strong signatures of a phishing or malicious portal!';
  } else if (result.status === 'invalid') {
    DOM.statusMessage.textContent = 'Invalid content. This payload could not be checked.';
  }
  
  DOM.scoreNumber.textContent = result.score;
  const radius = DOM.riskGauge.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (result.score / 100) * circumference;
  DOM.riskGauge.style.strokeDashoffset = offset;
  
  DOM.findingsList.innerHTML = '';
  
  // Sort findings: high severity -> medium -> low -> pass
  const severityOrder = { 'high': 0, 'medium': 1, 'low': 2, 'pass': 3 };
  const sortedFindings = [...result.findings].sort((a, b) => {
    return (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
  });
  
  sortedFindings.forEach(finding => {
    let iconName = 'alert-triangle';
    if (finding.severity === 'high') iconName = 'shield-alert';
    if (finding.severity === 'medium') iconName = 'alert-triangle';
    if (finding.severity === 'low') iconName = 'info';
    if (finding.severity === 'pass') iconName = 'check-circle';
    
    if (finding.type === 'redirect_traced') {
      iconName = 'git-pull-request';

    }
    
    const card = document.createElement('div');
    card.className = `finding-item severity-${finding.finding_severity || finding.severity}`;
    card.innerHTML = `
      <i data-lucide="${iconName}" class="finding-icon" size="18"></i>
      <div class="finding-content">
        <div class="finding-msg">${finding.message}</div>
        <div class="finding-tip">${finding.tip || ''}</div>
      </div>
    `;
    DOM.findingsList.appendChild(card);
  });
  
  lucide.createIcons();
}

// --- Local History ---
function addToHistory(payload, isPayloadUrl, score, status) {
  if (state.scanHistory.length > 0 && state.scanHistory[0].payload === payload) {
    return;
  }
  
  const newItem = {
    id: Date.now(),
    payload: payload,
    isUrl: isPayloadUrl,
    score: score,
    status: status,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  
  state.scanHistory.unshift(newItem);
  
  if (state.scanHistory.length > 10) {
    state.scanHistory.pop();
  }
  
  localStorage.setItem('qr_safety_history', JSON.stringify(state.scanHistory));
  renderHistory();
}

function renderHistory() {
  const container = DOM.historyGrid;
  container.innerHTML = '';
  
  if (state.scanHistory.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        Your scan history will appear here. No scans saved yet.
      </div>
    `;
    return;
  }
  
  state.scanHistory.forEach(item => {
    const card = document.createElement('div');
    card.className = 'history-item';
    card.addEventListener('click', () => {
      let result;
      if (item.isUrl) {
        result = analyzeUrl(item.payload);
      } else {
        result = {
          url: item.payload,
          score: 0,
          status: 'safe',
          findings: [
            {
              type: 'plain_text',
              severity: 'pass',
              message: 'The payload contains text, not a website link.',
              tip: 'Since this is not a link, opening it will not expose you to browser redirects or web exploits.'
            }
          ]
        };
      }
      displayAnalysis(result, item.isUrl);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    card.innerHTML = `
      <div class="history-details">
        <div class="history-link">${escapeHtml(item.payload)}</div>
        <div class="history-meta">
          <span>${item.timestamp}</span>
          <span class="history-badge badge-${item.status}">${item.status}</span>
        </div>
      </div>
      <div class="history-score" style="color: var(--color-${item.status === 'safe' ? 'safe' : item.status === 'suspicious' ? 'suspicious' : 'danger'});">
        ${item.score}
      </div>
    `;
    
    container.appendChild(card);
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==========================================
//    SECURE QR CODE GENERATOR SECTION
// ==========================================

// Accordion styling control
function initGeneratorAccordion() {
  const headers = document.querySelectorAll('.accordion-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const parent = header.parentElement;
      const isActive = parent.classList.contains('active');
      
      // Close all sections
      document.querySelectorAll('.accordion-group').forEach(group => {
        group.classList.remove('active');
      });
      
      // If was not active, open it
      if (!isActive) {
        parent.classList.add('active');
      }
    });
  });
}

function initQRCodeInstance() {
  if (typeof QRCodeStyling === 'undefined') {
    console.error("QRCodeStyling library is not loaded. Check CDN connections.");
    alert("Warning: The QR Code styling generator library failed to load. Please check your internet connection and refresh.");
    return;
  }
  
  // Initialize default styling
  state.qrCodeInstance = new QRCodeStyling({
    width: 230,
    height: 230,
    type: "svg",
    data: "https://qr-safety.local",
    dotsOptions: {
      color: "#6366f1",
      type: "square"
    },
    backgroundOptions: {
      color: "#ffffff",
    },
    cornersSquareOptions: {
      color: "#6366f1",
      type: "square"
    },
    cornersDotOptions: {
      color: "#6366f1",
      type: "square"
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 5
    }
  });
  
  DOM.generatorCanvas.innerHTML = '';
  state.qrCodeInstance.append(DOM.generatorCanvas);
}

function initGeneratorEvents() {
  // Setup inputs updates
  const inputs = [
    DOM.genUrlInput, DOM.genDotsStyle, DOM.genDotsColor, 
    DOM.genBgColor, DOM.genBgTransparent, DOM.genCornersSquareStyle, 
    DOM.genCornersDotStyle, DOM.genCornersSquareColor, DOM.genCornersDotColor,
    DOM.genLogoSize, DOM.genLogoMargin
  ];
  
  inputs.filter(Boolean).forEach(input => {
    input.addEventListener('input', updateGeneratedQR);
    input.addEventListener('change', updateGeneratedQR);
  });

  // Custom Color pickers labels updating
  [DOM.genDotsColor, DOM.genBgColor, DOM.genCornersSquareColor, DOM.genCornersDotColor].forEach(picker => {
    picker.addEventListener('input', (e) => {
      const parent = e.target.closest('.color-picker-wrapper');
      if (parent) {
        const textHex = parent.querySelector('.color-hex');
        if (textHex) textHex.textContent = e.target.value;
      }
    });
  });
  
  // Transparent bg visibility toggle
  DOM.genBgTransparent.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.getElementById('bg-color-group').style.opacity = '0.35';
      document.getElementById('bg-color-group').style.pointerEvents = 'none';
    } else {
      document.getElementById('bg-color-group').style.opacity = '1';
      document.getElementById('bg-color-group').style.pointerEvents = 'auto';
    }
  });

  // Slider text updates
  DOM.genLogoSize.addEventListener('input', (e) => {
    DOM.logoSizeVal.textContent = `${Math.round(e.target.value * 100)}%`;
  });
  
  DOM.genLogoMargin.addEventListener('input', (e) => {
    DOM.logoMarginVal.textContent = `${e.target.value}px`;
  });
  
  // Logo selection
  DOM.logoUploadBtn.addEventListener('click', () => {
    DOM.logoFileInput.click();
  });
  
  DOM.logoFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      DOM.logoFilename.textContent = file.name;
      
      const reader = new FileReader();
      reader.onload = function(event) {
        state.logoBase64 = event.target.result;
        DOM.logoStatusRow.style.display = 'flex';
        DOM.logoSliders.style.display = 'block';
        updateGeneratedQR();
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Logo removal
  DOM.logoRemoveBtn.addEventListener('click', () => {
    state.logoBase64 = null;
    DOM.logoFileInput.value = '';
    DOM.logoStatusRow.style.display = 'none';
    DOM.logoSliders.style.display = 'none';
    DOM.logoFilename.textContent = 'No logo loaded';
    updateGeneratedQR();
  });
  
  // Download buttons
  DOM.downloadPngBtn.addEventListener('click', () => {
    const targetUrl = DOM.genUrlInput ? (DOM.genUrlInput.value.trim() || 'qr-code') : 'qr-code';
    const parsedName = targetUrl.replace(/https?:\/\/(www\.)?/, '').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 15);
    state.qrCodeInstance.download({ name: `qr-safety-${parsedName || 'code'}`, extension: 'png' });
  });
  
  DOM.downloadSvgBtn.addEventListener('click', () => {
    const targetUrl = DOM.genUrlInput ? (DOM.genUrlInput.value.trim() || 'qr-code') : 'qr-code';
    const parsedName = targetUrl.replace(/https?:\/\/(www\.)?/, '').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 15);
    state.qrCodeInstance.download({ name: `qr-safety-${parsedName || 'code'}`, extension: 'svg' });
  });
  
  // Encryption toggles
  DOM.genEncryptToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      DOM.genEncryptPasswordGroup.style.display = 'block';
    } else {
      DOM.genEncryptPasswordGroup.style.display = 'none';
      DOM.genEncryptPassword.value = '';
    }
    updateGeneratedQR();
  });
  
  DOM.genEncryptPassword.addEventListener('input', updateGeneratedQR);
}

function updateGeneratedQR() {
  if (!state.qrCodeInstance) {
    initQRCodeInstance();
    if (!state.qrCodeInstance) return;
  }
  
  if (DOM.generatorCanvas && DOM.generatorCanvas.childNodes.length === 0) {
    try {
      state.qrCodeInstance.append(DOM.generatorCanvas);
    } catch (_) {}
  }
  
  const rawUrl = DOM.genUrlInput ? DOM.genUrlInput.value.trim() : '';
  let urlData = rawUrl || "https://qr-safety.local";
  
  const encryptEnabled = DOM.genEncryptToggle ? DOM.genEncryptToggle.checked : false;
  const encryptPassword = DOM.genEncryptPassword ? DOM.genEncryptPassword.value : '';
  
  if (encryptEnabled && rawUrl) {
    if (encryptPassword) {
      try {
        const ciphertext = CryptoJS.AES.encrypt(rawUrl, encryptPassword).toString();
        urlData = "AES-QR:" + ciphertext;
      } catch (err) {
        console.error("AES Encryption Error:", err);
      }
    } else {
      DOM.genSafetyAlert.className = "gen-safety-alert status-suspicious";
      DOM.genSafetyScore.textContent = "!";
      DOM.genSafetyScore.style.color = "var(--color-suspicious)";
      DOM.genSafetyIcon.setAttribute('data-lucide', 'key-round');
      DOM.genSafetyTitle.textContent = "Encryption Pending";
      DOM.genSafetyDesc.textContent = "Please enter an encryption password.";
      lucide.createIcons();
      state.qrCodeInstance.update({ data: "https://qr-safety.local" });
      return;
    }
  }

  // Audit safety of input URL in real-time
  const isUrlValid = isUrl(urlData);
  let safetyScore = 0;
  let safetyStatus = 'safe';
  
  if (true) {
    const rawUrl = DOM.genUrlInput.value.trim();
    const encryptEnabled = DOM.genEncryptToggle.checked;
    const encryptPassword = DOM.genEncryptPassword.value;
    
    if (rawUrl) {
      if (encryptEnabled && encryptPassword) {
        DOM.genSafetyAlert.className = "gen-safety-alert status-safe";
        DOM.genSafetyScore.textContent = "0";
        DOM.genSafetyScore.style.color = "var(--color-safe)";
        DOM.genSafetyIcon.setAttribute('data-lucide', 'lock');
        DOM.genSafetyTitle.textContent = "Payload Secured";
        DOM.genSafetyDesc.textContent = "QR data is encrypted client-side with AES.";
      } else if (isUrlValid) {
        const audit = analyzeUrl(urlData);
        safetyScore = audit.score;
        safetyStatus = audit.status;
        
        DOM.genSafetyAlert.className = `gen-safety-alert status-${safetyStatus}`;
        DOM.genSafetyScore.textContent = safetyScore;
        DOM.genSafetyScore.style.color = `var(--color-${safetyStatus === 'safe' ? 'safe' : safetyStatus === 'suspicious' ? 'suspicious' : 'danger'})`;
        
        const icon = DOM.genSafetyIcon;
        if (safetyStatus === 'safe') {
          icon.setAttribute('data-lucide', 'shield-check');
          DOM.genSafetyTitle.textContent = "Safe Destination";
          DOM.genSafetyDesc.textContent = "Link passed local heuristic scanner checks.";
        } else if (safetyStatus === 'suspicious') {
          icon.setAttribute('data-lucide', 'alert-triangle');
          DOM.genSafetyTitle.textContent = "Suspicious Link Warning";
          DOM.genSafetyDesc.textContent = "Link has low security reputation profiles.";
        } else {
          icon.setAttribute('data-lucide', 'shield-alert');
          DOM.genSafetyTitle.textContent = "Dangerous Target Detected";
          DOM.genSafetyDesc.textContent = "Phishing/malicious patterns match strongly!";
        }
      } else {
        DOM.genSafetyAlert.className = "gen-safety-alert status-safe";
        DOM.genSafetyScore.textContent = "0";
        DOM.genSafetyIcon.setAttribute('data-lucide', 'info');
        DOM.genSafetyTitle.textContent = "Plain Text Payload";
        DOM.genSafetyDesc.textContent = "Will generate plain text (safe structure).";
      }
    } else {
      DOM.genSafetyAlert.className = "gen-safety-alert status-safe";
      DOM.genSafetyScore.textContent = "0";
      DOM.genSafetyIcon.setAttribute('data-lucide', 'shield-check');
      DOM.genSafetyTitle.textContent = "Awaiting Content";
      DOM.genSafetyDesc.textContent = "Enter a URL to verify safety parameters.";
    }
  }
  lucide.createIcons();

  // Fetch customizations values
  const dotsStyle = DOM.genDotsStyle.value;
  const dotsColor = DOM.genDotsColor.value;
  const bgColor = DOM.genBgColor.value;
  const bgTransparent = DOM.genBgTransparent.checked;
  const cornerSquareStyle = DOM.genCornersSquareStyle.value;
  const cornerDotStyle = DOM.genCornersDotStyle.value;
  const cornerSquareColor = DOM.genCornersSquareColor.value;
  const cornerDotColor = DOM.genCornersDotColor.value;
  const logoScale = parseFloat(DOM.genLogoSize.value);
  const logoMargin = parseInt(DOM.genLogoMargin.value, 10);
  
  // Update styling instance
  const options = {
    data: urlData,
    dotsOptions: {
      color: dotsColor,
      type: dotsStyle
    },
    backgroundOptions: {
      color: bgTransparent ? 'transparent' : bgColor,
    },
    cornersSquareOptions: {
      color: cornerSquareColor,
      type: cornerSquareStyle
    },
    cornersDotOptions: {
      color: cornerDotColor,
      type: cornerDotStyle
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: logoMargin,
      imageSizeFactor: logoScale
    }
  };
  
  if (state.logoBase64) {
    options.image = state.logoBase64;
  } else {
    options.image = '';
  }
  
  try {
    state.qrCodeInstance.update(options);
  } catch (err) {
    console.error("Error updating QR code:", err);
  }
}

// PDF Document Generation Method
function generatePdfReport(result) {
  if (typeof window.jspdf === 'undefined') {
    alert("Error: The PDF generation library is not loaded yet. Please check your internet connection.");
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // 1. Title Banner
  doc.setFillColor(15, 23, 42); // Deep slate
  doc.rect(15, 15, 180, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("QR CODE SAFETY CHECKER - SECURITY AUDIT REPORT", 22, 26);
  
  doc.setTextColor(148, 163, 184); // Slate subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Local Threat Heuristics Diagnostic Sheet", 22, 32);
  
  // 2. Scan Metadata
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("SCAN METADATA", 15, 52);
  
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 54, 195, 54);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Payload Target:", 15, 61);
  doc.text("Scan Date:", 15, 78);
  doc.text("Payload Format:", 110, 78);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  
  const wrappedUrl = doc.splitTextToSize(result.url, 175);
  doc.text(wrappedUrl, 15, 66);
  doc.text(new Date().toLocaleString(), 15, 83);
  
  const isPayloadUrl = isUrl(result.url);
  doc.text(isPayloadUrl ? "HTTP/HTTPS Link" : "Plain Text Payload", 110, 83);
  
  // 3. Verdict Assessment Banner
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("SECURITY ASSESSMENT VERDICT", 15, 96);
  doc.line(15, 98, 195, 98);
  
  let badgeColor = [16, 185, 129];
  let bgColor = [209, 250, 229];
  let txtColor = [6, 95, 70];
  let summaryMsg = "This URL shows no suspicious characteristics and appears safe.";
  
  if (result.status === 'suspicious') {
    badgeColor = [245, 158, 11];
    bgColor = [254, 243, 199];
    txtColor = [146, 64, 14];
    summaryMsg = "Caution: This link triggers safety warning flags. Review details below.";
  } else if (result.status === 'danger') {
    badgeColor = [239, 68, 68];
    bgColor = [254, 226, 226];
    txtColor = [153, 27, 27];
    summaryMsg = "Warning: This link displays strong signatures of a phishing or malicious portal!";
  } else if (!isUrl(result.url)) {
    summaryMsg = "This QR code contains plain text data (no link redirection checks applied).";
  }
  
  doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  doc.rect(15, 102, 180, 18, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(txtColor[0], txtColor[1], txtColor[2]);
  doc.text(`VERDICT: ${result.status.toUpperCase()}  |  Threat Risk Index: ${result.score}/100`, 20, 109);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(summaryMsg, 20, 115);
  
  // 4. Detailed Checklist
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("DETAILED AUDIT CHECKLIST", 15, 131);
  doc.line(15, 133, 195, 133);
  
  let yPos = 140;
  
  const severityOrder = { 'high': 0, 'medium': 1, 'low': 2, 'pass': 3 };
  const sortedFindings = [...result.findings].sort((a, b) => {
    return (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
  });
  
  sortedFindings.forEach((finding) => {
    if (yPos > 265) {
      doc.addPage();
      doc.setFillColor(15, 23, 42);
      doc.rect(15, 10, 180, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("QR CODE SAFETY CHECKER - DETAILED AUDIT CHECKLIST (CONTINUED)", 20, 16.5);
      yPos = 28;
    }
    
    let statusLabel = "[PASSED]";
    let labelColor = [16, 185, 129];
    if (finding.severity === 'high') {
      statusLabel = "[ALERT] ";
      labelColor = [239, 68, 68];
    } else if (finding.severity === 'medium') {
      statusLabel = "[WARN]  ";
      labelColor = [245, 158, 11];
    } else if (finding.severity === 'low') {
      statusLabel = "[NOTICE]";
      labelColor = [99, 102, 241];
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    doc.text(statusLabel, 15, yPos);
    
    doc.setTextColor(15, 23, 42);
    doc.text(finding.message, 38, yPos);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const detailsLines = doc.splitTextToSize(finding.tip || "", 155);
    doc.text(detailsLines, 38, yPos + 4.5);
    
    yPos += 7.5 + (detailsLines.length * 3.5);
    
    doc.setDrawColor(241, 245, 249);
    doc.line(15, yPos - 3, 195, yPos - 3);
    yPos += 2;
  });
  
  // 5. Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("This report is generated locally inside the browser client. No URL data is submitted to cloud databases.", 15, 285);
  doc.text("QR Code Safety Checker Core v1.0.0", 152, 285);
  
  const docName = result.url.replace(/https?:\/\/(www\.)?/, '').replace(/[^a-zA-Z0-9]/g, '-').slice(0, 20);
  doc.save(`qr-safety-report-${docName || 'audit'}.pdf`);
}


