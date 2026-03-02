import type { TString } from '@sinclair/typebox'
import type { Composer } from 'vue-i18n'
import { signupBody } from '@server/auth/model'

const { username, nickname, password } = signupBody.properties

export function validateField({ t, te }: Composer, schema: TString, value: string, field?: string): string {
  const label = field ? t(`field.${field}.label`) : ''
  if (!value)
    return t('validation.required', { label })
  if (schema.minLength && value.length < schema.minLength)
    return t('validation.minLength', { label, min: schema.minLength })
  if (schema.maxLength && value.length > schema.maxLength)
    return t('validation.maxLength', { label, max: schema.maxLength })
  if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
    const key = `field.${field}.pattern`
    return field && te(key) ? t(key, { label }) : t('validation.pattern', { label })
  }
  return ''
}

export const validateUsername = (composer: Composer, value: string) => validateField(composer, username, value, 'username')
export const validateNickname = (composer: Composer, value: string) => validateField(composer, nickname, value, 'nickname')
export const validatePassword = (composer: Composer, value: string) => validateField(composer, password, value, 'password')
