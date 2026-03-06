<script setup lang="ts">
import { Moon, Sun, SunMoon } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

type ThemeMode = 'light' | 'dark' | 'system'
const theme = ref<ThemeMode>((localStorage.getItem('theme') as ThemeMode) ?? 'system')

function applyTheme(mode: ThemeMode) {
  if (mode === 'dark') {
    document.documentElement.classList.add('dark')
  }
  else if (mode === 'light') {
    document.documentElement.classList.remove('dark')
  }
  else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', prefersDark)
  }
}

watch(theme, (mode) => {
  localStorage.setItem('theme', mode)
  applyTheme(mode)
})
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-muted-foreground">
      {{ t('settings.themeHint') }}
    </p>
    <div class="grid grid-cols-3 gap-3">
      <button
        v-for="mode in (['light', 'dark', 'system'] as const)"
        :key="mode"
        class="flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors cursor-pointer"
        :class="theme === mode ? 'border-primary bg-muted' : 'border-border hover:bg-muted/50'"
        @click="theme = mode"
      >
        <Sun v-if="mode === 'light'" class="size-6" />
        <Moon v-else-if="mode === 'dark'" class="size-6" />
        <SunMoon v-else class="size-6" />
        <span class="text-sm font-medium">{{ t(`settings.theme.${mode}`) }}</span>
      </button>
    </div>
  </div>
</template>
