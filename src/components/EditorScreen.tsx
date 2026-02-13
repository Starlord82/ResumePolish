import { useState } from 'react'
import type { ResumeData, Language, Intensity } from '../types'
import TemplateHelpModal from './TemplateHelpModal'
import { buildPrompt, extractJson } from '../prompt'

interface Props {
  model: string
  showToast: (msg: string, type?: 'success' | 'error') => void
}

const TEMP_MAP: Record<Intensity, number> = {
  Conservative: 0.2,
  Balanced: 0.5,
  Aggressive: 0.8,
}

export default function EditorScreen({ model, showToast }: Props) {
  // Resume input
  const [resumeText, setResumeText] = useState('')
  const [resumeFile, setResumeFile] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [language, setLanguage] = useState<Language>('English')
  const [intensity, setIntensity] = useState<Intensity>('Balanced')

  // Template
  const [templatePath, setTemplatePath] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  // AI result
  const [loading, setLoading] = useState(false)
  const [aiResult, setAiResult] = useState<ResumeData | null>(null)
  const [rawOutput, setRawOutput] = useState('')
  const [aiError, setAiError] = useState('')

  // DOCX generation
  const [generating, setGenerating] = useState(false)

  const handleUploadResume = async () => {
    const filePath = await window.api.openFile([
      { name: 'Resume', extensions: ['docx', 'pdf'] },
    ])
    if (!filePath) return

    const ext = filePath.toLowerCase().split('.').pop()
    setResumeFile(filePath.split(/[\\/]/).pop() || filePath)

    if (ext === 'docx') {
      const result = await window.api.extractDocx(filePath)
      if (result.success) {
        setResumeText(result.text || '')
      } else {
        showToast(`Failed to read DOCX: ${result.error}`, 'error')
      }
    } else if (ext === 'pdf') {
      const result = await window.api.extractPdf(filePath)
      if (result.success) {
        if (result.maybeScanned) {
          showToast('This PDF may be scanned/image-based. Please upload a DOCX or paste the text.', 'error')
        }
        setResumeText(result.text || '')
      } else {
        showToast(`Failed to read PDF: ${result.error}`, 'error')
      }
    }
  }

  const handleUploadTemplate = async () => {
    const filePath = await window.api.openFile([
      { name: 'Word Template', extensions: ['docx'] },
    ])
    if (!filePath) return
    setTemplatePath(filePath)
    setTemplateName(filePath.split(/[\\/]/).pop() || filePath)
  }

  const handleImprove = async () => {
    if (!resumeText.trim()) {
      showToast('Please provide resume text first.', 'error')
      return
    }

    setLoading(true)
    setAiError('')
    setAiResult(null)
    setRawOutput('')

    const prompt = buildPrompt(resumeText, targetRole, language, intensity)

    const result = await window.api.ollamaChat({
      model,
      messages: [
        { role: 'system', content: 'You are a professional resume writer. You output ONLY valid JSON, no other text.' },
        { role: 'user', content: prompt },
      ],
      temperature: TEMP_MAP[intensity],
    })

    setLoading(false)

    if (!result.success) {
      setAiError(result.error || 'Unknown error')
      return
    }

    const content = result.content || ''
    setRawOutput(content)

    const parsed = extractJson(content)
    if (parsed) {
      setAiResult(parsed)
    } else {
      setAiError('Failed to parse AI output as JSON. See raw output below.')
    }
  }

  const handleGenerate = async () => {
    if (!aiResult || !templatePath) return

    const defaultName = `Resume_${aiResult.name.replace(/\s+/g, '_') || 'Output'}.docx`
    const savePath = await window.api.saveFile(defaultName)
    if (!savePath) return

    setGenerating(true)
    const result = await window.api.fillTemplate({
      templatePath,
      data: aiResult,
      outputPath: savePath,
    })
    setGenerating(false)

    if (result.success) {
      showToast(`Saved: ${savePath}`)
    } else {
      showToast(`Template error: ${result.error}. Check placeholder spelling.`, 'error')
    }
  }

  return (
    <>
      {/* Resume Input */}
      <div className="card">
        <h2>Resume Input</h2>
        <div className="row mb-8">
          <button className="btn btn-secondary" onClick={handleUploadResume}>
            Upload Resume (.docx / .pdf)
          </button>
          {resumeFile && <span className="file-label">{resumeFile}</span>}
        </div>
        <label>Resume Text (auto-filled or paste here)</label>
        <textarea
          rows={10}
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste resume text here, or upload a file above..."
        />

        <div className="row">
          <div>
            <label>Target Role</label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Junior Civil Engineer"
            />
          </div>
          <div>
            <label>Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
              <option value="English">English</option>
              <option value="Hebrew">Hebrew</option>
            </select>
          </div>
          <div>
            <label>Rewrite Intensity</label>
            <select value={intensity} onChange={(e) => setIntensity(e.target.value as Intensity)}>
              <option value="Conservative">Conservative</option>
              <option value="Balanced">Balanced</option>
              <option value="Aggressive">Aggressive</option>
            </select>
          </div>
        </div>

        <button
          className="btn btn-primary mt-12"
          onClick={handleImprove}
          disabled={loading || !resumeText.trim()}
        >
          {loading ? <><span className="spinner" /> Improving with AI...</> : 'Improve with AI'}
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
          <div className="preview-panel">
            <h3>{aiResult.name}</h3>
            <p style={{ color: '#718096', marginBottom: 8 }}>{aiResult.title}</p>
            {aiResult.summary && <p style={{ marginBottom: 12, fontSize: 13 }}>{aiResult.summary}</p>}

            {aiResult.experience.length > 0 && (
              <>
                <h3>Experience</h3>
                {aiResult.experience.map((exp, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <strong>{exp.role}</strong> — {exp.company} ({exp.dates})
                    <ul>
                      {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                    </ul>
                  </div>
                ))}
              </>
            )}

            {aiResult.education.length > 0 && (
              <>
                <h3>Education</h3>
                {aiResult.education.map((edu, i) => (
                  <div key={i} style={{ marginBottom: 4, fontSize: 13 }}>
                    {edu.degree} — {edu.institution} ({edu.dates})
                  </div>
                ))}
              </>
            )}

            {aiResult.skills.length > 0 && (
              <>
                <h3>Skills</h3>
                <p style={{ fontSize: 13 }}>{aiResult.skills.join(' • ')}</p>
              </>
            )}

            {aiResult.notes.length > 0 && (
              <>
                <h3 style={{ marginTop: 12 }}>Notes</h3>
                <ul>
                  {aiResult.notes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {/* Template Section */}
      <div className="card">
        <h2>Word Template</h2>
        <div className="row mb-8" style={{ alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={handleUploadTemplate}>
            Upload Word Template (.docx)
          </button>
          {templateName && <span className="file-label">{templateName}</span>}
          <button className="btn btn-link" onClick={() => setShowHelp(true)}>
            How to make a template
          </button>
        </div>

        <button
          className="btn btn-success"
          onClick={handleGenerate}
          disabled={!aiResult || !templatePath || generating}
        >
          {generating ? <><span className="spinner" /> Generating...</> : 'Generate DOCX from Template'}
        </button>

        {!aiResult && <p style={{ fontSize: 13, color: '#a0aec0', marginTop: 8 }}>Run "Improve with AI" first to enable generation.</p>}
        {aiResult && !templatePath && <p style={{ fontSize: 13, color: '#a0aec0', marginTop: 8 }}>Upload a template to enable generation.</p>}
      </div>

      {showHelp && <TemplateHelpModal onClose={() => setShowHelp(false)} />}
    </>
  )
}
