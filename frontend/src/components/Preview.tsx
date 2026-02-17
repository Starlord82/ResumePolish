import { useState, useRef } from 'react'
import type { ResumeData } from '../types'

function isNoteBullet(text: string): boolean {
  const lower = text.trimStart().toLowerCase()
  return lower.startsWith('הערה:') || lower.startsWith('הערה -') || lower.startsWith('note:') || lower.startsWith('note -')
}

function renderBoldMarkdown(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    parts.push(<strong key={match.index}>{match[1]}</strong>)
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

function Bullet({ text }: { text: string }) {
  if (isNoteBullet(text)) {
    return <li className="inline-note">{renderBoldMarkdown(text)}</li>
  }
  return <li>{renderBoldMarkdown(text)}</li>
}

type SectionKey = 'education' | 'experience' | 'projects'

const DEFAULT_ORDER: SectionKey[] = ['education', 'experience', 'projects']

export default function Preview({ data, dir }: { data: ResumeData; dir?: 'rtl' | 'ltr' }) {
  const experience = Array.isArray(data.experience) ? data.experience.filter(Boolean) : []
  const projects = Array.isArray(data.projects) ? data.projects.filter(Boolean) : []
  const education = Array.isArray(data.education) ? data.education.filter(Boolean) : []
  const skills = Array.isArray(data.skills) ? data.skills.filter(Boolean) : []
  const languages = Array.isArray(data.languages) ? data.languages.filter(Boolean) : []
  const notes = Array.isArray(data.notes) ? data.notes.filter(Boolean) : []

  const contactParts = [data.phone, data.email, data.linkedin].filter(Boolean)

  // Drag-and-drop state
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(DEFAULT_ORDER)
  const draggedRef = useRef<SectionKey | null>(null)
  const [dragOverKey, setDragOverKey] = useState<SectionKey | null>(null)

  const onDragStart = (key: SectionKey) => {
    draggedRef.current = key
  }

  const onDragOver = (e: React.DragEvent, key: SectionKey) => {
    e.preventDefault()
    if (draggedRef.current && draggedRef.current !== key) {
      setDragOverKey(key)
    }
  }

  const onDragLeave = () => {
    setDragOverKey(null)
  }

  const onDrop = (key: SectionKey) => {
    setDragOverKey(null)
    const dragged = draggedRef.current
    if (!dragged || dragged === key) return
    setSectionOrder(prev => {
      const next = [...prev]
      const fromIdx = next.indexOf(dragged)
      const toIdx = next.indexOf(key)
      next.splice(fromIdx, 1)
      next.splice(toIdx, 0, dragged)
      return next
    })
    draggedRef.current = null
  }

  const onDragEnd = () => {
    draggedRef.current = null
    setDragOverKey(null)
  }

  // Section renderers
  const renderEducation = () => education.length > 0 ? (
    <>
      <h3>{dir === 'rtl' ? 'השכלה וקורסים' : 'Education & Courses'}</h3>
      {education.map((edu, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <strong>{edu.dates}</strong> | {edu.degree || ''} — {edu.institution || ''}
          {Array.isArray(edu.bullets) && edu.bullets.length > 0 && (
            <ul>
              {edu.bullets.map((b, j) => <Bullet key={j} text={b} />)}
            </ul>
          )}
        </div>
      ))}
    </>
  ) : null

  const renderExperience = () => experience.length > 0 ? (
    <>
      <h3>{dir === 'rtl' ? 'ניסיון תעסוקתי' : 'Experience'}</h3>
      {experience.map((exp, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <strong>{exp.dates}</strong> | {exp.role || ''} — {exp.company || ''}
          <ul>
            {Array.isArray(exp.bullets) && exp.bullets.map((b, j) => <Bullet key={j} text={b} />)}
          </ul>
        </div>
      ))}
    </>
  ) : null

  const renderProjects = () => projects.length > 0 ? (
    <>
      <h3>{dir === 'rtl' ? 'פרויקטים' : 'Projects'}</h3>
      {projects.map((proj, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <strong>{proj.name || ''}</strong> ({proj.dates || ''})
          <ul>
            {Array.isArray(proj.bullets) && proj.bullets.map((b, j) => <Bullet key={j} text={b} />)}
          </ul>
        </div>
      ))}
    </>
  ) : null

  const renderers: Record<SectionKey, () => JSX.Element | null> = {
    education: renderEducation,
    experience: renderExperience,
    projects: renderProjects,
  }

  return (
    <div className="preview" dir={dir}>
      <h3>{data.name || '(No name)'}</h3>
      {data.title && <p style={{ color: '#718096', marginBottom: 4 }}>{data.title}</p>}
      {contactParts.length > 0 && (
        <p style={{ fontSize: 12, color: '#a0aec0', marginBottom: 8 }}>{contactParts.join(' | ')}</p>
      )}
      {data.summary && <p style={{ marginBottom: 10 }}>{renderBoldMarkdown(data.summary)}</p>}

      {/* Draggable sections */}
      {sectionOrder.map(key => {
        const content = renderers[key]()
        if (!content) return null
        return (
          <div
            key={key}
            className={`preview-section${dragOverKey === key ? ' drag-over' : ''}`}
            draggable
            onDragStart={() => onDragStart(key)}
            onDragOver={e => onDragOver(e, key)}
            onDragLeave={onDragLeave}
            onDrop={() => onDrop(key)}
            onDragEnd={onDragEnd}
          >
            <span className="drag-handle" title="Drag to reorder">⠿</span>
            {content}
          </div>
        )
      })}

      {/* Fixed sections */}
      {data.military_service && (
        <>
          <h3>{dir === 'rtl' ? 'שירות צבאי' : 'Military Service'}</h3>
          <div style={{ marginBottom: 6, fontSize: 13 }}>
            <strong>{data.military_service.dates}</strong> | {data.military_service.role}
            {data.military_service.details && <p style={{ margin: '2px 0' }}>{data.military_service.details}</p>}
          </div>
        </>
      )}

      {languages.length > 0 && (
        <>
          <h3>{dir === 'rtl' ? 'שפות' : 'Languages'}</h3>
          <p>{languages.join(' • ')}</p>
        </>
      )}

      {skills.length > 0 && (
        <>
          <h3>{dir === 'rtl' ? 'כישורים' : 'Skills'}</h3>
          <p>{skills.map((s, i) => (
            <span key={i}>{i > 0 && ' • '}{renderBoldMarkdown(s)}</span>
          ))}</p>
        </>
      )}

      {notes.length > 0 && (
        <div className="preview-notes">
          <h3>AI Notes & Suggestions</h3>
          <ul>
            {notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
