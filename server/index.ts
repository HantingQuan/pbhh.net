import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'
import auth from './modules/auth'
import event from './modules/event'

const app = new Elysia({ prefix: '/api' })
  .use(cors())
  .use(auth)
  .use(event)
  .listen(3000)

export type App = typeof app

// eslint-disable-next-line no-console
console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`)
