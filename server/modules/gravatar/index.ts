import type { AppEvent } from '../events/bus'
import { bus } from '../events/bus'
import { registerForUser } from './service'

bus.on('event', (event: AppEvent) => {
  if (event.topic === 'user.registered') {
    // 后台异步执行，不阻塞注册响应
    registerForUser(event.payload.username)
  }
})
