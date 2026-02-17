// utils/domExtractor.js
export async function extractReadableText({ onlySelected = false } = {}) {
  if (onlySelected) {
    const sel = window.getSelection();
    if (sel && sel.toString()) return sel.toString().trim();
  }

  const selectors = ['article', 'main', 'section', 'div[id*="content"]', 'div[class*="content"]', 'body'];
  let best = '';

  for (const sel of selectors) {
    const nodes = document.querySelectorAll(sel);
    for (const node of nodes) {
      const copy = node.cloneNode(true);
      copy.querySelectorAll('script, style, iframe, svg, img, video').forEach(n => n.remove());
      const t = (copy.innerText || '').trim();
      if (t.length > best.length) best = t;
    }
    if (best.length > 500) break;
  }

  if (!best) best = (document.body && document.body.innerText) ? document.body.innerText.trim() : '';
  return best.replace(/\s{2,}/g, ' ').trim();
}
