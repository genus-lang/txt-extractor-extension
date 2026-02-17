// utils/youtubeDetector.js
export function isYouTubePage() {
  const host = window.location.hostname || '';
  return host.includes('youtube.com') || host.includes('youtu.be');
}

/**
 * getYouTubeCaptionsFromPlayer attempts to read captions from yt player config.
 * Note: YouTube internals can change; content script MutationObserver is more robust.
 */
export function getYouTubeCaptionsFromPlayer() {
  try {
    // Try reading the in-page YT player caption container
    const segs = document.querySelectorAll('.ytp-caption-segment');
    const texts = [];
    segs.forEach(s => {
      if (s.innerText && s.innerText.trim()) texts.push(s.innerText.trim());
    });
    return texts.join(' ');
  } catch (e) {
    return '';
  }
}
