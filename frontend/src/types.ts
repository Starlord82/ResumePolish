export interface ResumeData {
  name: string
  title: string
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
  }>
  projects: Array<{
    name: string
    dates: string
    bullets: string[]
  }>
  skills: string[]
  notes: string[]
}
