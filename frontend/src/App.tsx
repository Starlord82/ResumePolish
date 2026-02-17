import { useState, useEffect, useRef, Component } from 'react'
import type { ResumeData } from './types'
import { checkHealth, extractResume, improveResume, downloadDocx, downloadPdf } from './api'
import TemplateHelpModal from './components/TemplateHelpModal'
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
  // Health
  const [apiOk, setApiOk] = useState<boolean | null>(null)

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

  // Template
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const templateInputRef = useRef<HTMLInputElement>(null)

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

  // Check health on mount
  useEffect(() => {
    doHealthCheck()
  }, [])

  const doHealthCheck = async () => {
    setApiOk(null)
    try {
      const data = await checkHealth()
      setApiOk(data.ok)
    } catch {
      setApiOk(false)
    }
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
      const blob = format === 'docx'
        ? await downloadDocx(aiResult, templateFile, outputLang)
        : await downloadPdf(aiResult, templateFile, outputLang)

      const name = aiResult.name?.replace(/\s+/g, '_') || 'Resume'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Resume_${name}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      showToast(`${format.toUpperCase()} downloaded!`)
    } catch (err: any) {
      showToast(`Download failed: ${err.message}`, 'error')
    }
    setDownloading(null)
  }

  return (
    <div className="app">
      <h1>ResumePolish</h1>
      <p className="subtitle">Improve student resumes with AI</p>

      {/* A) Health / Setup */}
      <div className="card">
        <h2>Setup</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          {apiOk === null ? (
            <span><span className="spinner" /> Checking Gemini API...</span>
          ) : apiOk ? (
            <span><span className="status-dot green" />Gemini API ready (gemini-2.5-flash-lite)</span>
          ) : (
            <span><span className="status-dot red" />Gemini API not configured</span>
          )}
          <button className="btn btn-secondary" onClick={doHealthCheck} style={{ padding: '5px 12px', fontSize: 13 }}>
            Re-check
          </button>
        </div>

        {apiOk === false && (
          <div className="warning-box">
            Set the <code>GEMINI_API_KEY</code> environment variable in <code>docker-compose.yml</code> or <code>.env</code> file. Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio</a>.
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

      {/* D) Template + E) Downloads */}
      <div className="card">
        <h2>Word Template & Download</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <input
            ref={templateInputRef}
            type="file"
            accept=".docx"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) setTemplateFile(f)
            }}
          />
          <button className="btn btn-secondary" onClick={() => templateInputRef.current?.click()}>
            Upload Word Template (.docx)
          </button>
          {templateFile && <span className="file-label">{templateFile.name}</span>}
          <button className="btn btn-link" onClick={() => setShowHelp(true)}>How to create a template</button>
        </div>

        <div className="actions-row">
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
        {aiResult && !templateFile && <p style={{ fontSize: 13, color: '#a0aec0', marginTop: 8 }}>A default layout will be used. Upload a template for custom formatting.</p>}
        {aiResult && templateFile && resumeFileName && templateFile.name === resumeFileName && <p style={{ fontSize: 13, color: '#718096', marginTop: 8 }}>Using uploaded resume as template (original formatting preserved).</p>}
      </div>

      {showHelp && <TemplateHelpModal onClose={() => setShowHelp(false)} />}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
