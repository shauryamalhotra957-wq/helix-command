import { Activity, TrendingUp } from 'lucide-react'
import type { ForecastPoint } from '../engine/types'

interface ForecastChartProps {
  points: ForecastPoint[]
}

function pathFor(points: ForecastPoint[], key: keyof ForecastPoint, max: number, height: number) {
  if (points.length === 0) return ''
  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100
      const y = height - (Number(point[key]) / max) * height
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

export function ForecastChart({ points }: ForecastChartProps) {
  const resiliencePath = pathFor(points, 'resilience', 100, 60)
  const demandMax = Math.max(...points.map((point) => point.openDemand), 1)
  const demandPath = pathFor(points, 'openDemand', demandMax, 60)
  const final = points.at(-1)

  return (
    <section className="panel forecast-panel" aria-label="Mission forecast">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">T+180 forecast</p>
          <h2>Resilience trajectory</h2>
        </div>
        <div className="chart-legend">
          <span>
            <TrendingUp size={14} aria-hidden="true" />
            Resilience
          </span>
          <span>
            <Activity size={14} aria-hidden="true" />
            Open demand
          </span>
        </div>
      </div>
      <svg className="forecast-chart" viewBox="0 0 100 72" preserveAspectRatio="none" role="img">
        <title>Forecast showing resilience rising and open demand falling over 180 minutes</title>
        <defs>
          <linearGradient id="resilience-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(98, 255, 198, 0.28)" />
            <stop offset="100%" stopColor="rgba(98, 255, 198, 0)" />
          </linearGradient>
        </defs>
        <g className="forecast-grid">
          <line x1="0" x2="100" y1="15" y2="15" />
          <line x1="0" x2="100" y1="30" y2="30" />
          <line x1="0" x2="100" y1="45" y2="45" />
          <line x1="0" x2="100" y1="60" y2="60" />
        </g>
        <path d={`${resiliencePath} L 100 60 L 0 60 Z`} className="forecast-fill" />
        <path d={demandPath} className="forecast-line forecast-line--demand" />
        <path d={resiliencePath} className="forecast-line forecast-line--resilience" />
      </svg>
      <div className="forecast-summary">
        <span>{final?.resilience ?? 0}% final resilience</span>
        <span>{final?.openDemand ?? 0} open demand</span>
        <span>{final?.publicTrust ?? 0}% public trust</span>
      </div>
    </section>
  )
}
