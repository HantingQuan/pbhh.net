import { asc, eq } from 'drizzle-orm'
import { Elysia, t } from 'elysia'
import { db, roomMessages, rooms, users } from '../../db'
import { requireAuth } from '../auth/guard'
import { jwtPlugin } from '../jwt'

// ── In-memory room WS clients ─────────────────────────────────────────────────

interface RoomClient {
  username: string
  send: (data: string) => void
}

const roomClients = new Map<number, Map<object, RoomClient>>()

function broadcastRoom(roomId: number, data: string) {
  const clients = roomClients.get(roomId)
  if (!clients)
    return
  for (const client of clients.values())
    client.send(data)
}

// ── Module ────────────────────────────────────────────────────────────────────

export default new Elysia({ prefix: '/rooms' })
  .use(jwtPlugin)

  // Public: list rooms
  .get('/', async () => {
    return db
      .select({
        id: rooms.id,
        name: rooms.name,
        createdBy: rooms.createdBy,
        createdAt: rooms.createdAt,
      })
      .from(rooms)
      .orderBy(asc(rooms.createdAt))
  })

  // WS: real-time room chat (auth via token query param, defined BEFORE requireAuth)
  .ws('/ws', {
    query: t.Object({
      token: t.String(),
      roomId: t.String(),
    }),
    async open(ws) {
      const { token, roomId: roomIdStr } = ws.data.query
      const roomId = Number(roomIdStr)

      const payload = await ws.data.jwt.verify(token)
      if (!payload || typeof payload.sub !== 'string') {
        ws.close()
        return
      }
      const username = payload.sub

      const [room] = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.id, roomId))
      if (!room) {
        ws.close()
        return
      }

      if (!roomClients.has(roomId))
        roomClients.set(roomId, new Map())

      roomClients.get(roomId)!.set(ws.raw, {
        username,
        send: data => ws.send(data),
      })

      // Tell everyone someone joined
      broadcastRoom(roomId, JSON.stringify({ type: 'join', username }))
    },

    async message(ws, msg) {
      const { roomId: roomIdStr } = ws.data.query
      const roomId = Number(roomIdStr)
      const client = roomClients.get(roomId)?.get(ws.raw)
      if (!client)
        return

      if (typeof msg !== 'object' || msg === null || (msg as any).type !== 'message')
        return

      const content = ((msg as any).content as string | undefined)?.trim()
      if (!content)
        return

      const [saved] = await db
        .insert(roomMessages)
        .values({ roomId, username: client.username, content })
        .returning()

      const [userInfo] = await db
        .select({ nickname: users.nickname, avatar: users.avatar })
        .from(users)
        .where(eq(users.username, client.username))

      broadcastRoom(
        roomId,
        JSON.stringify({
          type: 'message',
          id: saved!.id,
          username: client.username,
          nickname: userInfo?.nickname ?? client.username,
          avatar: userInfo?.avatar ?? '',
          content: saved!.content,
          createdAt: saved!.createdAt,
        }),
      )
    },

    close(ws) {
      const { roomId: roomIdStr } = ws.data.query
      const roomId = Number(roomIdStr)
      const client = roomClients.get(roomId)?.get(ws.raw)
      if (!client)
        return
      roomClients.get(roomId)!.delete(ws.raw)
      if (roomClients.get(roomId)!.size === 0)
        roomClients.delete(roomId)
      broadcastRoom(roomId, JSON.stringify({ type: 'leave', username: client.username }))
    },
  })

  // Authenticated HTTP routes
  .use(requireAuth)

  .post('/', async ({ username, body }) => {
    const [room] = await db
      .insert(rooms)
      .values({ name: body.name, createdBy: username })
      .returning()
    return room!
  }, {
    body: t.Object({ name: t.String({ minLength: 2, maxLength: 50 }) }),
  })

  .get('/:id/messages', async ({ params }) => {
    const roomId = Number(params.id)
    return db
      .select({
        id: roomMessages.id,
        content: roomMessages.content,
        createdAt: roomMessages.createdAt,
        username: roomMessages.username,
        nickname: users.nickname,
        avatar: users.avatar,
      })
      .from(roomMessages)
      .innerJoin(users, eq(roomMessages.username, users.username))
      .where(eq(roomMessages.roomId, roomId))
      .orderBy(asc(roomMessages.createdAt))
      .limit(200)
  })

  .patch('/:id', async ({ username, params, body, status }) => {
    const roomId = Number(params.id)
    const [room] = await db.select({ createdBy: rooms.createdBy }).from(rooms).where(eq(rooms.id, roomId))
    if (!room)
      return status(404, { message: 'error.notFound' })
    if (room.createdBy !== username)
      return status(403, { message: 'error.forbidden' })
    const [updated] = await db.update(rooms).set({ name: body.name }).where(eq(rooms.id, roomId)).returning()
    return updated!
  }, {
    body: t.Object({ name: t.String({ minLength: 2, maxLength: 50 }) }),
  })

  .delete('/:id', async ({ username, params, status }) => {
    const roomId = Number(params.id)
    const [room] = await db.select({ createdBy: rooms.createdBy }).from(rooms).where(eq(rooms.id, roomId))
    if (!room)
      return status(404, { message: 'error.notFound' })
    if (room.createdBy !== username)
      return status(403, { message: 'error.forbidden' })
    await db.delete(roomMessages).where(eq(roomMessages.roomId, roomId))
    await db.delete(rooms).where(eq(rooms.id, roomId))
    return { ok: true }
  })
