"use client"

import { useState } from "react"
import { ArrowDownToLine, Search, Trash2, Terminal, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatLatency, type LogEntry } from "@/lib/flashkv"

type Props = {
  onLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void
  onChanged: () => void
}

const inputClass =
  "h-9 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 font-mono text-sm text-slate-100 placeholder:text-slate-600 transition-colors outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  )
}

type QueryResult = {
  ok: boolean
  status: number
  statusText: string
  value?: string
  latencyUs?: number
} | null

export function OperationsConsole({ onLog, onChanged }: Props) {
  const [setKey, setSetKey] = useState("")
  const [setValue, setSetValue] = useState("")
  const [queryKey, setQueryKey] = useState("")
  const [busy, setBusy] = useState<null | "set" | "get" | "del">(null)
  const [result, setResult] = useState<QueryResult>(null)

  async function executeSet() {
    if (!setKey.trim() || busy) return
    setBusy("set")
    try {
      const res = await fetch("/api/kv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: setKey.trim(), value: setValue }),
      })
      const data = await res.json()
      onLog({
        level: "SET",
        command: `SET ${setKey.trim()} "${setValue}"`,
        status: data.status,
        statusText: data.statusText,
        latencyUs: data.latencyUs,
        message: res.ok ? `stored key "${setKey.trim()}"` : data.error ?? "failed",
      })
      if (res.ok) {
        onChanged()
        setSetKey("")
        setSetValue("")
      }
    } finally {
      setBusy(null)
    }
  }

  async function executeGet() {
    if (!queryKey.trim() || busy) return
    setBusy("get")
    try {
      const res = await fetch(`/api/kv?key=${encodeURIComponent(queryKey.trim())}`)
      const data = await res.json()
      setResult({
        ok: data.found,
        status: data.status,
        statusText: data.statusText,
        value: data.value,
        latencyUs: data.latencyUs,
      })
      onLog({
        level: "GET",
        command: `GET ${queryKey.trim()}`,
        status: data.status,
        statusText: data.statusText,
        latencyUs: data.latencyUs,
        message: data.found ? `"${data.value}"` : "(nil) key not found",
      })
    } finally {
      setBusy(null)
    }
  }

  async function executeDel() {
    if (!queryKey.trim() || busy) return
    setBusy("del")
    try {
      const res = await fetch(`/api/kv?key=${encodeURIComponent(queryKey.trim())}`, { method: "DELETE" })
      const data = await res.json()
      setResult({
        ok: data.ok,
        status: data.status,
        statusText: data.statusText,
        value: data.ok ? "(deleted)" : undefined,
        latencyUs: data.latencyUs,
      })
      onLog({
        level: "DEL",
        command: `DEL ${queryKey.trim()}`,
        status: data.status,
        statusText: data.statusText,
        latencyUs: data.latencyUs,
        message: data.ok ? `removed key "${queryKey.trim()}"` : "(nil) key not found",
      })
      if (data.ok) onChanged()
    } finally {
      setBusy(null)
    }
  }

  return (
    <section aria-label="Operations console" className="grid gap-4 lg:grid-cols-2">
      {/* SET card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10">
            <ArrowDownToLine className="size-4 text-cyan-300" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">SET Command</h2>
            <p className="text-xs text-slate-500">Write a value into memory</p>
          </div>
        </div>

        <div className="space-y-3">
          <Field label="Key">
            <input
              className={inputClass}
              placeholder="session:8f3a"
              value={setKey}
              onChange={(e) => setSetKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) executeSet()
              }}
            />
          </Field>
          <Field label="Value">
            <input
              className={inputClass}
              placeholder="user_2Nx91kLq"
              value={setValue}
              onChange={(e) => setSetValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) executeSet()
              }}
            />
          </Field>
          <Button
            onClick={executeSet}
            disabled={!setKey.trim() || busy === "set"}
            className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-40"
          >
            <ArrowDownToLine className="size-4" />
            {busy === "set" ? "Executing…" : "Execute SET"}
          </Button>
        </div>
      </div>

      {/* GET / DEL card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
            <Search className="size-4 text-emerald-300" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">GET / DEL Command</h2>
            <p className="text-xs text-slate-500">Read or remove a key</p>
          </div>
        </div>

        <div className="space-y-3">
          <Field label="Key">
            <input
              className={inputClass}
              placeholder="session:8f3a"
              value={queryKey}
              onChange={(e) => setQueryKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) executeGet()
              }}
            />
          </Field>

          <div className="flex gap-2">
            <Button
              onClick={executeGet}
              disabled={!queryKey.trim() || busy === "get"}
              className="flex-1 bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-40"
            >
              <Search className="size-4" />
              Query Key
            </Button>
            <Button
              onClick={executeDel}
              disabled={!queryKey.trim() || busy === "del"}
              variant="outline"
              className="flex-1 border-red-500/30 bg-red-500/5 text-red-300 hover:bg-red-500/15"
            >
              <Trash2 className="size-4" />
              Delete Key
            </Button>
          </div>

          <div className="min-h-16 rounded-lg border border-slate-800 bg-slate-950/70 p-3 font-mono text-sm">
            {result ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      result.ok ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {result.ok ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                    {result.status} {result.statusText}
                  </span>
                  <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[11px] text-cyan-300">
                    Latency: {formatLatency(result.latencyUs)}
                  </span>
                </div>
                <div className="break-all text-slate-200">
                  {result.ok ? result.value : <span className="text-slate-500">(nil) key not found</span>}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Terminal className="size-3.5" />
                Awaiting query… results appear here with latency profiling.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
