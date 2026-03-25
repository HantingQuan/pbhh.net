import { t } from 'elysia'

export const username = t.String({ minLength: 3, maxLength: 20, pattern: '^\\w+$' })
export const nickname = t.String({ minLength: 1, maxLength: 20 })
export const password = t.String({ minLength: 8, maxLength: 20 })
export const avatar = t.String({ minLength: 1, maxLength: 100 })
export const capability = t.Union([
  t.Literal('admin'),
  t.Literal('admin:view'),
  t.Literal('admin:edit'),
  t.Literal('admin:update'),
  t.Literal('northern'),
])
export const capabilities = t.Array(capability)

export type Capability = typeof capability.static

export interface UserProfile {
  username: string
  nickname: string
  avatar: string
}

export const signUpBody = t.Object({
  username,
  nickname,
  password,
})
export type SignUpBody = typeof signUpBody.static

export const loginBody = t.Object({
  username,
  password,
})
export type LoginBody = typeof loginBody.static

export const updateProfileBody = t.Object({
  nickname: t.Optional(nickname),
  avatar: t.Optional(avatar),
})
export type UpdateProfileBody = typeof updateProfileBody.static
