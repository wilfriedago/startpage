import './day-tooltip.css'

import { useStore } from '../store'

export function Tooltip() {
  const { tip } = useStore()
  if (!tip) {
    return null
  }

  return (
    <div className="tooltip" style={{ left: tip.x, top: tip.y }}>
      {tip.text}
    </div>
  )
}
