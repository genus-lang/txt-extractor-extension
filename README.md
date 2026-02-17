# 🔎 Screen Text Extractor — Smart Browser Extension

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![OCR](https://img.shields.io/badge/OCR-Tesseract.js-orange)

A powerful Chrome Extension that extracts text from webpages, detects real-time YouTube subtitles, and performs OCR directly from the screen.

Designed as a modern browser automation tool using advanced Chrome Extension APIs and intelligent extraction strategies.

---

## ✨ Core Features

### 🟢 Page Text Extraction
- Extract readable content from any webpage.
- Smart DOM scanning.
- Supports articles, paragraphs, and structured content.

---

### 🎬 Real-Time YouTube Subtitle Detection
- Detects live subtitles automatically.
- Uses MutationObserver for instant updates.
- Faster than OCR because it reads native subtitle elements.

---

### 📷 Screen OCR (Optical Character Recognition)
- Capture visible tab screenshot.
- Extract text from images/videos.
- Powered by Tesseract.js.

---

## 🧠 System Architecture

The extension uses a hybrid extraction model:

```
        User Popup Action
               ↓
        | Decision Layer |
        
        ↓        ↓        ↓
   DOM Extract  YouTube   OCR Engine
   (Text nodes) Observer  (Tesseract)
```

### Extraction Strategy Priority

1️⃣ Direct DOM extraction (fastest)  
2️⃣ Native subtitle detection (accurate)  
3️⃣ OCR fallback (universal)

---

## 🧱 Project Structure

```
screen-text-extractor/
│
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── styles.css
│
├── libs/
│   └── tesseract.min.js
│
└── utils/
    ├── domExtractor.js
    ├── ocrEngine.js
    └── youtubeDetector.js
```

---

## ⚙️ Installation (Developer Mode)

1. Clone repository:

```bash
git clone https://github.com/genus-lang/txt-extractor-extension.git
```

2. Open Chrome:

```
chrome://extensions
```

3. Enable **Developer Mode**.

4. Click:

```
Load unpacked
```

5. Select project folder.

---

## 🧪 Usage

### Extract Page Text

- Open any website.
- Click extension icon.
- Select:

```
Page Text
```

- Press **Extract**.

---

### Extract YouTube Subtitles

- Open YouTube video.
- Enable subtitles.
- Select:

```
YouTube Subtitles
```

- Subtitles stream live.

---

### Screen OCR

- Select:

```
Screen OCR
```

- Extract text from images or videos.

---

## 🔧 Technologies Used

- **Chrome Extension Manifest V3**
- **JavaScript ES Modules**
- **MutationObserver API**
- **Chrome Tabs API**
- **Tesseract.js OCR**
- **DOM Parsing Techniques**

---

## 🚀 Advanced Engineering Concepts

- Real-time DOM mutation monitoring
- Hybrid text extraction architecture
- Content script messaging system
- OCR fallback strategy
- CSP-compliant library loading

---

## 🧩 Chrome Extension Architecture

```
              Popup UI
                 ↓
      Background Service Worker
                 ↓
  Content Script (Injected into webpage)
                 ↓
    DOM / Video / OCR Processing
```

---

## ⚠️ Known Limitations

- OCR accuracy depends on resolution.
- Some websites block DOM access.
- Tesseract worker requires local configuration for MV3 deployment.

---

## 🚀 Future Roadmap

- Universal subtitle detection (Netflix, Coursera, Udemy)
- AI-powered summarization
- Live translation
- Floating caption overlay
- Smart subtitle region detection
- GPU accelerated OCR

---

## 📦 Deployment Guide

### Local Development

```
chrome://extensions → Load unpacked
```

### Chrome Web Store Deployment

1. Create developer account.
2. Zip project folder.
3. Upload to Chrome Developer Dashboard.
4. Add listing assets.
5. Submit for review.

---

## 📸 Screenshots

(Add images here)

---

## 👨‍💻 Author

Advanced browser automation project designed for modern web interaction and real-time text extraction.

---

## 📄 License

MIT License

---

## ⭐ Contributions

Pull requests welcome.
