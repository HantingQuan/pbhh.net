<script setup lang="ts">
import { useAsyncState } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { hitokotoProvider } from '@/composables/useHitokoto'
import { api } from '@/lib/api'

const { t } = useI18n()

const REMOTE_TYPES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'] as const

const { state: users } = useAsyncState<string[]>(
  api.hitokoto.users.get().then(res => res.data || []),
  [],
)
</script>

<template>
  <div class="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle class="text-base font-mono">
          <a href="https://hitokoto.cn" target="_blank">hitokoto.cn</a>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="type in REMOTE_TYPES"
            :key="type"
            class="px-3 py-2 rounded-md border text-sm transition-colors cursor-pointer"
            :class="hitokotoProvider === type ? 'border-primary bg-muted font-medium' : 'border-border hover:bg-muted/50'"
            @click="hitokotoProvider = type"
          >
            {{ t(`settings.hitokoto.types.${type}`) }}
          </button>
        </div>
      </CardContent>
    </Card>

    <Card v-if="users.length > 0">
      <CardHeader>
        <CardTitle class="text-base">{{ t('settings.hitokoto.local') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="user in users"
            :key="user"
            class="px-3 py-2 rounded-md border text-sm transition-colors cursor-pointer"
            :class="hitokotoProvider === `@${user}` ? 'border-primary bg-muted font-medium' : 'border-border hover:bg-muted/50'"
            @click="hitokotoProvider = `@${user}`"
          >
            @{{ user }}
          </button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
