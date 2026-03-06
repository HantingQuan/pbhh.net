<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { api, unreadCount } from '@/lib/api'

const { t } = useI18n()

const markingAllRead = ref(false)
const allMarked = ref(false)

async function markAllRead() {
  markingAllRead.value = true
  await api.notifications.read.post()
  unreadCount.value = 0
  markingAllRead.value = false
  allMarked.value = true
}

type NotifType = 'like' | 'reply' | 'post'
const NOTIF_TYPES: NotifType[] = ['like', 'reply', 'post']

const notifPrefs = ref<Record<NotifType, boolean>>({ like: true, reply: true, post: true })

onMounted(async () => {
  const { data } = await api.me['notification-prefs'].get()
  if (data)
    notifPrefs.value = data as Record<NotifType, boolean>
})

watch(notifPrefs, prefs => api.me['notification-prefs'].patch({ ...prefs }), { deep: true })
</script>

<template>
  <div class="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle class="text-base">{{ t('settings.notifications.subscribe') }}</CardTitle>
      </CardHeader>
      <CardContent class="divide-y">
        <div
          v-for="type in NOTIF_TYPES"
          :key="type"
          class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
        >
          <div>
            <p class="text-sm font-medium">{{ t(`settings.notifications.type.${type}.label`) }}</p>
            <p class="text-xs text-muted-foreground">{{ t(`settings.notifications.type.${type}.desc`) }}</p>
          </div>
          <Switch v-model="notifPrefs[type]" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">{{ t('settings.notifications.inbox') }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <p class="text-sm text-muted-foreground">
          {{ t('settings.notifications.markAllReadHint') }}
        </p>
        <Button
          variant="outline"
          class="w-full"
          :disabled="markingAllRead || allMarked"
          @click="markAllRead"
        >
          <Spinner v-if="markingAllRead" data-icon="inline-start" />
          {{ allMarked ? t('settings.notifications.markAllReadDone') : t('settings.notifications.markAllRead') }}
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
