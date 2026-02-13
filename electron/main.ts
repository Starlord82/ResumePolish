import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'node:path'
import fs from 'fs-extra'
import mammoth from 'mammoth'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { spawn } from 'node:child_process'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'ResumePolish',
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())

// --- IPC Handlers ---

// Check Ollama availability and get models
ipcMain.handle('ollama:check', async () => {
  try {
    const res = await fetch('http://localhost:11434/api/tags')
    if (!res.ok) throw new Error('Not OK')
    const data = await res.json()
    const models: string[] = (data.models || []).map((m: any) => m.name)
    return { available: true, models }
  } catch {
    return { available: false, models: [] }
  }
})

// Pull a model via child_process
ipcMain.handle('ollama:pull', async (_event, modelName: string) => {
  return new Promise<{ success: boolean; error?: string }>((resolve) => {
    const proc = spawn('ollama', ['pull', modelName], { shell: true })
    let output = ''

    proc.stdout.on('data', (data: Buffer) => {
      output += data.toString()
      mainWindow?.webContents.send('ollama:pull-progress', data.toString())
    })
    proc.stderr.on('data', (data: Buffer) => {
      output += data.toString()
      mainWindow?.webContents.send('ollama:pull-progress', data.toString())
    })
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true })
      } else {
        resolve({ success: false, error: output })
      }
    })
    proc.on('error', (err) => {
      resolve({ success: false, error: err.message })
    })
  })
})

// Chat with Ollama (non-streaming)
ipcMain.handle('ollama:chat', async (_event, payload: {
  model: string
  messages: Array<{ role: string; content: string }>
  temperature: number
}) => {
  try {
    const res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: payload.model,
        messages: payload.messages,
        stream: false,
        options: { temperature: payload.temperature },
        format: 'json',
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { success: false, error: `Ollama error: ${res.status} - ${text}` }
    }
    const data = await res.json()
    const content = data.message?.content || ''
    return { success: true, content }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

// Extract text from DOCX
ipcMain.handle('file:extract-docx', async (_event, filePath: string) => {
  try {
    const buffer = await fs.readFile(filePath)
    const result = await mammoth.extractRawText({ buffer })
    return { success: true, text: result.value }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

// Extract text from PDF
ipcMain.handle('file:extract-pdf', async (_event, filePath: string) => {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    const data = new Uint8Array(await fs.readFile(filePath))
    const doc = await pdfjsLib.getDocument({ data }).promise
    const pages: string[] = []

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      pages.push(pageText)
    }

    const fullText = pages
      .map((text, i) => `--- Page ${i + 1} ---\n\n${text}`)
      .join('\n\n')

    const isGarbage = fullText.replace(/[\s\-Page\d]/g, '').length < 200
    return { success: true, text: fullText, maybeScanned: isGarbage }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

// Pick file dialog
ipcMain.handle('dialog:open-file', async (_event, filters: Array<{ name: string; extensions: string[] }>) => {
  if (!mainWindow) return null
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters,
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

// Save file dialog
ipcMain.handle('dialog:save-file', async (_event, defaultName: string) => {
  if (!mainWindow) return null
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [{ name: 'Word Document', extensions: ['docx'] }],
  })
  if (result.canceled || !result.filePath) return null
  return result.filePath
})

// Fill DOCX template and save
ipcMain.handle('template:fill', async (_event, payload: {
  templatePath: string
  data: Record<string, any>
  outputPath: string
}) => {
  try {
    const content = await fs.readFile(payload.templatePath, 'binary')
    const zip = new PizZip(content)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })
    doc.render(payload.data)
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    })
    await fs.writeFile(payload.outputPath, buf)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

// Open external URL
ipcMain.handle('shell:open-external', async (_event, url: string) => {
  await shell.openExternal(url)
})
