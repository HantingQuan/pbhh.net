<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'

const { t } = useI18n()

const boundQQ = ref<string | null>(null)
const bindCode = ref('')
const requesting = ref(false)
const unbinding = ref(false)
const bindError = ref('')
let pollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  const { data } = await api.me.bindings.qq.get()
  if (data)
    boundQQ.value = data.qq ?? null
})

onUnmounted(() => stopPolling())

async function requestCode() {
  requesting.value = true
  bindError.value = ''
  try {
    const { data, error: err } = await api.me.bindings.qq.request.post(undefined)
    if (err || !data) {
      bindError.value = t('bind.requestFailed')
      return
    }
    bindCode.value = data.code
    startPolling()
  }
  catch {
    bindError.value = t('bind.requestFailed')
  }
  finally {
    requesting.value = false
  }
}

function startPolling() {
  stopPolling()
  pollTimer = setInterval(async () => {
    const { data } = await api.me.bindings.qq.get()
    if (data?.qq) {
      boundQQ.value = data.qq
      bindCode.value = ''
      stopPolling()
    }
  }, 3000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

function cancelBind() {
  bindCode.value = ''
  bindError.value = ''
  stopPolling()
}

async function unbind() {
  unbinding.value = true
  bindError.value = ''
  try {
    await api.me.bindings.qq.delete()
    boundQQ.value = null
  }
  catch {
    bindError.value = t('bind.unbindFailed')
  }
  finally {
    unbinding.value = false
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-base flex items-center justify-between">
        {{ t('bind.qq') }}
        <span v-if="boundQQ" class="text-xs font-normal text-green-600 dark:text-green-400">
          {{ t('bind.bound') }}
        </span>
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <Alert v-if="bindError" variant="destructive">
        <AlertDescription>{{ bindError }}</AlertDescription>
      </Alert>

      <template v-if="boundQQ">
        <p class="text-sm text-muted-foreground">
          {{ t('bind.currentQQ') }}<strong>{{ boundQQ }}</strong>
        </p>
        <Button variant="outline" class="w-full" :disabled="unbinding" @click="unbind">
          <Spinner v-if="unbinding" data-icon="inline-start" />
          {{ t('bind.unbind') }}
        </Button>
      </template>

      <template v-else-if="!bindCode">
        <p class="text-sm text-muted-foreground">
          {{ t('bind.intro') }}
        </p>
        <Button class="w-full" :disabled="requesting" @click="requestCode">
          <Spinner v-if="requesting" data-icon="inline-start" />
          {{ t('bind.getCode') }}
        </Button>
      </template>

      <template v-else>
        <p class="text-sm text-muted-foreground">
          {{ t('bind.codeHint') }}
        </p>
        <div class="rounded-md bg-muted px-4 py-3 text-center">
          <span class="text-2xl font-mono font-bold tracking-widest">{{ bindCode }}</span>
        </div>
        <p class="text-xs text-muted-foreground text-center">
          {{ t('bind.waitingHint') }}
        </p>
        <div class="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Spinner class="size-3" />
          {{ t('bind.polling') }}
        </div>
        <Button variant="outline" class="w-full" @click="cancelBind">
          {{ t('bind.cancel') }}
        </Button>
      </template>
    </CardContent>
  </Card>
</template>
