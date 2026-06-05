import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { usePlan } from '../hooks/usePlan'
import { useDrills } from '../hooks/useDrills'
import { exportSessionPdf } from '../lib/exportPdf'
import DrillSheet from '../components/drill/DrillSheet'
import './PrintView.css'

export default function PrintView() {
  const { id } = useParams()
  const { plan, team, coach, loading: planLoading } = usePlan(id)
  const { drills, loading: drillsLoading } = useDrills(id)
  const containerRef = useRef(null)
  const [pdfState, setPdfState] = useState(null) // null | 'generating' | 'error'
  const [errorTimer, setErrorTimer] = useState(null)

  if (planLoading || drillsLoading) {
    return <div style={{ padding: 40, fontFamily: 'Arial', fontSize: 12 }}>Loading...</div>
  }

  async function handleDownloadPdf() {
    if (pdfState === 'generating') return
    if (errorTimer) clearTimeout(errorTimer)
    setPdfState('generating')
    try {
      await exportSessionPdf(plan?.title ?? 'session', containerRef.current)
      setPdfState(null)
    } catch {
      setPdfState('error')
      const t = setTimeout(() => setPdfState(null), 4000)
      setErrorTimer(t)
    }
  }

  return (
    <div>
      <div className="print-actions">
        <button className="print-btn" onClick={() => window.print()}>Print</button>
        <button
          className="print-btn print-btn--primary"
          onClick={handleDownloadPdf}
          disabled={pdfState === 'generating'}
        >
          {pdfState === 'generating' ? 'Generating...' : 'Download PDF'}
        </button>
        {pdfState === 'error' && (
          <span className="print-error">Export failed. Try again.</span>
        )}
      </div>
      <div ref={containerRef}>
        {drills.map((drill, i) => (
          <DrillSheet
            key={drill.id}
            drill={drill}
            plan={plan}
            team={team}
            coach={coach}
            current={i + 1}
            total={drills.length}
            showNav={false}
          />
        ))}
      </div>
    </div>
  )
}
