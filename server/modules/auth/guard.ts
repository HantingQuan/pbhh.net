import { Elysia } from 'elysia'
import { jwtPlugin } from '../jwt'

export const optionalAuth = new Elysia({ name: 'optional-auth' })
  .use(jwtPlugin)
  .derive({ as: 'scoped' }, async ({ headers, jwt }) => {
    const authorization = headers.authorization ?? ''
    if (!authorization.startsWith('Bearer '))
      return { username: undefined }
    const payload = await jwt.verify(authorization.slice(7))
    if (!payload || typeof payload.sub !== 'string')
      return { username: undefined }
    return { username: payload.sub }
  })

export const requireAuth = new Elysia({ name: 'require-auth' })
  .use(jwtPlugin)
  .derive({ as: 'scoped' }, async ({ headers, jwt, status }) => {
    const authorization = headers.authorization ?? ''
    if (!authorization.startsWith('Bearer '))
      return status(401, { message: 'error.unauthorized' })
    const payload = await jwt.verify(authorization.slice(7))
    if (!payload || typeof payload.sub !== 'string')
      return status(401, { message: 'error.unauthorized' })
    return { username: payload.sub }
  })
