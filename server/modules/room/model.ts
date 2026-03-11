import { t } from 'elysia'

// ── WS message types ──────────────────────────────────────────────────────────

/** Messages sent from client → server */
export interface ClientMessageMap {
  message: { content: string }
}

/** Messages sent from server → client */
export interface ServerMessageMap {
  message: { id: number, username: string, nickname: string, avatar: string, content: string, createdAt: Date }
  join: { username: string }
  leave: { username: string }
}

export type ClientMsg = { [K in keyof ClientMessageMap]: { type: K } & ClientMessageMap[K] }[keyof ClientMessageMap]

export interface RoomClient {
  username: string
  send: (data: string) => void
}

// ── Elysia schemas ────────────────────────────────────────────────────────────

export const roomNameBody = t.Object({ name: t.String({ minLength: 2, maxLength: 50 }) })

export const wsQuery = t.Object({ token: t.String() })
