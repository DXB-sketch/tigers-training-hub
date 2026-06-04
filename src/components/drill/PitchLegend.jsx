import './PitchLegend.css'

export default function PitchLegend() {
  return (
    <div className="pitch-legend">
      <div className="legend-item">
        <span className="legend-dot" style={{ background: '#c01818' }} />
        Red: defending / pressing team
      </div>
      <div className="legend-item">
        <span className="legend-dot" style={{ background: '#1a4ba8' }} />
        Blue: attacking / building team
      </div>
      <div className="legend-item">
        <span className="legend-line-move" />
        Player run
      </div>
      <div className="legend-item">
        <span className="legend-line-pass" />
        Pass option
      </div>
    </div>
  )
}
