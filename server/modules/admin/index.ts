import type { ElysiaWS } from 'elysia/ws'
import type { AppEvent } from '../events/bus'
import type { LogEntry } from './logger'
import { Elysia, t } from 'elysia'
import { bus } from '../events/bus'
import { adminAuth } from './guard'
import { logBuffer, logListeners } from './logger'
import { deleteTableRow, insertTableRow, queryTable, tableNames, updateTableRow } from './service'

const wsHandlers = new Map<ElysiaWS, {
  logFn: (entry: LogEntry) => void
  eventFn: (event: AppEvent) => void
  heartbeat: ReturnType<typeof setInterval>
}>()

export default new Elysia({ prefix: '/admin' })
  .use(adminAuth)
  .get('/logs', () => logBuffer)
  .get('/tables', () => tableNames)
  .get('/db/:table', ({ params, status }) => {
    const data = queryTable(params.table)
    if (!data)
      return status(400, { message: 'error.badRequest' })
    return data
  })
  .delete('/db/:table', ({ params, body, status }) => {
    const ok = deleteTableRow(params.table, body as Record<string, unknown>)
    if (!ok)
      return status(400, { message: 'error.badRequest' })
    return { ok: true }
  }, { body: t.Record(t.String(), t.Unknown()) })
  .patch('/db/:table', ({ params, body, status }) => {
    const ok = updateTableRow(params.table, body.pk as Record<string, unknown>, body.values as Record<string, unknown>)
    if (!ok)
      return status(400, { message: 'error.badRequest' })
    return { ok: true }
  }, { body: t.Object({ pk: t.Record(t.String(), t.Unknown()), values: t.Record(t.String(), t.Unknown()) }) })
  .post('/db/:table', ({ params, body, status }) => {
    const ok = insertTableRow(params.table, body as Record<string, unknown>)
    if (!ok)
      return status(400, { message: 'error.badRequest' })
    return { ok: true }
  }, { body: t.Record(t.String(), t.Unknown()) })
  .ws('/ws', {
    query: t.Object({ token: t.String() }),
    open(ws) {
      for (const entry of logBuffer)
        ws.send(JSON.stringify(entry))
      const logFn = (entry: LogEntry) => ws.send(JSON.stringify(entry))
      logListeners.add(logFn)
      const eventFn = (event: AppEvent) => ws.send(JSON.stringify({ type: 'event', ...event }))
      bus.on('event', eventFn)
      const heartbeat = setInterval(() => ws.send('{"type":"ping"}'), 5000)
      wsHandlers.set(ws, { logFn, eventFn, heartbeat })
    },
    close(ws) {
      const handler = wsHandlers.get(ws)
      if (handler) {
        logListeners.delete(handler.logFn)
        bus.off('event', handler.eventFn)
        clearInterval(handler.heartbeat)
        wsHandlers.delete(ws)
      }
    },
    message() {},
  })
