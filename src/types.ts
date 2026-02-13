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
  skills: string[]
  notes: string[]
}

export type Language = 'English' | 'Hebrew'
export type Intensity = 'Conservative' | 'Balanced' | 'Aggressive'

declare global {
  interface Window {
    api: {
      ollamaCheck: () => Promise<{ available: boolean; models: string[] }>
      ollamaPull: (model: string) => Promise<{ success: boolean; error?: string }>
      ollamaChat: (payload: {
        model: string
        messages: Array<{ role: string; content: string }>
        temperature: number
      }) => Promise<{ success: boolean; content?: string; error?: string }>
      onPullProgress: (callback: (data: string) => void) => () => void
      extractDocx: (filePath: string) => Promise<{ success: boolean; text?: string; error?: string }>
      extractPdf: (filePath: string) => Promise<{ success: boolean; text?: string; maybeScanned?: boolean; error?: string }>
      openFile: (filters: Array<{ name: string; extensions: string[] }>) => Promise<string | null>
      saveFile: (defaultName: string) => Promise<string | null>
      fillTemplate: (payload: {
        templatePath: string
        data: Record<string, any>
        outputPath: string
      }) => Promise<{ success: boolean; error?: string }>
      openExternal: (url: string) => Promise<void>
    }
  }
}
