import { Elysia } from 'elysia'
import { requireAuth } from '../auth/guard'
import { confirmBody } from './model'
import * as BindService from './service'

export default new Elysia()
  .post('/bind/qq/confirm', ({ body, status }) => {
    const ok = BindService.confirmByCode(body.code, body.qq)
    if (!ok)
      return status(400, { message: 'bind.invalidCode' })
    return { ok: true }
  }, {
    body: confirmBody,
    error({ error, status }) {
      return status(400, { message: 'error.badRequest', detail: error })
    },
  })
  .use(requireAuth)
  .get('/me/bindings/qq', ({ username }) => ({ qq: BindService.getQQBinding(username) }))
  .post('/me/bindings/qq/request', ({ username }) => ({ code: BindService.generateCode(username) }))
  .delete('/me/bindings/qq', ({ username, status }) => {
    BindService.deleteQQBinding(username)
    return status(204, null)
  })
