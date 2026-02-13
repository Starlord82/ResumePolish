import type { ResumeData, Language, Intensity } from './types'

export function buildPrompt(
  resumeText: string,
  targetRole: string,
  language: Language,
  intensity: Intensity
): string {
  const roleClause = targetRole
    ? `The target role is: ${targetRole}. Tailor the resume for this position.`
    : 'No specific target role was given. Improve the resume generally.'

  const intensityClause = {
    Conservative: 'Make minimal changes — fix grammar, improve clarity, and clean up formatting only.',
    Balanced: 'Improve phrasing, restructure for clarity, and make it more professional while staying faithful to the original.',
    Aggressive: 'Significantly rewrite for maximum impact — use strong action verbs, quantify achievements where possible, and optimize for the target role.',
  }[intensity]

  return `You are a professional resume writer.

TASK: Analyze the following resume text and return an improved, structured version as a JSON object.

RULES:
- NEVER invent experience, education, companies, degrees, dates, skills, certifications, or achievements.
- Only rewrite and restructure what exists in the provided resume text.
- Remove irrelevant items and improve phrasing for the target role.
- Keep it 1-page friendly (concise).
- Use professional, market-ready wording.
- Output language: ${language}
- ${roleClause}
- ${intensityClause}
- If information is missing, use empty strings or empty arrays. Add a note in "notes" explaining what's missing.

OUTPUT FORMAT — respond with ONLY this JSON, no other text:
{
  "name": "string",
  "title": "string",
  "summary": "string",
  "experience": [
    {
      "company": "string",
      "role": "string",
      "dates": "string",
      "bullets": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "dates": "string"
    }
  ],
  "skills": ["string"],
  "notes": ["string"]
}

RESUME TEXT:
---
${resumeText}
---

Respond with ONLY the JSON object. No markdown, no explanation, no extra text.`
}

export function extractJson(raw: string): ResumeData | null {
  // Try direct parse first
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.name === 'string') return parsed as ResumeData
  } catch {}

  // Try to find first { ... } block
  const match = raw.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      const parsed = JSON.parse(match[0])
      if (parsed && typeof parsed.name === 'string') return parsed as ResumeData
    } catch {}
  }

  return null
}
