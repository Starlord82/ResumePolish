# ResumePolish

Internal office tool that improves student resumes using a **local AI model** (Ollama) and generates polished DOCX files from a Word template.

## Prerequisites

1. **Node.js** 18+ — [https://nodejs.org](https://nodejs.org)
2. **Ollama** — [https://ollama.com/download](https://ollama.com/download)

After installing Ollama, start it and pull a model:

```bash
ollama pull llama3.1:8b
```

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

This starts the Electron app with hot-reload.

## Build for Windows

```bash
npm run build
```

Output installer will be in the `dist/` folder.

## Supported Inputs

| Format | Support |
|--------|---------|
| `.docx` | Full text extraction via mammoth |
| `.pdf` (text-based) | Text extraction via pdfjs-dist |
| `.pdf` (scanned/image) | **Not supported** — upload DOCX or paste text |
| Paste text | Paste directly into the text area |

## How to Create a Word Template

Create a `.docx` file in Microsoft Word with placeholder tags. Style and format however you like — placeholders get replaced with data.

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
| `{{#bullets}}{{.}}{{/bullets}}` | Loop over bullet points in each experience |
| `{{#education}}...{{/education}}` | Loop over education entries |
| `{{degree}}`, `{{institution}}`, `{{dates}}` | Inside education loop |
| `{{#skills}}{{.}}{{/skills}}` | Loop over skills list |
| `{{#notes}}{{.}}{{/notes}}` | (Optional) Loop over AI notes |

### Tips

- Format the template with fonts, colors, and spacing — only the placeholder text gets replaced.
- Use Word's bullet list formatting inside loops for nice output.
- Keep placeholder names exactly as shown (case-sensitive).
