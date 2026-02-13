import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Ollama
  ollamaCheck: () => ipcRenderer.invoke('ollama:check'),
  ollamaPull: (model: string) => ipcRenderer.invoke('ollama:pull', model),
  ollamaChat: (payload: {
    model: string
    messages: Array<{ role: string; content: string }>
    temperature: number
  }) => ipcRenderer.invoke('ollama:chat', payload),
  onPullProgress: (callback: (data: string) => void) => {
    const handler = (_event: any, data: string) => callback(data)
    ipcRenderer.on('ollama:pull-progress', handler)
    return () => ipcRenderer.removeListener('ollama:pull-progress', handler)
  },

  // File extraction
  extractDocx: (filePath: string) => ipcRenderer.invoke('file:extract-docx', filePath),
  extractPdf: (filePath: string) => ipcRenderer.invoke('file:extract-pdf', filePath),

  // Dialogs
  openFile: (filters: Array<{ name: string; extensions: string[] }>) =>
    ipcRenderer.invoke('dialog:open-file', filters),
  saveFile: (defaultName: string) => ipcRenderer.invoke('dialog:save-file', defaultName),

  // Template
  fillTemplate: (payload: {
    templatePath: string
    data: Record<string, any>
    outputPath: string
  }) => ipcRenderer.invoke('template:fill', payload),

  // Shell
  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
})
