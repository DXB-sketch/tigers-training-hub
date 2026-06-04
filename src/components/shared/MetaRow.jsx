import './MetaRow.css'

export default function MetaRow({ fields }) {
  const visible = fields.slice(0, 4)
  return (
    <div className="meta-row">
      {visible.map(({ label, value, gold }) => (
        <div className="meta-item" key={label}>
          <div className="meta-label">{label}</div>
          <div className={`meta-val${gold ? ' meta-val--gold' : ''}`}>{value}</div>
        </div>
      ))}
    </div>
  )
}
