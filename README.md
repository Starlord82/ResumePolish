# ResumePolish

Internal office tool that improves student resumes using **Google Gemini AI** and generates polished DOCX/PDF files from a Word template.

## Quick Start

1. Get a free Gemini API key at [Google AI Studio](https://aistudio.google.com/apikey)

2. Create a `.env` file in the project root:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. Start the app:
   ```bash
   docker compose up --build
   ```

4. Open **http://localhost:8080** in your browser.

## Architecture

```
┌─────────────┐     /api/*      ┌──────────────┐    Gemini API    ┌──────────┐
│  Frontend    │ ──────────────► │   Backend    │ ───────────────► │  Google  │
│  React+Vite  │  nginx proxy    │  Express+TS  │                  │  Gemini  │
│  :8080       │                 │  :3001       │                  │  (cloud) │
└─────────────┘                 └──────────────┘                  └──────────┘
                                 │ LibreOffice
                                 │ (DOCX→PDF)
```

- **Frontend**: React + TypeScript + Vite, served via nginx
- **Backend**: Node.js + Express + TypeScript
- **AI**: Google Gemini 2.0 Flash (excellent Hebrew support, free tier)
- **PDF conversion**: LibreOffice headless in the backend container

## Supported Inputs

| Format | Support |
|--------|---------|
| `.docx` | Full text extraction via mammoth |
| `.pdf` (text-based) | Text extraction via pdfjs-dist |
| `.pdf` (scanned/image) | **Not supported** — upload DOCX or paste text |
| Paste text | Paste directly into the text area |

## Development (without Docker)

```bash
# Backend
cd backend && npm install
GEMINI_API_KEY=your_key npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

Frontend dev server runs at http://localhost:5173 with API proxy to http://localhost:3001.

## How to Create a Word Template

Create a `.docx` file in Microsoft Word with placeholder tags. Style and format however you like — the placeholders get replaced with resume data.

### Full Example Template

```
{{name}}
{{title}}

PROFESSIONAL SUMMARY
{{summary}}

EXPERIENCE
{{#experience}}
{{role}} – {{company}} ({{dates}})
{{#bullets}}
• {{.}}
{{/bullets}}
{{/experience}}

PROJECTS
{{#projects}}
{{name}} ({{dates}})
{{#bullets}}
• {{.}}
{{/bullets}}
{{/projects}}

EDUCATION
{{#education}}
{{degree}} – {{institution}} ({{dates}})
{{/education}}

SKILLS
{{#skills}}
• {{.}}
{{/skills}}
```

### Placeholder Reference

| Placeholder | Description |
|-------------|-------------|
| `{{name}}` | Full name |
| `{{title}}` | Professional title |
| `{{summary}}` | Professional summary paragraph |
| `{{#experience}}...{{/experience}}` | Loop over work experience entries |
| `{{role}}`, `{{company}}`, `{{dates}}` | Inside experience loop |
| `{{#bullets}}{{.}}{{/bullets}}` | Bullet points in each experience/project |
| `{{#projects}}...{{/projects}}` | Loop over project entries |
| `{{#education}}...{{/education}}` | Loop over education entries |
| `{{degree}}`, `{{institution}}`, `{{dates}}` | Inside education loop |
| `{{#skills}}{{.}}{{/skills}}` | Loop over skills list |
| `{{#notes}}{{.}}{{/notes}}` | (Optional) Loop over AI notes |

### Tips

- Format the template with fonts, colors, and spacing — only placeholder text gets replaced.
- Use Word's bullet list formatting inside loops for nice output.
- Keep placeholder names exactly as shown (case-sensitive).
