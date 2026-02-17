// content.js
importScripts = undefined; // just in case

// Utility functions (small inline helpers)
function isVisible(elem) {
  if (!elem) return false;
  const style = window.getComputedStyle(elem);
  return style && style.visibility !== 'hidden' && style.display !== 'none' && elem.offsetWidth > 0 && elem.offsetHeight > 0;
}

// ========== YouTube subtitle detection ==========
function initYouTubeObserver() {
  // Known YouTube subtitle container class names used by YT player (subject to change)
  const candidateSelectors = [
    '.ytp-caption-segment',               // captions segmented span
    '.captions-text',                     // alternate class
    '.ytd-transcript-renderer'           // transcript panel
  ];

  const findSubContainer = () => {
    // The typical container that displays captions visually is within the player.
    // Use a broad subtree search for caption elements
    for (const sel of candidateSelectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    // fallback: try for player container
    const player = document.querySelector('.html5-video-player');
    return player;
  };

  const container = findSubContainer() || document.body;
  if (!container) return;

  // Track last caption to avoid duplicates
  let lastCaption = '';
  let lastSentCaption = '';
  let debounceTimer = null;
  let captionStableTimer = null;

  const sendCaptionIfNew = (text) => {
    if (!text || !text.trim()) return;
    const trimmedText = text.trim();
    
    // Check if this is just an extension of the previous caption (word-by-word building)
    if (lastSentCaption && trimmedText.startsWith(lastSentCaption)) {
      // This is just extending the previous caption, don't send duplicates
      return;
    }
    
    // Check if the previous caption was a prefix of this one (skip redundant)
    if (lastSentCaption && lastSentCaption.startsWith(trimmedText)) {
      // The new caption is shorter, this might be a reset - allow it
    }
    
    // Only send if it's meaningfully different
    if (trimmedText !== lastSentCaption) {
      lastSentCaption = trimmedText;
      // Check if extension context is still valid before sending
      try {
        if (chrome.runtime && chrome.runtime.id) {
          chrome.runtime.sendMessage({ type: 'YT_SUBTITLE_UPDATE', text: trimmedText });
        }
      } catch (e) {
        // Extension context invalidated (extension was reloaded), ignore
        console.log('Extension context invalidated, stopping observer');
      }
    }
  };

  const checkCaptions = () => {
    // Clear any pending checks
    if (debounceTimer) clearTimeout(debounceTimer);
    if (captionStableTimer) clearTimeout(captionStableTimer);
    
    // Debounce to avoid excessive checking
    debounceTimer = setTimeout(() => {
      const captionNodes = container.querySelectorAll('.ytp-caption-segment, .captions-text, .caption-window, .caption-contents');
      
      // Get the current visible caption text
      let currentCaption = '';
      captionNodes.forEach(n => {
        if (isVisible(n) && n.innerText && n.innerText.trim()) {
          currentCaption = n.innerText.trim();
        }
      });
      
      // Store current caption
      if (currentCaption) {
        lastCaption = currentCaption;
        
        // Wait for caption to stabilize (stop changing) before sending
        captionStableTimer = setTimeout(() => {
          // Only send if it hasn't changed and is different from last sent
          if (lastCaption === currentCaption) {
            sendCaptionIfNew(currentCaption);
          }
        }, 500); // Wait 500ms for caption to stabilize
      }
    }, 100); // 100ms debounce
  };

  const observer = new MutationObserver((mutations) => {
    // Just trigger a debounced check instead of processing every mutation
    checkCaptions();
  });

  observer.observe(container, { childList: true, subtree: true, characterData: true });
  
  // initial scan
  setTimeout(() => {
    checkCaptions();
  }, 1000);
}

// Try to detect YouTube
function maybeInitYouTube() {
  const hostname = window.location.hostname || '';
  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    try {
      initYouTubeObserver();
      console.log('Content: YouTube subtitle observer initialized');
      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({ type: 'PAGE_TYPE', page: 'youtube' });
      }
    } catch (e) {
      console.warn('YouTube observer failed', e);
    }
  } else {
    try {
      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({ type: 'PAGE_TYPE', page: 'web' });
      }
    } catch (e) {
      // Extension context invalidated
    }
  }
}

// ========== DOM Text extraction handler ==========
function extractVisibleText(options = {}) {
  // options: onlySelected (bool)
  const onlySelected = options.onlySelected || false;
  if (onlySelected) {
    const sel = window.getSelection();
    if (sel && sel.toString().trim()) return Promise.resolve(sel.toString().trim());
    // else fall back
  }

  // Strategy: prefer article/main tags, then headings and paragraphs, then fallback to body.innerText
  const prioritySelectors = [
    'article',
    'main',
    'section',
    'div[id*="content"]',
    'div[class*="content"]',
    'body'
  ];

  let text = '';
  for (const sel of prioritySelectors) {
    const nodes = document.querySelectorAll(sel);
    if (!nodes || nodes.length === 0) continue;
    nodes.forEach(n => {
      // ignore script/style elements
      const clone = n.cloneNode(true);
      // remove heavy irrelevant elements
      clone.querySelectorAll('script, style, noscript, iframe, svg, img, video').forEach(x => x.remove());
      const t = clone.innerText || clone.textContent;
      if (t && t.trim().length > text.length) text = t.trim();
    });
    if (text && text.length > 200) break; // good enough
  }

  if (!text || text.length < 50) {
    text = (document.body && document.body.innerText) ? document.body.innerText.trim() : '';
  }

  // Trim and normalize whitespace
  text = text.replace(/\s{2,}/g, ' ').trim();
  return Promise.resolve(text);
}

// Listen to messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;

  if (msg.type === 'PING') {
    sendResponse({ success: true });
    return false;
  }

  if (msg.type === 'EXTRACT_DOM_TEXT') {
    extractVisibleText(msg.options || {}).then(text => sendResponse({ success: true, text })).catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (msg.type === 'CHECK_YT') {
    const isYT = (window.location.hostname || '').includes('youtube.com') || (window.location.hostname || '').includes('youtu.be');
    sendResponse({ success: true, isYouTube: isYT });
    return false;
  }
});

// init
maybeInitYouTube();
