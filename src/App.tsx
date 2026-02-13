import { useState } from 'react'
import type { ResumeData } from './types'
import SetupScreen from './components/SetupScreen'
import EditorScreen from './components/EditorScreen'
import Toast from './components/Toast'

export default function App() {
  const [screen, setScreen] = useState<'setup' | 'editor'>('setup')
  const [selectedModel, setSelectedModel] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="app">
      <h1>ResumePolish</h1>
      <p className="subtitle">Improve student resumes with local AI</p>

      {screen === 'setup' ? (
        <SetupScreen
          onContinue={(model) => {
            setSelectedModel(model)
            setScreen('editor')
          }}
        />
      ) : (
        <EditorScreen model={selectedModel} showToast={showToast} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
