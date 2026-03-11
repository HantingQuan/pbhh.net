import { asc, eq } from 'drizzle-orm'
import { db, roomMessages, rooms, users } from '../../db'
import type { RoomClient, ServerMessageMap } from './model'

// ── In-memory room WS clients ─────────────────────────────────────────────────

export const roomClients = new Map<number, Map<object, RoomClient>>()

export function broadcastRoom(roomId: number, data: string) {
  const clients = roomClients.get(roomId)
  if (!clients)
    return
  for (const client of clients.values())
    client.send(data)
}

export function send<T extends keyof ServerMessageMap>(roomId: number, type: T, payload: ServerMessageMap[T]) {
  broadcastRoom(roomId, JSON.stringify({ type, ...payload }))
}

// ── DB operations ─────────────────────────────────────────────────────────────

export function listRooms() {
  return db
    .select({
      id: rooms.id,
      name: rooms.name,
      createdBy: rooms.createdBy,
      createdAt: rooms.createdAt,
    })
    .from(rooms)
    .orderBy(asc(rooms.createdAt))
}

export function findRoom(roomId: number) {
  return db.select({ id: rooms.id, createdBy: rooms.createdBy }).from(rooms).where(eq(rooms.id, roomId))
}

export function createRoom(username: string, name: string) {
  return db.insert(rooms).values({ name, createdBy: username }).returning()
}

export function updateRoom(roomId: number, name: string) {
  return db.update(rooms).set({ name }).where(eq(rooms.id, roomId)).returning()
}

export function deleteRoom(roomId: number) {
  return db.delete(rooms).where(eq(rooms.id, roomId))
}

export function deleteRoomMessages(roomId: number) {
  return db.delete(roomMessages).where(eq(roomMessages.roomId, roomId))
}

export async function saveMessage(roomId: number, username: string, content: string) {
  const [saved] = await db
    .insert(roomMessages)
    .values({ roomId, username, content })
    .returning()

  const [userInfo] = await db
    .select({ nickname: users.nickname, avatar: users.avatar })
    .from(users)
    .where(eq(users.username, username))

  return { saved: saved!, userInfo }
}

export function listMessages(roomId: number) {
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
}
