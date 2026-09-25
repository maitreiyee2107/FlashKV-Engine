"use client"

import { useEffect, useState } from "react"
import { Activity, Database, Gauge, Timer, type LucideIcon } from "lucide-react"
import { type EngineMetrics, formatBytes, formatLatency, formatUptime } from "@/lib/flashkv"

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: LucideIcon
  label: string
  value: string
  unit?: string
  accent: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <Icon className={`size-4 ${accent}`} aria-hidden="true" />
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-mono text-xl font-semibold text-slate-50 tabular-nums">{value}</span>
        {unit ? <span className="font-mono text-xs text-slate-500">{unit}</span> : null}
      </div>
    </div>
  )
}

export function MetricsBar({ metrics }: { metrics?: EngineMetrics }) {
  // Local ticking uptime so the clock advances smoothly between fetches.
  const [uptimeMs, setUptimeMs] = useState(metrics?.uptimeMs ?? 0)

  useEffect(() => {
    if (metrics?.uptimeMs == null) return
    setUptimeMs(metrics.uptimeMs)
    const base = metrics.uptimeMs
    const started = Date.now()
    const id = setInterval(() => setUptimeMs(base + (Date.now() - started)), 1000)
    return () => clearInterval(id)
  }, [metrics?.uptimeMs])

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        icon={Database}
        label="Memory Used"
        value={formatBytes(metrics?.memoryBytes ?? 0)}
        accent="text-cyan-400"
      />
      <MetricCard
        icon={Activity}
        label="Active Keys"
        value={(metrics?.activeKeys ?? 0).toLocaleString()}
        accent="text-emerald-400"
      />
      <MetricCard
        icon={Gauge}
        label="Avg Latency"
        value={metrics?.avgLatencyUs ? formatLatency(metrics.avgLatencyUs) : "< 100 µs"}
        accent="text-cyan-400"
      />
      <MetricCard
        icon={Timer}
        label="Uptime"
        value={formatUptime(uptimeMs)}
        accent="text-emerald-400"
      />
    </div>
  )
}
