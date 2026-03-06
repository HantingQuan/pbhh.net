import { EventEmitter } from 'node:events'

export interface AppEvent {
  topic: string
  payload: unknown
  timestamp: number
}

class EventBus extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(0)
  }

  publish(topic: string, payload: unknown): void {
    const event: AppEvent = { topic, payload, timestamp: Date.now() }
    this.emit('event', event)
  }
}

export const bus = new EventBus()
