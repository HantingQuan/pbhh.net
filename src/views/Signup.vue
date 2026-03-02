<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import FormField from '@/components/FormField.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useFormFields } from '@/composables/useFormFields'
import { api } from '@/lib/api'
import { fetchUser, setToken } from '@/lib/store'
import { validateNickname, validatePassword, validateUsername } from '@/lib/validators'

const composer = useI18n()
const { t, te } = composer
const router = useRouter()

const { fields, filled, hasErrors } = useFormFields({
  username: { type: 'text', autocomplete: 'username', validate: value => validateUsername(composer, value) },
  nickname: { type: 'text', autocomplete: 'nickname', validate: value => validateNickname(composer, value) },
  password: { type: 'password', autocomplete: 'new-password', validate: value => validatePassword(composer, value) },
  confirmPassword: { type: 'password', autocomplete: 'new-password', validate: validateConfirmPassword },
})

function validateConfirmPassword(value: string) {
  if (!value)
    return t('validation.required')
  if (value !== fields.password.value.value)
    return t('field.confirmPassword.mismatch')
  return ''
}

const loading = ref(false)
const serverError = ref('')

async function handleSubmit() {
  if (!filled.value || hasErrors.value)
    return

  loading.value = true
  serverError.value = ''

  try {
    const { data, error } = await api.signup.post({
      username: fields.username.value.value,
      nickname: fields.nickname.value.value,
      password: fields.password.value.value,
    })

    if (error) {
      const key = error.value?.message
      serverError.value = key && te(key) ? t(key) : t('error.signupFailed')
      return
    }

    setToken(data.token)
    await fetchUser()
    router.push('/')
  }
  catch {
    serverError.value = t('error.networkError')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="flex justify-center pt-24">
    <div class="w-full max-w-sm px-4">
      <h1 class="text-3xl font-bold text-center mb-6">
        {{ t('signup.title') }}
      </h1>

      <Card>
        <form @submit.prevent="handleSubmit">
          <CardContent class="space-y-4 pt-6">
            <Alert v-if="serverError" variant="destructive">
              <AlertDescription>{{ serverError }}</AlertDescription>
            </Alert>

            <FormField
              v-for="(field, key) in fields"
              :id="key"
              :key="key"
              v-model="field.value.value"
              v-bind="field"
              :label="t(`field.${key}.label`)"
              :placeholder="t(`field.${key}.placeholder`)"
              :error="field.error.value"
              @input="field.error.value = field.validate(field.value.value)"
            />
          </CardContent>

          <CardFooter class="flex-col gap-2">
            <Button
              type="submit"
              class="w-full"
              :disabled="!filled || hasErrors || loading"
            >
              <Spinner v-if="loading" data-icon="inline-start" />
              {{ loading ? t('signup.submitting') : t('signup.submit') }}
            </Button>
            <p class="text-center text-sm text-muted-foreground">
              {{ t('signup.hasAccount') }}
              <RouterLink to="/login" class="text-foreground underline underline-offset-4 hover:text-primary">
                {{ t('signup.loginLink') }}
              </RouterLink>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  </main>
</template>
