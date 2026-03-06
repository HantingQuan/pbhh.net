<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

interface EventEntry { topic: string, payload: unknown, timestamp: number }

const props = defineProps<{
  entries: EventEntry[]
  autoScroll: boolean
}>()

const logEl = ref<HTMLElement | null>(null)

function formatTs(ts: number) {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

watch(() => props.entries.length, () => {
  if (props.autoScroll)
    nextTick(() => logEl.value?.scrollTo(0, logEl.value.scrollHeight))
})
</script>

<template>
  <div ref="logEl" class="flex-1 overflow-y-auto font-mono text-xs p-3 space-y-0.5">
    <div
      v-for="(entry, i) in entries"
      :key="i"
      class="flex gap-2 leading-5"
    >
      <span class="text-muted-foreground shrink-0">{{ formatTs(entry.timestamp) }}</span>
      <span class="shrink-0 text-blue-500 font-semibold">{{ entry.topic }}</span>
      <span class="break-all whitespace-pre-wrap text-muted-foreground">{{ JSON.stringify(entry.payload) }}</span>
    </div>
    <div v-if="entries.length === 0" class="text-muted-foreground py-4 text-center">
      暂无事件
    </div>
  </div>
</template>
