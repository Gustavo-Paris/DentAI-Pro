import { useState } from 'react'
import {
  Award,
  ClipboardCheck,
  Clock,
  TrendingUp,
  TrendingDown,
  Trophy,
  Users,
} from 'lucide-react'
import type {
  ClinicalInsights,
  WeeklyTrendPoint,
  InsightsPeriod,
} from '../../../../design/sections/dashboard/types'

/* ---- helpers ---- */

function formatAvgTime(hours: number | null): string {
  if (hours == null) return '--'
  if (hours < 24) return `${Math.round(hours)}h`
  return `${(hours / 24).toFixed(1)} dias`
}

/* ---- types ---- */

export interface InsightsTabProps {
  insights: ClinicalInsights
  weeklyTrends: WeeklyTrendPoint[]
  patientGrowthThisMonth?: number
  patientGrowthPercent?: number
  initialPeriod?: InsightsPeriod
  onPeriodChange?: (period: InsightsPeriod) => void
}

export default function InsightsTab({
  insights,
  weeklyTrends,
  patientGrowthThisMonth = 0,
  patientGrowthPercent = 0,
  initialPeriod = '12sem',
  onPeriodChange,
}: InsightsTabProps) {
  const [period, setPeriod] = useState<InsightsPeriod>(initialPeriod)

  const handlePeriodChange = (p: InsightsPeriod) => {
    setPeriod(p)
    onPeriodChange?.(p)
  }

  /* ---- area chart math ---- */
  const chartW = 480
  const chartH = 160
  const padTop = 16
  const padBot = 24
  const padLeft = 8
  const padRight = 8
  const plotW = chartW - padLeft - padRight
  const plotH = chartH - padTop - padBot
  const maxVal = Math.max(...weeklyTrends.map((p) => p.value), 1)

  const points = weeklyTrends.map((pt, i) => {
    const x =
      padLeft + (plotW / Math.max(weeklyTrends.length - 1, 1)) * i
    const y = padTop + plotH - (pt.value / maxVal) * plotH
    return { x, y, label: pt.label, value: pt.value }
  })

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ')
  const polygonStr = `${padLeft},${padTop + plotH} ${polylineStr} ${points[points.length - 1].x},${padTop + plotH}`

  const gridYs = [0.25, 0.5, 0.75].map(
    (frac) => padTop + plotH - frac * plotH,
  )

  /* ---- donut chart math ---- */
  const donutCx = 80
  const donutCy = 80
  const donutOuter = 60
  const donutInner = 40
  const donutStrokeW = donutOuter - donutInner
  const donutR = (donutOuter + donutInner) / 2
  const donutCircumference = 2 * Math.PI * donutR
  const totalTreatments = insights.treatmentDistribution.reduce(
    (s, d) => s + d.value,
    0,
  )

  let cumulativeOffset = 0
  const donutSegments = insights.treatmentDistribution.map((seg) => {
    const segmentLength =
      (seg.value / totalTreatments) * donutCircumference
    const offset = cumulativeOffset
    cumulativeOffset += segmentLength
    return { ...seg, segmentLength, offset }
  })

  /* ---- top resins ---- */
  const topResins = insights.topResins.slice(0, 5)
  const maxResinCount = Math.max(...topResins.map((r) => r.count), 1)

  const isPositiveGrowth = patientGrowthPercent >= 0

  const periodOptions: { key: InsightsPeriod; label: string }[] = [
    { key: '8sem', label: '8 sem' },
    { key: '12sem', label: '12 sem' },
    { key: '26sem', label: '26 sem' },
  ]

  return (
    <div className="space-y-4">
      {/* Period Filter */}
      <div className="glass-panel rounded-xl px-3 py-2 flex items-center gap-1 w-fit" style={{ animation: 'fade-in-up 0.6s ease-out 0.1s both' }}>
        {periodOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => handlePeriodChange(opt.key)}
            className={`px-3 py-1 text-xs font-medium transition-colors
              focus-visible:ring-2 focus-visible:ring-ring rounded-full
              ${
                period === opt.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Weekly Trends */}
      <div className="glass-panel rounded-xl card-elevated p-5" style={{ animation: 'fade-in-up 0.6s ease-out 0.15s both' }}>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-heading">
            Tendencia Semanal
          </h3>
          <p className="text-xs text-muted-foreground">
            Avaliacoes por semana
          </p>
        </div>

        <svg
          width="100%"
          height="160"
          viewBox={`0 0 ${chartW} ${chartH}`}
          preserveAspectRatio="none"
          className="overflow-visible"
          aria-label="Grafico de tendencia semanal"
          role="img"
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-primary)"
                stopOpacity="0.3"
              />
              <stop
                offset="100%"
                stopColor="var(--color-primary)"
                stopOpacity="0.05"
              />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridYs.map((gy, i) => (
            <line
              key={i}
              x1={padLeft}
              y1={gy}
              x2={chartW - padRight}
              y2={gy}
              stroke="var(--color-border)"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.5"
            />
          ))}

          <polygon points={polygonStr} fill="url(#areaGrad)" />

          <polyline
            points={polylineStr}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3}
              fill="var(--color-primary)"
            />
          ))}

          {points.map((p, i) =>
            i % 2 === 0 ? (
              <text
                key={i}
                x={p.x}
                y={chartH - 4}
                textAnchor="middle"
                fontSize="10"
                fill="var(--color-muted-foreground)"
              >
                {p.label}
              </text>
            ) : null,
          )}
        </svg>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ animation: 'fade-in-up 0.6s ease-out 0.2s both' }}>
        {/* Treatment Distribution */}
        <div className="glass-panel rounded-xl card-elevated p-5">
          <h3 className="text-sm font-semibold text-heading mb-4">
            Distribuicao de Tratamentos
          </h3>
          <div className="flex flex-col items-center">
            <svg
              width="160"
              height="160"
              viewBox="0 0 160 160"
              aria-label="Grafico de distribuicao de tratamentos"
              role="img"
            >
              <circle
                cx={donutCx}
                cy={donutCy}
                r={donutR}
                fill="none"
                stroke="var(--color-muted)"
                strokeWidth={donutStrokeW}
              />
              {donutSegments.map((seg, i) => (
                <circle
                  key={i}
                  cx={donutCx}
                  cy={donutCy}
                  r={donutR}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={donutStrokeW}
                  strokeDasharray={`${seg.segmentLength} ${donutCircumference - seg.segmentLength}`}
                  strokeDashoffset={-seg.offset}
                  transform={`rotate(-90 ${donutCx} ${donutCy})`}
                  strokeLinecap="butt"
                />
              ))}
              <text
                x={donutCx}
                y={donutCy - 4}
                textAnchor="middle"
                fontSize="22"
                fontWeight="700"
                fill="var(--color-foreground)"
              >
                {totalTreatments}
              </text>
              <text
                x={donutCx}
                y={donutCy + 14}
                textAnchor="middle"
                fontSize="10"
                fill="var(--color-muted-foreground)"
              >
                total
              </text>
            </svg>

            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {insights.treatmentDistribution.map((seg) => (
                <div
                  key={seg.label}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span>{seg.label}</span>
                  <span className="font-medium text-foreground">
                    {seg.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Resinas */}
        <div className="glass-panel rounded-xl card-elevated p-5">
          <h3 className="text-sm font-semibold text-heading mb-4">
            Top Resinas
          </h3>
          <div className="space-y-4">
            {topResins.map((resin, i) => {
              const pct = (resin.count / maxResinCount) * 100
              return (
                <div key={resin.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {i === 0 && (
                        <Trophy className="w-3.5 h-3.5 text-warning shrink-0" />
                      )}
                      <span className="text-xs font-medium text-foreground truncate">
                        {resin.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums ml-2 shrink-0">
                      {resin.count}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-primary/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Clinical Summary */}
      <div className="glass-panel rounded-xl card-elevated p-5" style={{ animation: 'fade-in-up 0.6s ease-out 0.25s both' }}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Resina mais usada
              </span>
            </div>
            <p className="text-lg font-semibold text-foreground truncate">
              {insights.topResin ?? '--'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">
              Uso do inventario
            </span>
            <p className="text-lg font-semibold text-foreground">
              {insights.inventoryRate}%
            </p>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${insights.inventoryRate}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Total avaliados
              </span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {insights.totalEvaluated}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Tempo medio
              </span>
            </div>
            <p className="text-lg font-semibold text-foreground">
              {formatAvgTime(insights.avgCompletionHours)}
            </p>
          </div>
        </div>
      </div>

      {/* Patient Growth */}
      <div className="glass-panel rounded-xl card-elevated p-4 flex items-center justify-between" style={{ animation: 'fade-in-up 0.6s ease-out 0.3s both' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10 shrink-0">
            <Users className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Pacientes este mes
            </p>
            <p className="text-3xl font-bold text-foreground leading-none mt-0.5">
              {patientGrowthThisMonth}
            </p>
          </div>
        </div>

        <div
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            isPositiveGrowth
              ? 'bg-success/10 text-success'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {isPositiveGrowth ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          <span>
            {isPositiveGrowth ? '+' : ''}
            {patientGrowthPercent}%
          </span>
        </div>
      </div>
    </div>
  )
}
