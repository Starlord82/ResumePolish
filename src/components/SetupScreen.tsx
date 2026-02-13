import { useState, useEffect } from 'react'

const RECOMMENDED_MODEL = 'llama3.1:8b'

interface Props {
  onContinue: (model: string) => void
}

export default function SetupScreen({ onContinue }: Props) {
  const [checking, setChecking] = useState(true)
  const [available, setAvailable] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [selected, setSelected] = useState('')
  const [pulling, setPulling] = useState(false)
  const [pullLog, setPullLog] = useState('')

  const checkOllama = async () => {
    setChecking(true)
    try {
      const result = await window.api.ollamaCheck()
      setAvailable(result.available)
      setModels(result.models)
      if (result.models.length > 0) {
        setSelected(result.models[0])
      }
    } catch {
      setAvailable(false)
    }
    setChecking(false)
  }

  useEffect(() => {
    checkOllama()
  }, [])

  const handlePull = async () => {
    setPulling(true)
    setPullLog('')
    const cleanup = window.api.onPullProgress((data) => {
      setPullLog((prev) => prev + data)
    })
    const result = await window.api.ollamaPull(RECOMMENDED_MODEL)
    cleanup()
    setPulling(false)
    if (result.success) {
      await checkOllama()
    }
  }

  if (checking) {
    return (
      <div className="card">
        <p><span className="spinner" /> Checking Ollama availability...</p>
      </div>
    )
  }

  if (!available) {
    return (
      <div className="card">
        <div className="error-box">
          Ollama is not running. Please install and start Ollama.
        </div>
        <div className="row gap-8">
          <button
            className="btn btn-primary"
            onClick={() => window.api.openExternal('https://ollama.com/download')}
          >
            Open Ollama Download Page
          </button>
          <button className="btn btn-secondary" onClick={checkOllama}>
            Re-check
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="success-box">Ollama is running!</div>

      {models.length === 0 ? (
        <>
          <p className="mb-8">No models installed. We recommend pulling <strong>{RECOMMENDED_MODEL}</strong>.</p>
          <button className="btn btn-primary mb-8" onClick={handlePull} disabled={pulling}>
            {pulling ? <><span className="spinner" /> Pulling...</> : `Pull ${RECOMMENDED_MODEL}`}
          </button>
          {pullLog && <div className="log-area">{pullLog}</div>}
        </>
      ) : (
        <>
          <label>Select Model</label>
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button
            className="btn btn-success mt-12"
            onClick={() => onContinue(selected)}
            disabled={!selected}
          >
            Continue
          </button>
        </>
      )}
    </div>
  )
}
