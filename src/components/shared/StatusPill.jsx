import './StatusPill.css'

const LABELS = {
  published: 'Published',
  draft: 'Draft',
  error: 'Error',
  'no-coach': 'No coach',
  'no-plan': 'No plan',
  live: 'Live',
}

export default function StatusPill({ status }) {
  return (
    <span className={`status-pill status-pill--${status}`}>
      {LABELS[status] ?? status}
    </span>
  )
}
