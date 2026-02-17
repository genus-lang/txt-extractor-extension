// utils/ocrEngine.js
// This module expects Tesseract to be available globally as Tesseract (so include libs/tesseract.min.js in popup)
export async function ocrFromDataUrl(dataUrl, onProgress = null) {
  if (typeof Tesseract === 'undefined') {
    throw new Error('Tesseract.js not loaded. Put libs/tesseract.min.js in extension and include it.');
  }

  // Create worker with local paths
  const worker = await Tesseract.createWorker({
    workerPath: chrome.runtime.getURL('libs/tesseract.min.js'),
    logger: m => {
      if (onProgress) onProgress(m);
      // console.log(m);
    }
  });

  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');

  const { data: { text } } = await worker.recognize(dataUrl);
  await worker.terminate();
  return text;
}
