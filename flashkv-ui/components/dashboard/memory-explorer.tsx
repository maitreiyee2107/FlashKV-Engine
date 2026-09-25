"use client"

import { useMemo, useState } from "react"
import { Check, Copy, Database, RefreshCw, Search, Trash2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { relativeTime, type KvEntry, type LogEntry } from "@/lib/flashkv"

type Props = {
  entries: KvEntry[]
  isLoading: boolean
  autoRefresh: boolean
  onToggleAutoRefresh: () => void
  onRefresh: () => void
  onLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void
  onChanged: () => void
}

export function MemoryExplorer({
  entries,
  isLoading,
  autoRefresh,
  onToggleAutoRefresh,
  onRefresh,
  onLog,
  onChanged,
}: Props) {
  const [query, setQuery] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => e.key.toLowerCase().includes(q) || e.value.toLowerCase().includes(q))
  }, [entries, query])

  async function copyValue(entry: KvEntry) {
    try {
      await navigator.clipboard.writeText(entry.value)
      setCopied(entry.key)
      setTimeout(() => setCopied((c) => (c === entry.key ? null : c)), 1200)
    } catch {
      // clipboard unavailable
    }
  }

  async function deleteKey(key: string) {
    setDeleting(key)
    try {
      const res = await fetch(`/api/kv?key=${encodeURIComponent(key)}`, { method: "DELETE" })
      const data = await res.json()
      onLog({
        level: "DEL",
        command: `DEL ${key}`,
        status: data.status,
        statusText: data.statusText,
        latencyUs: data.latencyUs,
        message: data.ok ? `removed key "${key}"` : "(nil) key not found",
      })
      if (data.ok) onChanged()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <section
      aria-label="Live RAM memory explorer"
      className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60"
    >
      <div className="flex flex-col gap-3 border-b border-slate-800 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10">
            <Database className="size-4 text-cyan-300" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Live RAM Memory Explorer</h2>
            <p className="text-xs text-slate-500">
              {filtered.length} of {entries.length} keys
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 lg:w-64 lg:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input
              className="h-8 w-full rounded-lg border border-slate-800 bg-slate-950/60 pl-8 pr-3 font-mono text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20"
              placeholder="Filter keys…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleAutoRefresh}
            aria-pressed={autoRefresh}
            className={
              autoRefresh
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                : "border-slate-700 bg-slate-800/40 text-slate-400 hover:bg-slate-800"
            }
          >
            <Zap className={autoRefresh ? "size-3.5 fill-emerald-300" : "size-3.5"} />
            Auto {autoRefresh ? "On" : "Off"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            className="border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className={isLoading ? "size-3.5 animate-spin" : "size-3.5"} />
            Refresh Snapshot
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-500">
              <th className="px-4 py-2.5 font-medium">Key Name</th>
              <th className="px-4 py-2.5 font-medium">Value</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Last Modified</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                  {entries.length === 0 ? "Memory is empty — run a SET command." : "No keys match your filter."}
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr
                  key={entry.key}
                  className="border-b border-slate-800/60 transition-colors last:border-0 hover:bg-slate-800/30"
                >
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-cyan-300">{entry.key}</span>
                  </td>
                  <td className="max-w-[280px] px-4 py-2.5">
                    <span className="block truncate font-mono text-slate-200" title={entry.value}>
                      {entry.value || <span className="text-slate-600">(empty)</span>}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-md border border-slate-700 bg-slate-800/60 px-1.5 py-0.5 font-mono text-[11px] text-slate-400">
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-400">{relativeTime(entry.lastModified)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => copyValue(entry)}
                        aria-label={`Copy value of ${entry.key}`}
                        className="text-slate-400 hover:bg-slate-700/50 hover:text-cyan-300"
                      >
                        {copied === entry.key ? (
                          <Check className="size-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => deleteKey(entry.key)}
                        disabled={deleting === entry.key}
                        aria-label={`Delete ${entry.key}`}
                        className="text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className={deleting === entry.key ? "size-3.5 animate-pulse" : "size-3.5"} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
