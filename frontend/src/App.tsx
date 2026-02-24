import { useState, useEffect, useRef, Component } from 'react'
import type { ResumeData } from './types'
import type { StyleInfo } from './api'
import { checkHealth, fetchStyles, extractResume, improveResume, downloadDocx, downloadPdf } from './api'
import { getApiKey, setApiKey } from './services/apiKeyStore'
import { save } from '@tauri-apps/plugin-dialog'
import { writeFile } from '@tauri-apps/plugin-fs'
import { openUrl, openPath } from '@tauri-apps/plugin-opener'
import Preview from './components/Preview'

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return <div className={`toast toast-${type}`}>{message}</div>
}

class PreviewErrorBoundary extends Component<
  { children: React.ReactNode; onReset: () => void },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch() { this.props.onReset() }
  render() {
    if (this.state.hasError) return <div className="error-box">Failed to render preview. Please try again.</div>
    return this.props.children
  }
}

export default function App() {
  // Health / API key
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [apiKeyValue, setApiKeyValue] = useState('')

  // Resume input
  const [resumeText, setResumeText] = useState('')
  const [resumeFileName, setResumeFileName] = useState('')
  const [extracting, setExtracting] = useState(false)
  const resumeInputRef = useRef<HTMLInputElement>(null)

  // Controls
  const [targetJob, setTargetJob] = useState('')
  const [keywords, setKeywords] = useState('')
  const [outputLang, setOutputLang] = useState<'he' | 'en'>('he')
  const [intensity, setIntensity] = useState('balanced')

  // Template & styles
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [styles, setStyles] = useState<StyleInfo[]>([])
  const [selectedStyle, setSelectedStyle] = useState('default')

  // AI
  const [improving, setImproving] = useState(false)
  const [aiResult, setAiResult] = useState<ResumeData | null>(null)
  const [aiError, setAiError] = useState('')
  const [rawOutput, setRawOutput] = useState('')

  // Downloads
  const [downloading, setDownloading] = useState<'docx' | 'pdf' | null>(null)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Check health and fetch styles on mount
  useEffect(() => {
    doHealthCheck()
    fetchStyles().then(setStyles).catch(() => {})
  }, [])

  const doHealthCheck = async () => {
    setApiOk(null)
    try {
      const data = await checkHealth()
      setApiOk(data.ok)
      if (!data.ok) setShowApiKeyInput(true)
    } catch {
      setApiOk(false)
      setShowApiKeyInput(true)
    }
  }

  const handleSaveApiKey = async () => {
    if (!apiKeyValue.trim()) return
    await setApiKey(apiKeyValue.trim())
    setShowApiKeyInput(false)
    setApiKeyValue('')
    doHealthCheck()
  }

  // Extract resume file
  const handleResumeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResumeFileName(file.name)
    setExtracting(true)
    try {
      const result = await extractResume(file)
      if (result.maybe_scanned) {
        showToast('This PDF may be scanned/image-based. Please upload a DOCX or paste the text.', 'error')
      }
      setResumeText(result.extracted_text)
      if (file.name.toLowerCase().endsWith('.docx')) {
        setTemplateFile(file)
      }
    } catch (err: any) {
      showToast(`Extraction failed: ${err.message}`, 'error')
    }
    setExtracting(false)
  }

  // Improve with AI
  const handleImprove = async () => {
    if (!resumeText.trim()) {
      showToast('Please provide resume text first.', 'error')
      return
    }
    setImproving(true)
    setAiError('')
    setAiResult(null)
    setRawOutput('')

    try {
      const result = await improveResume({
        extracted_text: resumeText,
        target_job: targetJob,
        keywords: keywords.trim() || undefined,
        output_language: outputLang,
        intensity,
      })

      if (result.improved) {
        setAiResult(result.improved)
      } else {
        setAiError(result.error || 'Unknown error')
        if (result.raw_output) setRawOutput(result.raw_output)
      }
    } catch (err: any) {
      setAiError(err.message)
    }
    setImproving(false)
  }

  // Download handlers
  const handleDownload = async (format: 'docx' | 'pdf') => {
    if (!aiResult) return
    setDownloading(format)
    try {
      const opts = {
        templateFile: templateFile || undefined,
        lang: outputLang,
        style: templateFile ? undefined : selectedStyle,
      }
      const blob = format === 'docx'
        ? await downloadDocx(aiResult, opts)
        : await downloadPdf(aiResult, opts)

      const name = aiResult.name?.replace(/\s+/g, '_') || 'Resume'
      const savePath = await save({
        defaultPath: `Resume_${name}.${format}`,
        filters: format === 'docx'
          ? [{ name: 'Word Document', extensions: ['docx'] }]
          : [{ name: 'PDF Document', extensions: ['pdf'] }],
      })
      if (!savePath) return // user cancelled

      const arrayBuffer = await blob.arrayBuffer()
      await writeFile(savePath, new Uint8Array(arrayBuffer))
      showToast(`${format.toUpperCase()} saved!`)
      await openPath(savePath)
    } catch (err: any) {
      showToast(`Save failed: ${err.message}`, 'error')
    }
    setDownloading(null)
  }

  const useOriginalTemplate = !!templateFile

  return (
    <div className="app">
      <h1>ResumePolish</h1>
      <p className="subtitle">Improve student resumes with AI</p>

      {/* A) Health / Setup */}
      <div className="card">
        <h2>Setup</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          {apiOk === null ? (
            <span><span className="spinner" /> Checking API key...</span>
          ) : apiOk ? (
            <span><span className="status-dot green" />Gemini API ready (gemini-2.5-flash-lite)</span>
          ) : (
            <span><span className="status-dot red" />Gemini API key not set</span>
          )}
          {apiOk && (
            <button className="btn btn-secondary" onClick={() => setShowApiKeyInput(true)} style={{ padding: '5px 12px', fontSize: 13 }}>
              Change Key
            </button>
          )}
        </div>

        {showApiKeyInput && (
          <div style={{ marginTop: 8 }}>
            <label>Gemini API Key</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                value={apiKeyValue}
                onChange={e => setApiKeyValue(e.target.value)}
                placeholder="Enter your Gemini API key..."
                style={{ flex: 1 }}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveApiKey() }}
              />
              <button className="btn btn-primary" onClick={handleSaveApiKey} disabled={!apiKeyValue.trim()}>
                Save
              </button>
              {apiOk && (
                <button className="btn btn-secondary" onClick={() => { setShowApiKeyInput(false); setApiKeyValue('') }}>
                  Cancel
                </button>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#718096', marginTop: 8, background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px' }}>
              <strong style={{ color: '#4a5568' }}>How to get a free API key:</strong>
              <ol style={{ margin: '4px 0 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
                <li>Click <button className="btn-link" onClick={() => openUrl('https://aistudio.google.com/apikey')}>Google AI Studio</button></li>
                <li>Sign in with a Google account</li>
                <li>Click <strong>Create API key</strong></li>
                <li>Copy the key and paste it above</li>
              </ol>
              <p style={{ margin: '4px 0 0 0' }}>It's free — no credit card needed.</p>
            </div>
          </div>
        )}
      </div>

      {/* B) Resume Input */}
      <div className="card">
        <h2>Resume Input</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <input
            ref={resumeInputRef}
            type="file"
            accept=".docx,.pdf"
            style={{ display: 'none' }}
            onChange={handleResumeFile}
          />
          <button className="btn btn-secondary" onClick={() => resumeInputRef.current?.click()} disabled={extracting}>
            {extracting ? <><span className="spinner" /> Extracting...</> : 'Upload Resume (.docx / .pdf)'}
          </button>
          {resumeFileName && <span className="file-label">{resumeFileName}</span>}
        </div>

        <label>Resume Text (auto-filled or paste here)</label>
        <textarea
          rows={10}
          value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          placeholder="Paste resume text here, or upload a file above..."
          dir={outputLang === 'he' ? 'rtl' : 'ltr'}
        />
      </div>

      {/* C) Job / Language controls */}
      <div className="card">
        <h2>Settings</h2>
        <div className="row">
          <div>
            <label>Target Job</label>
            <input
              type="text"
              value={targetJob}
              onChange={e => setTargetJob(e.target.value)}
              placeholder="e.g. Junior Civil Engineer / מהנדס אזרחי זוטר"
            />
          </div>
          <div>
            <label>Keywords (optional)</label>
            <input
              type="text"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
              placeholder="e.g. Python, CI/CD, Agile, ניהול פרויקטים"
            />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Output Language</label>
            <select value={outputLang} onChange={e => setOutputLang(e.target.value as 'he' | 'en')}>
              <option value="he">Hebrew (עברית)</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label>Intensity</label>
            <select value={intensity} onChange={e => setIntensity(e.target.value)}>
              <option value="conservative">Conservative</option>
              <option value="balanced">Balanced</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
        </div>

        <button
          className="btn btn-primary mt-12"
          onClick={handleImprove}
          disabled={improving || !resumeText.trim() || !apiOk}
        >
          {improving ? <><span className="spinner" /> Improving with AI...</> : 'Improve with AI'}
        </button>
      </div>

      {/* AI Error */}
      {aiError && (
        <div className="card">
          <div className="error-box">{aiError}</div>
          {rawOutput && (
            <>
              <label>Raw AI Output</label>
              <textarea rows={8} readOnly value={rawOutput} />
            </>
          )}
        </div>
      )}

      {/* AI Result Preview */}
      {aiResult && (
        <div className="card">
          <h2>AI Result Preview</h2>
          <PreviewErrorBoundary onReset={() => { setAiResult(null); setAiError('AI returned malformed data. Please try again.') }}>
            <Preview data={aiResult} dir={outputLang === 'he' ? 'rtl' : 'ltr'} />
          </PreviewErrorBoundary>
        </div>
      )}

      {/* D) Style & Download */}
      <div className="card">
        <h2>Resume Style & Download</h2>

        {useOriginalTemplate ? (
          <div className="info-box" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Using uploaded resume template: <strong>{templateFile.name}</strong></span>
            <button className="btn-link" onClick={() => setTemplateFile(null)}>Use a style instead</button>
          </div>
        ) : (
          <>
            <label>Choose a resume style</label>
            <div className="style-gallery">
              {styles.map(s => (
                <div
                  key={s.id}
                  className={`style-card${selectedStyle === s.id ? ' selected' : ''}`}
                  onClick={() => setSelectedStyle(s.id)}
                >
                  <img src={`/style-thumbnails/${s.id}.svg`} alt={s.name} />
                  <span className="style-card-name">{s.name}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="actions-row mt-12">
          <button
            className="btn btn-success"
            onClick={() => handleDownload('docx')}
            disabled={!aiResult || downloading !== null}
          >
            {downloading === 'docx' ? <><span className="spinner" /> Generating...</> : 'Download DOCX'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => handleDownload('pdf')}
            disabled={!aiResult || downloading !== null}
          >
            {downloading === 'pdf' ? <><span className="spinner" /> Generating...</> : 'Download PDF'}
          </button>
        </div>

        {!aiResult && <p style={{ fontSize: 13, color: '#a0aec0', marginTop: 8 }}>Run "Improve with AI" first.</p>}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
