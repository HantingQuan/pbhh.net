import type { Capability, SignupBody, UpdateProfileBody, UserProfile } from './model'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db, userCapabilities, users } from 'server/db'

export async function verify(username: string, password: string) {
  const user = db.select().from(users).where(eq(users.username, username)).get()
  if (!user)
    return null
  const isValid = await bcrypt.compare(password, user.password)
  return isValid ? user : null
}

export async function create({ username, nickname, password }: SignupBody) {
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

export function getByUsername(username: string): UserProfile | null {
  const user = db.select({
    username: users.username,
    nickname: users.nickname,
    avatar: users.avatar,
  }).from(users).where(eq(users.username, username)).get()
  if (!user)
    return null
  const capabilities = db.select({ capability: userCapabilities.capability })
    .from(userCapabilities)
    .where(eq(userCapabilities.username, username))
    .all()
    .map(r => r.capability) as Capability[]
  return { ...user, capabilities }
}

export async function update(username: string, data: UpdateProfileBody) {
  db.update(users).set({ nickname: data.nickname, avatar: data.avatar }).where(eq(users.username, username)).run()
  return getByUsername(username)
}
