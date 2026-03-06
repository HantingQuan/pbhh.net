import { and, desc, eq } from 'drizzle-orm'
import { db, notifications, postLikes, posts, userBindings, userCapabilities, users } from 'server/db'

const TABLES = {
  users: () => db.select().from(users).orderBy(desc(users.createdAt)).limit(200).all(),
  posts: () => db.select().from(posts).orderBy(desc(posts.createdAt)).limit(200).all(),
  user_capabilities: () => db.select().from(userCapabilities).all(),
  user_bindings: () => db.select().from(userBindings).all(),
  post_likes: () => db.select().from(postLikes).all(),
  notifications: () => db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(200).all(),
} as const

export const tableNames = Object.keys(TABLES)

export function queryTable(name: string) {
  const fn = TABLES[name as keyof typeof TABLES]
  if (!fn)
    return null
  return { rows: fn() }
}

type PK = Record<string, unknown>

export function deleteTableRow(table: string, pk: PK): boolean {
  switch (table) {
    case 'posts': {
      const id = Number(pk.id)
      if (!Number.isInteger(id) || id <= 0)
        return false
      db.delete(posts).where(eq(posts.id, id)).run()
      return true
    }
    case 'notifications': {
      const id = Number(pk.id)
      if (!Number.isInteger(id) || id <= 0)
        return false
      db.delete(notifications).where(eq(notifications.id, id)).run()
      return true
    }
    case 'user_capabilities': {
      const { username, capability } = pk
      if (typeof username !== 'string' || typeof capability !== 'string')
        return false
      db.delete(userCapabilities).where(and(eq(userCapabilities.username, username), eq(userCapabilities.capability, capability))).run()
      return true
    }
    case 'post_likes': {
      const postId = Number(pk.postId)
      const { username } = pk
      if (!Number.isInteger(postId) || typeof username !== 'string')
        return false
      db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.username, username))).run()
      return true
    }
    case 'user_bindings': {
      const { username, platform } = pk
      if (typeof username !== 'string' || typeof platform !== 'string')
        return false
      db.delete(userBindings).where(and(eq(userBindings.username, username), eq(userBindings.platform, platform))).run()
      return true
    }
    default:
      return false
  }
}

export function grantCapability(username: string, capability: string) {
  db.insert(userCapabilities).values({ username, capability }).onConflictDoNothing().run()
}
