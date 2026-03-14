import type { Capability, SignUpBody, UpdateProfileBody, UserProfile } from './model'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db, userCapabilities, users } from 'server/db'

export async function verify(username: string, password: string) {
  const user = db.select().from(users).where(eq(users.username, username)).get()
  if (user && await bcrypt.compare(password, user.password)) {
    return user
  }
}

export async function create({ username, nickname, password }: SignUpBody) {
  const existing = db.select().from(users).where(eq(users.username, username)).get()
  if (existing)
    return null
  db.insert(users).values({
    username,
    nickname,
    password: await bcrypt.hash(password, 8),
  }).run()
  return { username }
}

export function getByUsername(username: string): UserProfile | undefined {
  return db.select({
    username: users.username,
    nickname: users.nickname,
    avatar: users.avatar,
  }).from(users).where(eq(users.username, username)).get()
}

export async function update(username: string, data: UpdateProfileBody) {
  db.update(users).set({
    ...(data.nickname !== undefined && { nickname: data.nickname }),
    ...(data.avatar !== undefined && { avatar: data.avatar }),
  }).where(eq(users.username, username)).run()
  return getByUsername(username)
}

export function getCapabilities(username: string): Capability[] {
  return db
    .select({ capability: userCapabilities.capability })
    .from(userCapabilities)
    .where(eq(userCapabilities.username, username))
    .all()
    .map(row => row.capability) as Capability[]
}
