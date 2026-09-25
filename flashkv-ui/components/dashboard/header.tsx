import { Cpu } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="relative flex size-11 items-center justify-center rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 shadow-[0_0_24px_-6px] shadow-cyan-500/40">
          <Cpu className="size-6 text-cyan-300" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-slate-50 sm:text-xl">FlashKV Engine</h1>
            <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-cyan-300">
              v1.0
            </span>
            <span className="hidden rounded-md border border-slate-700 bg-slate-800/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-400 sm:inline">
              C++
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">In-Memory Key-Value Storage Engine</p>
        </div>
      </div>

      <div
        className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 sm:self-auto"
        role="status"
        aria-live="polite"
      >
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_2px] shadow-emerald-400/60" />
        </span>
        <span className="text-xs font-medium text-emerald-300">Engine Online</span>
        <span className="font-mono text-[11px] text-emerald-400/70">Port 8080</span>
      </div>
    </header>
  )
}
