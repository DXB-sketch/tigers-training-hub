import MetaRow from '../shared/MetaRow'
import PitchCanvas from './PitchCanvas'
import PitchLegend from './PitchLegend'
import DrillNav from './DrillNav'
import './DrillSheet.css'

function parseInlineMarkup(text) {
  const parts = text.split(/(<kt>|<\/kt>|<ktd>|<\/ktd>)/g)
  let activeClass = null
  return parts.map((part, i) => {
    if (part === '<kt>') { activeClass = 'kt'; return null }
    if (part === '</kt>') { activeClass = null; return null }
    if (part === '<ktd>') { activeClass = 'ktd'; return null }
    if (part === '</ktd>') { activeClass = null; return null }
    if (!part) return null
    if (activeClass) return <span key={i} className={activeClass}>{part}</span>
    return part
  })
}

function BulletList({ items }) {
  return (
    <ul className="blist">
      {items.map((item, i) => (
        <li key={i}>{parseInlineMarkup(item)}</li>
      ))}
    </ul>
  )
}

export default function DrillSheet({ drill, plan, team, coach, current, total, onPrev, onNext, showNav = true }) {
  if (!drill) return null

  const metaFields = [
    { label: 'Coach', value: coach?.name ?? 'Unknown' },
    { label: 'Duration', value: drill.duration, gold: true },
    { label: 'Format', value: drill.format },
    { label: 'Intensity', value: drill.intensity },
  ]

  const org = drill.organisation

  return (
    <div className="drill-page">
      <div className="drill-page-header">
        <div>
          <div className="drill-header-club">Bribie Island Tigers FC</div>
          <div className="drill-header-session">
            {team?.name ?? ''}&nbsp;&middot;&nbsp;Week {plan?.weekNumber}&nbsp;&middot;&nbsp;{team?.trainingDay ?? ''}
          </div>
        </div>
        <div className="drill-header-right">
          <div className="drill-ex-label">Exercise</div>
          <div className="drill-ex-num">{current}/{total}</div>
        </div>
      </div>

      <MetaRow fields={metaFields} />

      <div className="drill-title-block">
        <div className="drill-cat">{drill.category}</div>
        <div className="drill-name">{drill.title}</div>
        <div className="drill-sub">{drill.subtitle}</div>
      </div>

      <div className="pitch-block">
        <div className="pitch-svg-wrap">
          <PitchCanvas
            crop={drill.pitchCrop}
            players={drill.players}
            arrows={drill.arrows}
            elements={drill.elements}
            goalSize="medium"
          />
        </div>
        <PitchLegend />
      </div>

      <div className="content-cols">
        <div>
          <div className="col-section">
            <span className="sh">Description</span>
            <BulletList items={drill.description} />
          </div>
          <div className="col-section">
            <span className="sh">Setup</span>
            <BulletList items={drill.setup} />
          </div>
        </div>

        <div>
          <div className="col-section">
            <span className="sh">Organisation</span>
            <div className="org-grid">
              {org && Object.entries(org).map(([key, val]) => (
                <div key={key}>
                  <div className="org-item-label">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                  <div className="org-item-val">{val}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-section">
            <span className="sh">Progressions</span>
            <BulletList items={drill.progressions} />
          </div>
          <div className="col-section">
            <span className="sh">Coaching points</span>
            <BulletList items={drill.coachingPoints} />
          </div>
        </div>
      </div>

      {showNav && <DrillNav current={current} total={total} onPrev={onPrev} onNext={onNext} />}

      <div className="page-footer">
        <div className="footer-txt">Bribie Island Tigers FC &middot; 2026</div>
        <div className="footer-txt">
          {team?.name} &middot; Week {plan?.weekNumber} &middot; Page {current} of {total}
        </div>
      </div>
    </div>
  )
}
