"use client"

import { useEffect, useRef } from "react"
import { ChevronDown, TerminalSquare, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatLatency, type LogEntry } from "@/lib/flashkv"

const levelColor: Record<LogEntry["level"], string> = {
  SET: "text-cyan-400",
  GET: "text-emerald-400",
  DEL: "text-red-400",
  SYS: "text-slate-500",
}

function statusColor(status: number) {
  if (status >= 200 && status < 300) return "text-emerald-400"
  if (status === 404) return "text-amber-400"
  return "text-red-400"
}

function formatClock(ts: number) {
  const d = new Date(ts)
  const pad = (n: number, l = 2) => n.toString().padStart(l, "0")
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

type Props = {
  logs: LogEntry[]
  open: boolean
  onToggle: () => void
  onClear: () => void
}

export function CliTerminal({ logs, open, onToggle, onClear }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, open])

  return (
    <section
      aria-label="CLI terminal"
      className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80"
    >
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-sm font-medium text-slate-200 outline-none"
          aria-expanded={open}
        >
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-red-500/70" />
            <span className="size-2.5 rounded-full bg-amber-500/70" />
            <span className="size-2.5 rounded-full bg-emerald-500/70" />
          </span>
          <TerminalSquare className="size-4 text-cyan-300" aria-hidden="true" />
          flashkv@localhost:~
          <span className="rounded-md border border-slate-700 bg-slate-800/60 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
            {logs.length} logs
          </span>
        </button>
        <div className="flex items-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onClear}
            aria-label="Clear terminal"
            className="text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          >
            <Trash className="size-3.5" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onToggle}
            aria-label={open ? "Collapse terminal" : "Expand terminal"}
            className="text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          >
            <ChevronDown className={`size-4 transition-transform ${open ? "" : "rotate-180"}`} />
          </Button>
        </div>
      </div>

      {open ? (
        <div ref={scrollRef} className="max-h-64 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
          {logs.length === 0 ? (
            <p className="text-slate-600">
              <span className="text-emerald-400">$</span> waiting for commands… execute SET / GET / DEL to see logs.
            </p>
          ) : (
            <ul className="space-y-1">
              {logs.map((log) => (
                <li key={log.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-slate-600">{formatClock(log.timestamp)}</span>
                  <span className="text-emerald-500">$</span>
                  <span className={`font-semibold ${levelColor[log.level]}`}>{log.level}</span>
                  <span className="text-slate-300">{log.command.replace(/^\w+\s/, "")}</span>
                  <span className={`ml-auto ${statusColor(log.status)}`}>
                    {log.status} {log.statusText}
                  </span>
                  {log.latencyUs != null ? (
                    <span className="text-cyan-500/80">[{formatLatency(log.latencyUs)}]</span>
                  ) : null}
                  <span className="w-full pl-6 text-slate-500">↳ {log.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  )
}
