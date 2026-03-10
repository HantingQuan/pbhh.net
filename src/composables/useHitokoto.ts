import { useStorage } from '@vueuse/core'
import { ref } from 'vue'
import { api } from '@/lib/api'

export const hitokotoProvider = useStorage('hitokoto-provider', 'a')

export default function useHitokoto() {
  const hitokoto = ref<Awaited<ReturnType<typeof api.hitokoto.get>>['data']>()

  async function refresh() {
    const provider = hitokotoProvider.value
    const { data } = await api.hitokoto.get({ query: { provider } })
    if (data) {
      hitokoto.value = data
    }
  }

  refresh()

  return { hitokoto, refresh }
}
