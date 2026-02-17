export interface ResumeData {
  name: string
  title: string
  phone?: string
  email?: string
  linkedin?: string
  summary: string
  experience: Array<{
    company: string
    role: string
    dates: string
    bullets: string[]
  }>
  education: Array<{
    institution: string
    degree: string
    dates: string
    bullets?: string[]
  }>
  projects: Array<{
    name: string
    dates: string
    bullets: string[]
  }>
  military_service?: {
    role: string
    dates: string
    details?: string
  }
  languages?: string[]
  skills: string[]
  notes: string[]
  // Dynamic section headings (from Gemini)
  education_heading?: string
  experience_heading?: string
  projects_heading?: string
  military_heading?: string
  languages_heading?: string
  skills_heading?: string
}
