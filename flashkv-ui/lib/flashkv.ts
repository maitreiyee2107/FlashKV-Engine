export type KvEntry = {
  key: string
  value: string
  type: "String"
  lastModified: number
}

export type EngineMetrics = {
  memoryBytes: number
  activeKeys: number
  avgLatencyUs: number
  uptimeMs: number
}

export type Snapshot = {
  entries: KvEntry[]
  metrics: EngineMetrics
  latencyUs: number
  status: number
  statusText: string
}

export type LogLevel = "SET" | "GET" | "DEL" | "SYS"

export type LogEntry = {
  id: string
  timestamp: number
  level: LogLevel
  command: string
  status: number
  statusText: string
  message: string
  latencyUs?: number
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export function formatLatency(us?: number): string {
  if (us == null) return "—"
  if (us < 1000) return `${us} µs`
  return `${(us / 1000).toFixed(2)} ms`
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const s = Math.floor(diff / 1000)
  if (s < 5) return "just now"
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function nowStamp(): string {
  const d = new Date()
  const pad = (n: number, l = 2) => n.toString().padStart(l, "0")
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}
