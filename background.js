// background.js (service worker)
chrome.runtime.onInstalled.addListener(() => {
  console.log('Screen Text Extractor installed');
});

// Handle messages from popup / content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'CAPTURE_VISIBLE_TAB') {
    // Capture currently active tab in the window that sent the request (or last focused window)
    chrome.windows.getLastFocused({populate: true}, (win) => {
      const tabId = sender.tab ? sender.tab.id : (win && win.tabs && win.tabs[0] ? win.tabs[0].id : null);
      // captureVisibleTab doesn't require tabId argument; use default
      chrome.tabs.captureVisibleTab(win.id, {format: 'png'}, (dataUrl) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, dataUrl });
        }
      });
    });
    // Return true to indicate we'll call sendResponse asynchronously
    return true;
  }

  // Relay request to content script in a specific tab (fallback)
  if (msg && msg.type === 'INJECT_SCRIPT') {
    const tabId = sender.tab ? sender.tab.id : null;
    if (!tabId) {
      sendResponse({ success: false, error: 'No tab id provided' });
      return;
    }
    chrome.scripting.executeScript({
      target: { tabId },
      files: msg.files
    }).then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});
