<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

interface LogEntry { level: string, message: string, timestamp: number }

const props = defineProps<{
  logs: LogEntry[]
  autoScroll: boolean
  emptyText: string
}>()

const logEl = ref<HTMLElement | null>(null)

function formatTs(ts: number) {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const LEVEL_CLASS: Record<string, string> = {
  error: 'text-red-400',
  warn: 'text-amber-400',
  info: 'text-sky-400',
  log: 'text-foreground',
  debug: 'text-zinc-400',
  trace: 'text-muted-foreground',
}

function levelClass(level: string) {
  return LEVEL_CLASS[level] ?? 'text-muted-foreground'
}

watch(() => props.logs.length, () => {
  if (props.autoScroll)
    nextTick(() => logEl.value?.scrollTo(0, logEl.value.scrollHeight))
})
</script>

<template>
  <div ref="logEl" class="flex-1 overflow-y-auto font-mono text-xs p-3 space-y-0.5">
    <div
      v-for="(entry, i) in logs"
      :key="i"
      class="flex gap-2 leading-5"
    >
      <span class="text-muted-foreground shrink-0">{{ formatTs(entry.timestamp) }}</span>
      <span class="shrink-0 w-10 uppercase font-semibold" :class="levelClass(entry.level)">{{ entry.level }}</span>
      <span class="break-all whitespace-pre-wrap" :class="levelClass(entry.level)">{{ entry.message }}</span>
    </div>
    <div v-if="logs.length === 0" class="text-muted-foreground py-4 text-center">
      {{ emptyText }}
    </div>
  </div>
</template>
