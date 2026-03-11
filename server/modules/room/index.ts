import type { ClientMsg } from './model'
import { Elysia } from 'elysia'
import { requireAuth } from '../auth/guard'
import { jwtPlugin } from '../jwt'
import { roomNameBody, wsQuery } from './model'
import * as RoomService from './service'

export default new Elysia({ prefix: '/rooms' })
  .use(jwtPlugin)

  // Public: list rooms
  .get('/', () => RoomService.listRooms())

  .ws('/ws/:roomId', {
    query: wsQuery,
    async open(ws) {
      const { token } = ws.data.query
      const { roomId: roomIdStr } = ws.data.params
      const roomId = Number(roomIdStr)

      const payload = await ws.data.jwt.verify(token)
      if (!payload || typeof payload.sub !== 'string') {
        ws.close()
        return
      }
      const username = payload.sub

      const [room] = await RoomService.findRoom(roomId)
      if (!room) {
        ws.close()
        return
      }

      if (!RoomService.roomClients.has(roomId))
        RoomService.roomClients.set(roomId, new Map())

      RoomService.roomClients.get(roomId)!.set(ws.raw, {
        username,
        send: data => ws.send(data),
      })

      RoomService.send(roomId, 'join', { username })
    },
    async message(ws, msg) {
      const { roomId: roomIdStr } = ws.data.params
      const roomId = Number(roomIdStr)
      const client = RoomService.roomClients.get(roomId)?.get(ws.raw)
      if (!client)
        return

      const clientMsg = msg as ClientMsg
      if (typeof clientMsg !== 'object' || clientMsg === null || clientMsg.type !== 'message')
        return

      const content = clientMsg.content?.trim()
      if (!content)
        return

      const { saved, userInfo } = await RoomService.saveMessage(roomId, client.username, content)

      RoomService.send(roomId, 'message', {
        id: saved.id,
        username: client.username,
        nickname: userInfo?.nickname ?? client.username,
        avatar: userInfo?.avatar ?? '',
        content: saved.content,
        createdAt: saved.createdAt,
      })
    },

    close(ws) {
      const { roomId: roomIdStr } = ws.data.params
      const roomId = Number(roomIdStr)
      const client = RoomService.roomClients.get(roomId)?.get(ws.raw)
      if (!client)
        return
      RoomService.roomClients.get(roomId)!.delete(ws.raw)
      if (RoomService.roomClients.get(roomId)!.size === 0)
        RoomService.roomClients.delete(roomId)
      RoomService.send(roomId, 'leave', { username: client.username })
    },
  })

  // Authenticated HTTP routes
  .use(requireAuth)

  .post('/', async ({ username, body }) => {
    const [room] = await RoomService.createRoom(username, body.name)
    return room!
  }, {
    body: roomNameBody,
  })

  .get('/:id/messages', ({ params }) => RoomService.listMessages(Number(params.id)))

  .patch('/:id', async ({ username, params, body, status }) => {
    const roomId = Number(params.id)
    const [room] = await RoomService.findRoom(roomId)
    if (!room)
      return status(404, { message: 'error.notFound' })
    if (room.createdBy !== username)
      return status(403, { message: 'error.forbidden' })
    const [updated] = await RoomService.updateRoom(roomId, body.name)
    return updated!
  }, {
    body: roomNameBody,
  })

  .delete('/:id', async ({ username, params, status }) => {
    const roomId = Number(params.id)
    const [room] = await RoomService.findRoom(roomId)
    if (!room)
      return status(404, { message: 'error.notFound' })
    if (room.createdBy !== username)
      return status(403, { message: 'error.forbidden' })
    await RoomService.deleteRoomMessages(roomId)
    await RoomService.deleteRoom(roomId)
    return { ok: true }
  })
