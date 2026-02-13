interface Props {
  onClose: () => void
}

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

EDUCATION
{{#education}}
{{degree}} – {{institution}} ({{dates}})
{{/education}}

SKILLS
{{#skills}}
• {{.}}
{{/skills}}`

export default function TemplateHelpModal({ onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>How to Create a Word Template</h2>
        <p className="mb-16">
          Create a <strong>.docx</strong> file in Word with the following placeholders.
          Style and format the document however you like — the placeholders will be replaced with actual data.
        </p>

        <h3 style={{ marginBottom: 8 }}>Supported Placeholders</h3>
        <pre>{EXAMPLE}</pre>

        <p style={{ fontSize: 13, color: '#718096', marginBottom: 16 }}>
          <strong>Loops:</strong> Use <code>{'{{#experience}}'}</code> ... <code>{'{{/experience}}'}</code> to repeat a section for each entry.
          Use <code>{'{{.}}'}</code> inside <code>{'{{#skills}}'}</code> or <code>{'{{#bullets}}'}</code> for simple array items.
        </p>

        <button className="btn btn-primary" onClick={onClose}>Got it</button>
      </div>
    </div>
  )
}
