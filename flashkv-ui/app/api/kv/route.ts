import { NextResponse } from "next/server"

// FlashKV in-memory engine simulation.
// State is stored on globalThis so it survives Next.js HMR / module reloads
// during development (mimicking a long-lived C++ engine process).

type Entry = {
  value: string
  type: "String"
  lastModified: number
}

type EngineState = {
  store: Map<string, Entry>
  startTime: number
  latencies: number[]
}

const g = globalThis as unknown as { __flashkv?: EngineState }

function getState(): EngineState {
  if (!g.__flashkv) {
    const store = new Map<string, Entry>()
    const now = Date.now()
    const seed: Array<[string, string]> = [
      ["session:8f3a", "user_2Nx91kLq"],
      ["cache:homepage", "<html><body>...</body></html>"],
      ["feature:dark_mode", "enabled"],
      ["rate_limit:api", "4821"],
      ["config:max_conns", "1024"],
    ]
    seed.forEach(([k, v], i) => {
      store.set(k, { value: v, type: "String", lastModified: now - (seed.length - i) * 45000 })
    })
    g.__flashkv = { store, startTime: now, latencies: [] }
  }
  return g.__flashkv
}

// Simulate a realistic sub-millisecond profiler reading (microseconds).
function recordLatency(state: EngineState, base: number): number {
  const jitter = Math.random() * base * 0.8
  const us = Math.round(base + jitter)
  state.latencies.push(us)
  if (state.latencies.length > 200) state.latencies.shift()
  return us
}

function bytesOf(state: EngineState): number {
  let bytes = 0
  for (const [k, e] of state.store) {
    bytes += k.length + e.value.length + 24 // entry overhead
  }
  return bytes
}

function avgLatency(state: EngineState): number {
  if (state.latencies.length === 0) return 0
  const sum = state.latencies.reduce((a, b) => a + b, 0)
  return Math.round(sum / state.latencies.length)
}

function snapshot(state: EngineState) {
  const entries = Array.from(state.store.entries())
    .map(([key, e]) => ({ key, value: e.value, type: e.type, lastModified: e.lastModified }))
    .sort((a, b) => b.lastModified - a.lastModified)

  return {
    entries,
    metrics: {
      memoryBytes: bytesOf(state),
      activeKeys: state.store.size,
      avgLatencyUs: avgLatency(state),
      uptimeMs: Date.now() - state.startTime,
    },
  }
}

export async function GET(request: Request) {
  const state = getState()
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")

  // Single-key lookup (GET command)
  if (key !== null) {
    const latencyUs = recordLatency(state, 90)
    const entry = state.store.get(key)
    if (!entry) {
      return NextResponse.json(
        { found: false, key, latencyUs, status: 404, statusText: "Not Found" },
        { status: 404 },
      )
    }
    return NextResponse.json({
      found: true,
      key,
      value: entry.value,
      type: entry.type,
      lastModified: entry.lastModified,
      latencyUs,
      status: 200,
      statusText: "OK",
    })
  }

  // Full snapshot
  const latencyUs = recordLatency(state, 60)
  return NextResponse.json({ ...snapshot(state), latencyUs, status: 200, statusText: "OK" })
}

export async function POST(request: Request) {
  const state = getState()
  let body: { key?: string; value?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ status: 400, statusText: "Bad Request", error: "Invalid JSON" }, { status: 400 })
  }

  const key = (body.key ?? "").trim()
  const value = body.value ?? ""
  if (!key) {
    return NextResponse.json(
      { status: 400, statusText: "Bad Request", error: "Key is required" },
      { status: 400 },
    )
  }

  const latencyUs = recordLatency(state, 120)
  state.store.set(key, { value, type: "String", lastModified: Date.now() })

  return NextResponse.json({
    ok: true,
    key,
    value,
    latencyUs,
    status: 200,
    statusText: "OK",
  })
}

export async function DELETE(request: Request) {
  const state = getState()
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key") ?? ""
  if (!key) {
    return NextResponse.json(
      { status: 400, statusText: "Bad Request", error: "Key is required" },
      { status: 400 },
    )
  }

  const latencyUs = recordLatency(state, 100)
  const existed = state.store.delete(key)

  if (!existed) {
    return NextResponse.json(
      { ok: false, key, latencyUs, status: 404, statusText: "Not Found" },
      { status: 404 },
    )
  }

  return NextResponse.json({ ok: true, key, latencyUs, status: 200, statusText: "OK" })
}
