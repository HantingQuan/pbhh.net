export interface LogEntry {
  level: 'trace' | 'debug' | 'log' | 'info' | 'warn' | 'error'
  message: string
  timestamp: number
}

const MAX_LOGS = Number(Bun.env.MAX_LOGS) || 500
export const logBuffer: LogEntry[] = []
export const logListeners = new Set<(entry: LogEntry) => void>()

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
  }
}

console.trace = capture('trace', console.trace.bind(console))
console.debug = capture('debug', console.debug.bind(console))
console.log = capture('log', console.log.bind(console))
console.info = capture('info', console.info.bind(console))
console.warn = capture('warn', console.warn.bind(console))
console.error = capture('error', console.error.bind(console))
