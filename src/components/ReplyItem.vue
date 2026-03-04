<script setup lang="ts">
import { Heart, MessageSquare } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import useAvatar from '@/composables/avatar'
import { api, user } from '@/lib/api'

const props = defineProps<{
  id: number
  parentId?: number
  username: string
  nickname: string
  avatar: string
  content: string
  createdAt: number
  likeCount: number
  liked: boolean
  parentUsername?: string
  parentNickname?: string
  parentContent?: string
}>()

const emit = defineEmits<{
  reply: [id: number]
}>()

const router = useRouter()
const { avatarUrl } = useAvatar(() => props.avatar)

const localLiked = ref(props.liked)
const localLikeCount = ref(props.likeCount)

const timeStr = computed(() => {
  const diff = Date.now() - props.createdAt
  if (diff < 60_000)
    return '刚刚'
  if (diff < 3_600_000)
    return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000)
    return `${Math.floor(diff / 3_600_000)} 小时前`
  return new Date(props.createdAt).toLocaleDateString('zh-CN')
})

const renderedContent = computed(() => props.content.trim().replace(/\n/g, '<br>'))

function jumpToParent() {
  if (!props.parentId)
    return
  const targetId = `thread-item-${props.parentId}`
  const el = document.getElementById(targetId) ?? document.getElementById('thread-root')
  if (!el)
    return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  history.pushState(null, '', `#${el.id}`)
  el.classList.remove('thread-highlight')
  void el.offsetWidth // reflow to restart animation
  el.classList.add('thread-highlight')
  el.addEventListener('animationend', () => el.classList.remove('thread-highlight'), { once: true })
}

async function handleLike() {
  if (!user.value) {
    router.push('/login')
    return
  }
  const { data } = await api.tibi({ id: props.id }).like.post()
  if (data) {
    localLikeCount.value += data.liked ? 1 : -1
    localLiked.value = data.liked
  }
}
</script>

<template>
  <div :id="`thread-item-${id}`" class="flex gap-3 py-3">
    <RouterLink :to="`/@${username}`" class="shrink-0">
      <Avatar class="size-7 border">
        <AvatarImage :src="avatarUrl" :alt="username" />
        <AvatarFallback>{{ nickname.slice(0, 2) }}</AvatarFallback>
      </Avatar>
    </RouterLink>
    <div class="flex-1 min-w-0">
      <div class="flex items-baseline gap-2 mb-0.5">
        <RouterLink :to="`/@${username}`" class="text-sm font-medium hover:underline">
          {{ nickname }}
        </RouterLink>
        <span class="text-xs text-muted-foreground">{{ timeStr }}</span>
      </div>
      <a
        v-if="parentUsername && parentId"
        :href="`#thread-item-${parentId}`"
        class="text-xs text-muted-foreground mb-1 hover:text-foreground transition-colors block"
        @click.prevent="jumpToParent"
      >
        ↩ @{{ parentNickname }}：{{ parentContent }}
      </a>
      <div class="text-sm" v-html="renderedContent" />
      <div class="flex items-center gap-0 -ml-2 mt-0.5">
        <Button
          variant="ghost"
          size="sm"
          class="gap-1 text-muted-foreground h-6 px-2 text-xs"
          :class="{ 'text-red-500': localLiked }"
          @click="handleLike"
        >
          <Heart class="size-3" :class="{ 'fill-current': localLiked }" />
          {{ localLikeCount || '' }}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="gap-1 text-muted-foreground h-6 px-2 text-xs"
          @click="emit('reply', id)"
        >
          <MessageSquare class="size-3" />
          回复
        </Button>
      </div>
    </div>
  </div>
</template>
