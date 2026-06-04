import './PageHeader.css'

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {action && action}
    </div>
  )
}
