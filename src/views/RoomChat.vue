<script setup lang="ts">
import { ArrowLeft, Send } from 'lucide-vue-next'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import UserAvatar from '@/components/UserAvatar.vue'
import { api, user } from '@/lib/api'

const props = defineProps<{ id: number }>()
const router = useRouter()

interface Message {
  id: number
  username: string
  nickname: string
  avatar: string
  content: string
  createdAt: number | string | Date
}

interface SystemEvent {
  type: 'join' | 'leave'
  username: string
}

type ChatEntry = { kind: 'message', data: Message } | { kind: 'system', data: SystemEvent }

const entries = ref<ChatEntry[]>([])
const draft = ref('')
const roomName = ref('')
const onlineUsers = ref<Set<string>>(new Set())
const messagesEl = ref<HTMLElement | null>(null)
let ws: WebSocket | null = null

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value)
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

async function loadRoom() {
  const token = localStorage.getItem('token') ?? ''

  // Fetch room info (name) from room list
  const { data: roomList } = await api.rooms.get()
  if (roomList) {
    const room = roomList.find(r => r.id === props.id)
    if (room)
      roomName.value = room.name
  }

  // Fetch message history
  const { data: msgs } = await api.rooms({ id: String(props.id) }).messages.get()
  if (msgs) {
    entries.value = (msgs as Message[]).map(m => ({ kind: 'message', data: m }))
    scrollToBottom()
  }

  // Connect WebSocket
  const wsUrl = `${window.location.origin.replace(/^http/, 'ws')}/api/rooms/ws?token=${encodeURIComponent(token)}&roomId=${props.id}`
  ws = new WebSocket(wsUrl)

  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    if (msg.type === 'message') {
      entries.value.push({ kind: 'message', data: msg as Message })
      scrollToBottom()
    }
    else if (msg.type === 'join') {
      onlineUsers.value = new Set([...onlineUsers.value, msg.username])
      entries.value.push({ kind: 'system', data: { type: 'join', username: msg.username } })
    }
    else if (msg.type === 'leave') {
      const next = new Set(onlineUsers.value)
      next.delete(msg.username)
      onlineUsers.value = next
      entries.value.push({ kind: 'system', data: { type: 'leave', username: msg.username } })
    }
  }

  ws.onclose = () => {
    ws = null
  }
}

function send() {
  const content = draft.value.trim()
  if (!content || !ws || ws.readyState !== WebSocket.OPEN)
    return
  ws.send(JSON.stringify({ type: 'message', content }))
  draft.value = ''
}

function formatTime(val: number | string | Date) {
  const d = val instanceof Date ? val : new Date(typeof val === 'number' ? val * 1000 : val)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(loadRoom)
onUnmounted(() => {
  ws?.close()
  ws = null
})
</script>

<template>
  <div class="w-full max-w-2xl mx-auto flex flex-col" style="height: calc(100vh - 4rem)">
    <!-- Header -->
    <div class="flex items-center gap-3 px-4 py-3 border-b shrink-0">
      <button class="text-muted-foreground hover:text-foreground" @click="router.push('/rooms')">
        <ArrowLeft class="size-5" />
      </button>
      <span class="font-semibold text-lg flex-1">{{ roomName || $t('room.unnamed', { id }) }}</span>
      <span class="text-xs text-muted-foreground">{{ $t('room.online', { count: onlineUsers.size }) }}</span>
    </div>

    <!-- Messages -->
    <div ref="messagesEl" class="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
      <div
        v-for="(entry, i) in entries"
        :key="i"
      >
        <!-- System event -->
        <div v-if="entry.kind === 'system'" class="text-center text-xs text-muted-foreground py-1">
          {{ entry.data.username }} {{ entry.data.type === 'join' ? $t('room.joined') : $t('room.left') }}
        </div>

        <!-- Chat message -->
        <div
          v-else
          class="flex gap-2"
          :class="entry.data.username === user?.username ? 'flex-row-reverse' : 'flex-row'"
        >
          <UserAvatar
            :username="entry.data.username"
            :nickname="entry.data.nickname"
            :avatar="entry.data.avatar"
            size="size-8"
            class="shrink-0 mt-0.5"
          />
          <div
            class="flex flex-col gap-0.5 max-w-[70%]"
            :class="entry.data.username === user?.username ? 'items-end' : 'items-start'"
          >
            <span class="text-xs text-muted-foreground px-1">
              {{ entry.data.nickname }}
              <span class="ml-1">{{ formatTime(entry.data.createdAt) }}</span>
            </span>
            <div
              class="rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words"
              :class="entry.data.username === user?.username
                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                : 'bg-muted rounded-tl-sm'"
            >
              {{ entry.data.content }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="border-t px-4 py-3 flex gap-2 items-end shrink-0">
      <Textarea
        v-model="draft"
        :placeholder="$t('room.messagePlaceholder')"
        rows="1"
        class="flex-1 resize-none max-h-32"
        @keydown.enter.exact.prevent="send"
      />
      <Button :disabled="!draft.trim()" size="sm" @click="send">
        <Send class="size-4" />
      </Button>
    </div>
  </div>
</template>
