import { Elysia } from 'elysia'
import { requireAuth } from '../auth/guard'
import { getByUsername } from '../auth/service'

export const adminAuth = new Elysia({ name: 'admin-auth' })
  .use(requireAuth)
  .onBeforeHandle(({ username, status }) => {
    if (!getByUsername(username)?.capabilities.includes('admin'))
      return status(403, { message: 'error.forbidden' })
  })
