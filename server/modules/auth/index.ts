import { jwt } from '@elysiajs/jwt'
import { bus } from '@server/event/bus'
import { Elysia } from 'elysia'
import { loginBody, signupBody, updateProfileBody } from './model'
import * as AuthService from './service'

export default new Elysia()
  .use(jwt({
    name: 'jwt',
    secret: Bun.env.JWT_SECRET ?? 'dev-secret-please-change-in-production',
    exp: '7d',
  }))
  .post('/login', async ({ body, status, jwt }) => {
    const user = await AuthService.verify(body.username, body.password)
    if (!user)
      return status(401, { message: 'error.invalidCredentials' })
    return { token: await jwt.sign({ sub: user.username }) }
  }, {
    body: loginBody,
    error({ error, status }) {
      return status(400, { message: 'error.badRequest', detail: error })
    },
  })
  .post('/signup', async ({ body, status, jwt }) => {
    const user = await AuthService.create(body)
    if (!user)
      return status(409, { message: 'error.usernameExists' })
    bus.publish('user.registered', { username: user.username })
    return status(201, { token: await jwt.sign({ sub: user.username }) })
  }, {
    body: signupBody,
    error({ error, status }) {
      return status(400, { message: 'error.badRequest', detail: error })
    },
  })
  .get('/me', async ({ headers, jwt, status }) => {
    const authorization = headers.authorization ?? ''
    if (!authorization.startsWith('Bearer '))
      return status(401, { message: 'error.unauthorized' })
    const payload = await jwt.verify(authorization.slice(7))
    if (!payload || typeof payload.sub !== 'string')
      return status(401, { message: 'error.tokenExpired' })
    const user = AuthService.getByUsername(payload.sub)
    if (!user)
      return status(404, { message: 'error.userNotFound' })
    return user
  })
  .patch('/me', async ({ headers, jwt, status, body }) => {
    const authorization = headers.authorization ?? ''
    if (!authorization.startsWith('Bearer '))
      return status(401, { message: 'error.unauthorized' })
    const payload = await jwt.verify(authorization.slice(7))
    if (!payload || typeof payload.sub !== 'string')
      return status(401, { message: 'error.tokenExpired' })
    const user = AuthService.update(payload.sub, body)
    if (!user)
      return status(404, { message: 'error.userNotFound' })
    return user
  }, {
    body: updateProfileBody,
    error({ error, status }) {
      return status(400, { message: 'error.badRequest', detail: error })
    },
  })
