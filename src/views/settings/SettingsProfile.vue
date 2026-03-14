<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Input from '@/components/Input.vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { PROVIDERS, useAvatar } from '@/composables/useAvatar'
import { useFields } from '@/composables/useFields'
import { useValidators } from '@/composables/useValidators'
import { api, fetchUser, user } from '@/lib/api'

const { t } = useI18n()

const { nickname } = useValidators()
const { fields, hasErrors, isDirty } = useFields({
  username: { type: 'text', autocomplete: 'username', disabled: true, value: user.value?.username },
  nickname: { type: 'text', autocomplete: 'nickname', validate: nickname, value: user.value?.nickname },
})

const { avatarProvider, avatarValue, avatarUrl, avatarString } = useAvatar(user.value?.avatar)
const initialAvatarString = ref(avatarString.value)
const avatarDirty = computed(() => avatarString.value !== initialAvatarString.value)
const avatarError = computed(() =>
  avatarValue.value && !PROVIDERS[avatarProvider.value].validate(avatarValue.value)
    ? t(`field.avatar.${avatarProvider.value}.pattern`)
    : '',
)
watch(avatarProvider, () => {
  avatarValue.value = ''
})

const profileSaving = ref(false)
const profileSaved = ref(false)

async function saveProfile() {
  profileSaving.value = true
  profileSaved.value = false
  await api.me.patch({
    nickname: fields.nickname.value.value,
    avatar: avatarString.value,
  })
  await fetchUser()
  fields.nickname.initial = fields.nickname.value.value
  initialAvatarString.value = avatarString.value
  profileSaving.value = false
  profileSaved.value = true
  setTimeout(() => profileSaved.value = false, 2000)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-center mb-2">
      <Avatar class="size-20 border">
        <AvatarImage :src="avatarUrl" :alt="user?.username" />
        <AvatarFallback>{{ user?.nickname?.slice(0, 2) }}</AvatarFallback>
      </Avatar>
    </div>

    <Input
      v-for="field, key in fields"
      :id="key" :key="key" v-bind="field"
      v-model:value="field.value.value"
      v-model:error="field.error.value"
      :label="$t(`field.${key}.label`)"
      :placeholder="$t(`field.${key}.placeholder`)"
      :dirty="!field.disabled && field.value.value !== field.initial"
      optional
    />

    <Input
      id="avatar"
      v-model:value="avatarValue"
      :label="$t('field.avatar.label')"
      :error="avatarError"
      :dirty="avatarDirty"
      :inputmode="PROVIDERS[avatarProvider].inputmode"
      :placeholder="$t(`field.avatar.${avatarProvider}.placeholder`)"
      optional
    >
      <template #prepend>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="shrink-0 gap-1">
              {{ t(`field.avatar.${avatarProvider}.label`) }}
              <ChevronDown class="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup v-model="avatarProvider">
              <DropdownMenuRadioItem
                v-for="provider in Object.keys(PROVIDERS)"
                :key="provider" :value="provider"
              >
                {{ t(`field.avatar.${provider}.label`) }}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
    </Input>

    <Button
      class="w-full"
      :disabled="!(isDirty || avatarDirty) || hasErrors || !!avatarError || profileSaving"
      @click="saveProfile"
    >
      <Spinner v-if="profileSaving" data-icon="inline-start" />
      {{ profileSaved ? t('profile.saved') : profileSaving ? t('profile.saving') : t('profile.save') }}
    </Button>
  </div>
</template>
