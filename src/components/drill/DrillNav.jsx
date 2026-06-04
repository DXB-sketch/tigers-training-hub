import './DrillNav.css'

export default function DrillNav({ current, total, onPrev, onNext }) {
  return (
    <div className="drill-nav">
      <button
        className="nav-btn"
        onClick={onPrev}
        disabled={current <= 1}
        aria-label="Previous drill"
      >
        &#8592; Prev
      </button>
      <div className="nav-dots">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`nav-dot${i + 1 === current ? ' active' : ''}`}
          />
        ))}
      </div>
      <button
        className="nav-btn"
        onClick={onNext}
        disabled={current >= total}
        aria-label="Next drill"
      >
        Next &#8594;
      </button>
    </div>
  )
}
