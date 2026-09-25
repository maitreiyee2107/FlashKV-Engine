"use client"

import { useCallback, useState } from "react"
import useSWR from "swr"
import { DashboardHeader } from "../components/dashboard/header"
import { MetricsBar } from "../components/dashboard/metrics-bar"
import { OperationsConsole } from "../components/dashboard/operations-console"
import { MemoryExplorer } from "../components/dashboard/memory-explorer"
import { CliTerminal } from "../components/dashboard/cli-terminal"
import type { LogEntry, Snapshot } from "../lib/flashkv"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function Page() {
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [terminalOpen, setTerminalOpen] = useState(true)

  const { data, isLoading, mutate } = useSWR<Snapshot>("/api/kv", fetcher, {
    refreshInterval: autoRefresh ? 2000 : 0,
    revalidateOnFocus: false,
  })

  const addLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    setLogs((prev) => {
      const next: LogEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
      }
      return [...prev, next].slice(-100)
    })
  }, [])

  const refresh = useCallback(() => {
    mutate()
  }, [mutate])

  return (
    <div className="dark min-h-svh bg-slate-950 text-slate-200">
      {/* ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/4 size-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 size-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
        <DashboardHeader />
        <MetricsBar metrics={data?.metrics} />
        <OperationsConsole onLog={addLog} onChanged={refresh} />
        <MemoryExplorer
          entries={data?.entries ?? []}
          isLoading={isLoading}
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={() => setAutoRefresh((v) => !v)}
          onRefresh={refresh}
          onLog={addLog}
          onChanged={refresh}
        />
        <CliTerminal
          logs={logs}
          open={terminalOpen}
          onToggle={() => setTerminalOpen((v) => !v)}
          onClear={() => setLogs([])}
        />

        <footer className="pb-2 text-center text-xs text-slate-600">
          FlashKV Engine v1.0 · C++ In-Memory Key-Value Store · Profiler active
        </footer>
      </main>
    </div>
  )
}
