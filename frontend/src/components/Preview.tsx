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

function Bullet({ text, onChange }: { text: string; onChange?: (v: string) => void }) {
  const cls = isNoteBullet(text) ? 'inline-note' : undefined
  if (onChange) {
    return (
      <li className={cls}>
        <input
          type="text"
          className="edit-inline"
          value={text}
          onChange={e => onChange(e.target.value)}
        />
      </li>
    )
  }
  return <li className={cls}>{renderBoldMarkdown(text)}</li>
}

/** Inline editable text field */
function EditableText({ value, onChange, tag, style, className }: {
  value: string
  onChange?: (v: string) => void
  tag?: 'h3' | 'p' | 'span' | 'strong'
  style?: React.CSSProperties
  className?: string
}) {
  if (onChange) {
    return (
      <input
        type="text"
        className={`edit-inline ${className || ''}`}
        style={style}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    )
  }
  const Tag = tag || 'span'
  return <Tag style={style} className={className}>{renderBoldMarkdown(value)}</Tag>
}

type SectionKey = 'education' | 'experience' | 'projects'

const DEFAULT_ORDER: SectionKey[] = ['education', 'experience', 'projects']

interface PreviewProps {
  data: ResumeData
  dir?: 'rtl' | 'ltr'
  onChange?: (data: ResumeData) => void
}

export default function Preview({ data, dir, onChange }: PreviewProps) {
  const experience = Array.isArray(data.experience) ? data.experience.filter(Boolean) : []
  const projects = Array.isArray(data.projects) ? data.projects.filter(Boolean) : []
  const education = Array.isArray(data.education) ? data.education.filter(Boolean) : []
  const skills = Array.isArray(data.skills) ? data.skills.filter(Boolean) : []
  const languages = Array.isArray(data.languages) ? data.languages.filter(Boolean) : []
  const notes = Array.isArray(data.notes) ? data.notes.filter(Boolean) : []

  const contactParts = [data.phone, data.email, data.linkedin].filter(Boolean)

  // Helper to update data
  const update = (patch: Partial<ResumeData>) => {
    if (onChange) onChange({ ...data, ...patch })
  }

  const updateBullet = (
    section: 'education' | 'experience' | 'projects',
    itemIdx: number,
    bulletIdx: number,
    value: string
  ) => {
    if (!onChange) return
    const arr = [...(data[section] as any[])]
    const item = { ...arr[itemIdx] }
    const bullets = [...item.bullets]
    bullets[bulletIdx] = value
    item.bullets = bullets
    arr[itemIdx] = item
    update({ [section]: arr })
  }

  // Drag-and-drop state
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>(DEFAULT_ORDER)
  const draggedRef = useRef<SectionKey | null>(null)
  const [dragOverKey, setDragOverKey] = useState<SectionKey | null>(null)

  const onDragStart = (key: SectionKey) => { draggedRef.current = key }
  const onDragOver = (e: React.DragEvent, key: SectionKey) => {
    e.preventDefault()
    if (draggedRef.current && draggedRef.current !== key) setDragOverKey(key)
  }
  const onDragLeave = () => { setDragOverKey(null) }
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
  const onDragEnd = () => { draggedRef.current = null; setDragOverKey(null) }

  // Default headings
  const eduHeading = data.education_heading || (dir === 'rtl' ? 'השכלה וקורסים' : 'Education & Courses')
  const expHeading = data.experience_heading || (dir === 'rtl' ? 'ניסיון תעסוקתי' : 'Experience')
  const projHeading = data.projects_heading || (dir === 'rtl' ? 'פרויקטים' : 'Projects')
  const milHeading = data.military_heading || (dir === 'rtl' ? 'שירות צבאי' : 'Military Service')
  const langHeading = data.languages_heading || (dir === 'rtl' ? 'שפות' : 'Languages')
  const skillHeading = data.skills_heading || (dir === 'rtl' ? 'כישורים' : 'Skills')

  // Section renderers
  const renderEducation = () => education.length > 0 ? (
    <>
      <EditableText tag="h3" value={eduHeading} onChange={onChange ? v => update({ education_heading: v }) : undefined} />
      {education.map((edu, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <strong>{edu.dates}</strong> | {edu.degree || ''} — {edu.institution || ''}
          {Array.isArray(edu.bullets) && edu.bullets.length > 0 && (
            <ul>
              {edu.bullets.map((b, j) => (
                <Bullet key={j} text={b} onChange={onChange ? v => updateBullet('education', i, j, v) : undefined} />
              ))}
            </ul>
          )}
        </div>
      ))}
    </>
  ) : null

  const renderExperience = () => experience.length > 0 ? (
    <>
      <EditableText tag="h3" value={expHeading} onChange={onChange ? v => update({ experience_heading: v }) : undefined} />
      {experience.map((exp, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <strong>{exp.dates}</strong> | {exp.role || ''} — {exp.company || ''}
          <ul>
            {Array.isArray(exp.bullets) && exp.bullets.map((b, j) => (
              <Bullet key={j} text={b} onChange={onChange ? v => updateBullet('experience', i, j, v) : undefined} />
            ))}
          </ul>
        </div>
      ))}
    </>
  ) : null

  const renderProjects = () => projects.length > 0 ? (
    <>
      <EditableText tag="h3" value={projHeading} onChange={onChange ? v => update({ projects_heading: v }) : undefined} />
      {projects.map((proj, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <strong>{proj.name || ''}</strong> ({proj.dates || ''})
          <ul>
            {Array.isArray(proj.bullets) && proj.bullets.map((b, j) => (
              <Bullet key={j} text={b} onChange={onChange ? v => updateBullet('projects', i, j, v) : undefined} />
            ))}
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
      <EditableText tag="h3" value={data.name || '(No name)'} onChange={onChange ? v => update({ name: v }) : undefined} />
      {data.title && <EditableText tag="p" value={data.title} style={{ color: '#718096', marginBottom: 4 }} onChange={onChange ? v => update({ title: v }) : undefined} />}
      {contactParts.length > 0 && (
        <p style={{ fontSize: 12, color: '#a0aec0', marginBottom: 8 }}>{contactParts.join(' | ')}</p>
      )}
      {data.summary && (
        onChange ? (
          <textarea
            className="edit-textarea"
            value={data.summary}
            onChange={e => update({ summary: e.target.value })}
            rows={3}
          />
        ) : (
          <p style={{ marginBottom: 10 }}>{renderBoldMarkdown(data.summary)}</p>
        )
      )}

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
          <EditableText tag="h3" value={milHeading} onChange={onChange ? v => update({ military_heading: v }) : undefined} />
          <div style={{ marginBottom: 6, fontSize: 13 }}>
            <strong>{data.military_service.dates}</strong> | {data.military_service.role}
            {data.military_service.details && <p style={{ margin: '2px 0' }}>{data.military_service.details}</p>}
          </div>
        </>
      )}

      {languages.length > 0 && (
        <>
          <EditableText tag="h3" value={langHeading} onChange={onChange ? v => update({ languages_heading: v }) : undefined} />
          <p>{languages.join(' • ')}</p>
        </>
      )}

      {skills.length > 0 && (
        <>
          <EditableText tag="h3" value={skillHeading} onChange={onChange ? v => update({ skills_heading: v }) : undefined} />
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
