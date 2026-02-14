const EXAMPLE = `{{name}}
{{title}}

SUMMARY
{{summary}}

EXPERIENCE
{{#experience}}
{{role}} – {{company}} ({{dates}})
{{#bullets}}
• {{.}}
{{/bullets}}
{{/experience}}

PROJECTS
{{#projects}}
{{name}} ({{dates}})
{{#bullets}}
• {{.}}
{{/bullets}}
{{/projects}}

EDUCATION
{{#education}}
{{degree}} – {{institution}} ({{dates}})
{{/education}}

SKILLS
{{#skills}}
• {{.}}
{{/skills}}`

export default function TemplateHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>How to Create a Word Template</h2>
        <p style={{ marginBottom: 14, fontSize: 14 }}>
          Create a <strong>.docx</strong> file in Word with these placeholders.
          Style and format the document however you like — the placeholders will be replaced with data.
        </p>

        <h3 style={{ marginBottom: 6, fontSize: 15 }}>Full Example</h3>
        <pre>{EXAMPLE}</pre>

        <p style={{ fontSize: 13, color: '#718096', marginBottom: 14 }}>
          <strong>Loops:</strong> Use <code>{'{{#experience}}'}</code> ... <code>{'{{/experience}}'}</code> to
          repeat a section. Use <code>{'{{.}}'}</code> inside <code>{'{{#skills}}'}</code> or <code>{'{{#bullets}}'}</code> for
          simple list items.
        </p>

        <button className="btn btn-primary" onClick={onClose}>Got it</button>
      </div>
    </div>
  )
}
