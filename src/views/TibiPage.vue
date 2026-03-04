<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Translation, useI18n } from 'vue-i18n'
import TibiCard from '@/components/TibiCard.vue'
import TibiCompose from '@/components/TibiCompose.vue'
import { api, user } from '@/lib/api'

const props = defineProps<{ username?: string }>()

type TibiItem = NonNullable<Awaited<ReturnType<typeof api.tibi.get>>['data']>[number]

const { t } = useI18n()

const tibis = ref<TibiItem[]>([])
const loading = ref(false)

const canCompose = () => !props.username || props.username === user.value?.username

async function loadTibis() {
  loading.value = true
  const { data } = await api.tibi.get({ query: { username: props.username } })
  if (data)
    tibis.value = data
  loading.value = false
}

function onPosted() {
  loadTibis()
}

function onDeleted(id: number) {
  tibis.value = tibis.value.filter(item => item.id !== id)
}

function onLiked(id: number, liked: boolean, likeCount: number) {
  const item = tibis.value.find(item => item.id === id)
  if (item) {
    item.liked = liked
    item.likeCount = likeCount
  }
}

let sse: EventSource | null = null

onMounted(() => {
  loadTibis()
  sse = new EventSource(`${window.location.origin}/api/sse`)
  sse.onmessage = (e) => {
    const { topic, payload } = JSON.parse(e.data) as { topic: string, payload: { username?: string } }
    if (topic === 'tibi.created') {
      if (!props.username || props.username === payload.username)
        loadTibis()
    }
  }
})

onUnmounted(() => {
  sse?.close()
  sse = null
})
</script>

<template>
  <div class="w-full mb-auto max-w-2xl px-4 py-8 space-y-4">
    <div v-if="username" class="flex items-center gap-2 text-sm">
      <RouterLink :to="`/@${username}`" class="text-muted-foreground hover:text-foreground">
        @{{ username }}
      </RouterLink>
      <span class="text-muted-foreground">/</span>
      <span class="font-medium">{{ t('tibi.title') }}</span>
    </div>

    <TibiCompose v-if="canCompose() && user" @posted="onPosted" />
    <Translation v-else-if="!user && !username" keypath="tibi.loginRequired" class="text-center text-muted-foreground text-sm">
      <template #login>
        <RouterLink to="/login" class="link">
          {{ t('home.loginLink') }}
        </RouterLink>
      </template>
    </Translation>
    <div v-if="tibis.length === 0 && !loading" class="text-center text-muted-foreground py-8">
      {{ t('tibi.empty') }}
    </div>
    <TibiCard
      v-for="tibi in tibis"
      :key="tibi.id"
      v-bind="tibi"
      @deleted="onDeleted"
      @liked="onLiked"
    />
  </div>
</template>
