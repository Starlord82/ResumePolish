# ResumePolish

Desktop app that improves student resumes using **Google Gemini AI** and generates polished DOCX/PDF files. Runs entirely on your machine — no server, no Docker, no browser needed.

## Installation

1. Download `ResumePolish_x64-setup.exe` from [Releases](https://github.com/Starlord82/ResumePolish/releases)
2. Run the installer — it creates a Start Menu shortcut and an uninstaller
3. Launch **ResumePolish** from the Start Menu

**Requirements:** Windows 10/11 (WebView2 is pre-installed on Windows 11; Windows 10 installs it automatically if missing)

## First Run — API Key Setup

ResumePolish uses Google Gemini AI, which is **free**:

1. Click **Google AI Studio** in the app (or go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey))
2. Sign in with a Google account
3. Click **Create API key**
4. Paste the key into the app and click **Save**

The key is stored locally on your machine. It never leaves your computer except when calling the Gemini API directly.

## How to Use

1. **Upload** a `.docx` or `.pdf` resume, or paste text directly
2. Fill in **Target Job** and optionally **Keywords** for ATS
3. Choose **Output Language** (Hebrew / English) and **Intensity**
4. Click **Improve with AI** — takes ~10–30 seconds
5. Review the preview, then **Download DOCX** or **Download PDF**
   - A Save dialog lets you choose where to save
   - The file opens automatically after saving

## Architecture

```
┌──────────────────────────────────────────────┐
│              ResumePolish (Tauri)             │
│                                               │
│  React + TypeScript UI                        │
│  ├── mammoth       (DOCX extraction)          │
│  ├── pdfjs-dist    (PDF extraction)           │
│  ├── @google/generative-ai  (Gemini API)      │
│  ├── docxtemplater (DOCX generation)          │
│  └── @react-pdf/renderer    (PDF generation)  │
│                                               │
│  Tauri (Rust shell)                           │
│  ├── tauri-plugin-store  (API key storage)    │
│  ├── tauri-plugin-http   (CORS bypass)        │
│  ├── tauri-plugin-dialog (Save file dialog)   │
│  ├── tauri-plugin-fs     (Write files)        │
│  └── tauri-plugin-opener (Open saved files)   │
└──────────────────────────────────────────────┘
                      │
                      ▼ HTTPS
              Google Gemini API
```

Everything runs locally. The only network call is to the Gemini API.

## Supported Input Formats

| Format | Support |
|--------|---------|
| `.docx` | Full extraction via mammoth |
| `.pdf` (text-based) | Extraction via pdfjs-dist |
| `.pdf` (scanned/image) | Not supported — upload DOCX or paste text |
| Paste text | Paste directly into the text area |

## Custom Word Templates

Upload your own `.docx` template with placeholder tags — the app will fill them in with the AI-improved resume data.

### Placeholder Reference

| Placeholder | Description |
|-------------|-------------|
| `{name}` | Full name |
| `{title}` | Professional title |
| `{summary}` | Professional summary |
| `{phone}`, `{email}`, `{linkedin}` | Contact info |
| `{#experience}...{/experience}` | Loop over work experience |
| `{role}`, `{company}`, `{dates}` | Inside experience loop |
| `{#bullets}{.}{/bullets}` | Bullet points |
| `{#projects}...{/projects}` | Loop over projects |
| `{#education}...{/education}` | Loop over education |
| `{degree}`, `{institution}` | Inside education loop |
| `{#skills}{.}{/skills}` | Skills list |
| `{#languages}{.}{/languages}` | Languages list |
| `{#military_service}...{/military_service}` | Optional military service section |

## Development

**Prerequisites:** [Rust](https://rustup.rs/), [Node.js](https://nodejs.org/), [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

```bash
cd frontend
npm install
npm run tauri:dev
```

**Build installer:**
```bash
cd frontend
npm run tauri:build
# Output: src-tauri/target/release/bundle/nsis/ResumePolish_x64-setup.exe
```

> **Note:** If the project is inside Dropbox, build output is redirected to `C:\Users\<you>\.cargo\target\resumepolish` to avoid Dropbox file-lock conflicts (configured in `src-tauri/.cargo/config.toml`).
