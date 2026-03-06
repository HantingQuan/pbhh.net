import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export interface LogEntry {
  level: 'trace' | 'debug' | 'log' | 'info' | 'warn' | 'error'
  message: string
  timestamp: number
}

const MAX_LOGS = Number(Bun.env.MAX_LOGS) || 500
export const logBuffer: LogEntry[] = []
export const logListeners = new Set<(entry: LogEntry) => void>()

const dataDir = resolve(import.meta.dir, '../../../data')
const logFile = resolve(dataDir, 'server.log')

// Load existing logs from file on startup
if (existsSync(logFile)) {
  try {
    const lines = readFileSync(logFile, 'utf-8').split('\n').filter(Boolean)
    const entries = lines
      .map((line) => { try { return JSON.parse(line) as LogEntry } catch { return null } })
      .filter((e): e is LogEntry => e !== null)
    logBuffer.push(...entries.slice(-MAX_LOGS))
  }
  catch {}
}

function capture(level: LogEntry['level'], origin: (...args: unknown[]) => void) {
  return (...args: unknown[]) => {
    origin(...args)
    const message = args.map((arg) => {
      if (typeof arg === 'string')
        return arg
      if (arg instanceof Error)
        return `${arg.name}: ${arg.message}`
      return JSON.stringify(arg)
    }).join(' ')
    const entry: LogEntry = { level, message, timestamp: Date.now() }
    if (logBuffer.length >= MAX_LOGS)
      logBuffer.shift()
    logBuffer.push(entry)
    for (const fn of logListeners)
      fn(entry)
    try {
      if (!existsSync(dataDir))
        mkdirSync(dataDir, { recursive: true })
      appendFileSync(logFile, `${JSON.stringify(entry)}\n`)
    }
    catch {}
  }
}

console.trace = capture('trace', console.trace.bind(console))
console.debug = capture('debug', console.debug.bind(console))
console.log = capture('log', console.log.bind(console))
console.info = capture('info', console.info.bind(console))
console.warn = capture('warn', console.warn.bind(console))
console.error = capture('error', console.error.bind(console))
