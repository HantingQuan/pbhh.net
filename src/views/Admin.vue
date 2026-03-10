<script setup lang="ts">
import type { LogEntry } from './admin/AdminLog.vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { user } from '@/lib/api'
import AdminDatabase from './admin/AdminDatabase.vue'
import AdminLog from './admin/AdminLog.vue'

const router = useRouter()

onMounted(() => {
  if (!user.value?.capabilities.includes('admin'))
    router.replace('/')
})

// ── Tabs ──────────────────────────────────────────────────────────────────────
type Tab = keyof typeof TABS
const TABS = {
  backend: '服务端日志',
  database: '数据库',
}

function getTabFromHash(): Tab {
  const hash = location.hash.slice(1) as Tab
  return Object.keys(TABS).includes(hash) ? hash : 'backend'
}

const tab = ref<Tab>(getTabFromHash())

function setTab(t: Tab) {
  tab.value = t
  history.replaceState(history.state, '', `#${t}`)
}

window.addEventListener('hashchange', () => {
  tab.value = getTabFromHash()
})

// ── Backend logs (WebSocket) ──────────────────────────────────────────────────
const LOG_PAGE_SIZE = 500
const backendLogs = ref<LogEntry[]>([])
const autoScroll = ref(true)
const logPage = ref(0)

// ── Historical logs ────────────────────────────────────────────────────────────
const authHeaders = computed(() => ({ Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` }))
const logDates = ref<string[]>([])
const selectedDate = ref('') // '' = 实时

const historyLogs = ref<LogEntry[]>([])
const historyLoading = ref(false)

const displayLogs = computed(() => selectedDate.value ? historyLogs.value : backendLogs.value)
const totalLogPages = computed(() => Math.max(1, Math.ceil(displayLogs.value.length / LOG_PAGE_SIZE)))
const pagedLogs = computed(() => displayLogs.value.slice(logPage.value * LOG_PAGE_SIZE, (logPage.value + 1) * LOG_PAGE_SIZE))

async function loadLogDates() {
  const res = await fetch('/api/admin/log-dates', { headers: authHeaders.value })
  if (res.ok)
    logDates.value = await res.json()
}

async function loadHistoryLogs(date: string) {
  historyLoading.value = true
  historyLogs.value = []
  logPage.value = 0
  const res = await fetch(`/api/admin/logs/${date}`, { headers: authHeaders.value })
  if (res.ok)
    historyLogs.value = await res.json()
  historyLoading.value = false
  logPage.value = totalLogPages.value - 1
}

watch(selectedDate, (date) => {
  logPage.value = 0
  if (date)
    loadHistoryLogs(date)
  else
    logPage.value = totalLogPages.value - 1
})

watch(() => backendLogs.value.length, () => {
  if (autoScroll.value && !selectedDate.value)
    logPage.value = totalLogPages.value - 1
})
watch(autoScroll, (val) => {
  if (val && !selectedDate.value)
    logPage.value = totalLogPages.value - 1
})

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

function connectWS() {
  const token = localStorage.getItem('token') ?? ''
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  ws = new WebSocket(`${protocol}//${location.host}/api/admin/ws?token=${encodeURIComponent(token)}`)
  ws.onmessage = ({ data }) => {
    try {
      const parsed = JSON.parse(data)
      if (parsed.type === 'ping' || parsed.type === 'event')
        return
      backendLogs.value.push(parsed)
      if (backendLogs.value.length > 1000)
        backendLogs.value.shift()
    }
    catch {}
  }
  ws.onclose = () => {
    reconnectTimer = setTimeout(connectWS, 3000)
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(() => {
  connectWS()
  loadLogDates()
})

onUnmounted(() => {
  ws?.close()
  if (reconnectTimer)
    clearTimeout(reconnectTimer)
})
</script>

<template>
  <div class="w-full flex flex-col h-[calc(100vh-4em)]">
    <!-- Header -->
    <div class="border-b px-4 py-3 flex items-center gap-4 shrink-0">
      <span class="font-bold">Admin</span>
      <div class="flex gap-1">
        <Button
          v-for="(label, key) in TABS"
          :key="key"
          :variant="tab === key ? 'default' : 'ghost'"
          size="sm"
          @click="setTab(key as Tab)"
        >
          {{ label }}
        </Button>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <template v-if="tab === 'backend'">
          <select
            v-model="selectedDate"
            class="text-xs border rounded px-2 py-1 bg-background text-foreground"
          >
            <option value="">实时</option>
            <option v-for="d in logDates" :key="d" :value="d">
              {{ d }}
            </option>
          </select>
          <template v-if="!selectedDate">
            <label class="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input v-model="autoScroll" type="checkbox" class="size-3">
              自动滚动
            </label>
          </template>
          <template v-if="totalLogPages > 1">
            <Button variant="ghost" size="sm" :disabled="logPage === 0" @click="logPage--">‹</Button>
            <span class="text-xs text-muted-foreground">{{ logPage + 1 }}/{{ totalLogPages }}</span>
            <Button variant="ghost" size="sm" :disabled="logPage >= totalLogPages - 1" @click="logPage++">›</Button>
          </template>
          <Button v-if="!selectedDate" variant="outline" size="sm" @click="backendLogs = []">
            清空
          </Button>
        </template>
      </div>
    </div>

    <!-- Content -->
    <AdminLog
      v-show="tab === 'backend'"
      :logs="pagedLogs"
      :auto-scroll="autoScroll && !selectedDate"
      :empty-text="historyLoading ? '加载中…' : '等待日志…'"
    />
    <AdminDatabase v-show="tab === 'database'" />
  </div>
</template>
