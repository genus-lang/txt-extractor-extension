// popup.js (module)
//importScripts = undefined; // placeholder for extension environment

const outputEl = document.getElementById('output');
const btnExtract = document.getElementById('btnExtract');
const btnCopy = document.getElementById('btnCopy');
const btnSave = document.getElementById('btnSave');
const progressEl = document.getElementById('progress');
const liveLabel = document.getElementById('liveLabel');

function setProgress(txt, show = true) {
  if (show) {
    progressEl.classList.remove('hidden');
    progressEl.textContent = txt;
  } else {
    progressEl.classList.add('hidden');
  }
}

function setOutput(text) {
  outputEl.value = text || '';
}

// get selected mode
function getMode() {
  const radios = document.querySelectorAll('input[name="mode"]');
  for (const r of radios) if (r.checked) return r.value;
  return 'dom';
}

// Copy button
btnCopy.addEventListener('click', () => {
  outputEl.select();
  document.execCommand('copy');
});

// Save .txt
btnSave.addEventListener('click', () => {
  const data = outputEl.value || '';
  const blob = new Blob([data], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'extracted-text.txt';
  a.click();
  URL.revokeObjectURL(url);
});

// Listen for messages from content script (YouTube live updates)
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || !msg.type) return;
  if (msg.type === 'YT_SUBTITLE_UPDATE') {
    // append or replace depending on mode
    if (getMode() === 'youtube') {
      liveLabel.classList.remove('hidden');
      // append to output
      const prev = outputEl.value.trim();
      const next = (prev ? prev + '\n' : '') + msg.text;
      outputEl.value = next;
    }
  }
});

// Helper to ensure content script is injected
async function ensureContentScript(tabId) {
  try {
    // Test if content script is already injected
    const response = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
    return true;
  } catch (e) {
    // Content script not injected, inject it now
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      // Give it a moment to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;
    } catch (err) {
      console.error('Failed to inject content script:', err);
      return false;
    }
  }
}

// Extract logic
btnExtract.addEventListener('click', async () => {
  setProgress('Preparing...');
  const mode = getMode();
  setOutput('');
  liveLabel.classList.add('hidden');

  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    setProgress('No active tab', true);
    return;
  }

  // Check if this is a restricted page
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) {
    setProgress('Cannot access browser internal pages', true);
    return;
  }

  // Ensure content script is injected
  setProgress('Initializing...');
  const injected = await ensureContentScript(tab.id);
  if (!injected) {
    setProgress('Failed to initialize content script', true);
    return;
  }

  if (mode === 'dom') {
    // Ask content script to extract DOM text
    setProgress('Extracting DOM text...');
    chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_DOM_TEXT', options: { onlySelected: false } }, (resp) => {
      if (chrome.runtime.lastError) {
        setProgress('Cannot reach page: ' + chrome.runtime.lastError.message, true);
        return;
      }
      if (resp && resp.success) {
        setOutput(resp.text);
        setProgress('Done', false);
      } else {
        setProgress('Failed: ' + (resp && resp.error ? resp.error : 'unknown'), true);
      }
    });
    return;
  }

  if (mode === 'youtube') {
    // Tell content script to check YT and ensure the mutation observer is active
    setProgress('Checking YouTube...');
    chrome.tabs.sendMessage(tab.id, { type: 'CHECK_YT' }, (resp) => {
      if (chrome.runtime.lastError) {
        setProgress('Cannot reach page: ' + chrome.runtime.lastError.message, true);
        return;
      }
      if (resp && resp.isYouTube) {
        setProgress('Listening for YouTube subtitles (open popup to collect)...', false);
        liveLabel.classList.remove('hidden');
        // Keep popup open — the content script will push events
      } else {
        setProgress('Not a YouTube page', true);
      }
    });
    return;
  }

  if (mode === 'ocr') {
    // Ask background to capture visible tab and run OCR
    setProgress('Capturing screen...');
    chrome.runtime.sendMessage({ type: 'CAPTURE_VISIBLE_TAB' }, async (resp) => {
      if (!resp || !resp.success) {
        setProgress('Capture failed: ' + (resp && resp.error ? resp.error : 'unknown'), true);
        return;
      }
      const dataUrl = resp.dataUrl;
      setProgress('Running OCR (this may take a few seconds)...');

      // Ensure Tesseract is available
      if (typeof Tesseract === 'undefined') {
        setProgress('Tesseract not loaded. Put libs/tesseract.min.js in the extension.', true);
        return;
      }

      try {
        // Create worker
        const worker = Tesseract.createWorker({
          logger: m => {
            // m.status, m.progress
            const pct = m.progress ? Math.round(m.progress * 100) : null;
            setProgress(`${m.status}${pct !== null ? ' — ' + pct + '%' : ''}`);
          }
        });

        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');

        const { data } = await worker.recognize(dataUrl);
        await worker.terminate();

        setOutput(data.text || '');
        setProgress('OCR complete', false);
      } catch (err) {
        setProgress('OCR failed: ' + err.message, true);
      }
    });
    return;
  }
});
