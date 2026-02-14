import type { ResumeData } from '../types'

export default function Preview({ data, dir }: { data: ResumeData; dir?: 'rtl' | 'ltr' }) {
  const experience = Array.isArray(data.experience) ? data.experience.filter(Boolean) : []
  const projects = Array.isArray(data.projects) ? data.projects.filter(Boolean) : []
  const education = Array.isArray(data.education) ? data.education.filter(Boolean) : []
  const skills = Array.isArray(data.skills) ? data.skills.filter(Boolean) : []
  const notes = Array.isArray(data.notes) ? data.notes.filter(Boolean) : []

  return (
    <div className="preview" dir={dir}>
      <h3>{data.name || '(No name)'}</h3>
      {data.title && <p style={{ color: '#718096', marginBottom: 6 }}>{data.title}</p>}
      {data.summary && <p style={{ marginBottom: 10 }}>{data.summary}</p>}

      {experience.length > 0 && (
        <>
          <h3>Experience</h3>
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <strong>{exp.role || ''}</strong> — {exp.company || ''} ({exp.dates || ''})
              <ul>
                {Array.isArray(exp.bullets) && exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}

      {projects.length > 0 && (
        <>
          <h3>Projects</h3>
          {projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <strong>{proj.name || ''}</strong> ({proj.dates || ''})
              <ul>
                {Array.isArray(proj.bullets) && proj.bullets.map((b, j) => <li key={j}>{b}</li>)}
              </ul>
            </div>
          ))}
        </>
      )}

      {education.length > 0 && (
        <>
          <h3>Education</h3>
          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: 4, fontSize: 13 }}>
              {edu.degree || ''} — {edu.institution || ''} ({edu.dates || ''})
            </div>
          ))}
        </>
      )}

      {skills.length > 0 && (
        <>
          <h3>Skills</h3>
          <p>{skills.join(' • ')}</p>
        </>
      )}

      {notes.length > 0 && (
        <>
          <h3 style={{ marginTop: 10 }}>Notes</h3>
          <ul>
            {notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </>
      )}
    </div>
  )
}
