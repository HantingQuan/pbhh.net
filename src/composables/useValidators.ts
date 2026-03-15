import type { Composer } from 'vue-i18n'
import { useI18n } from 'vue-i18n'

interface StringConstraints { minLength?: number, maxLength?: number, pattern?: string }

const username: StringConstraints = { minLength: 3, maxLength: 20, pattern: '^\\w+$' }
const nickname: StringConstraints = { minLength: 1, maxLength: 20 }
const password: StringConstraints = { minLength: 8, maxLength: 20 }

export type FieldValidator = (value: string) => string | undefined

export function validateField(
  { t, te }: Pick<Composer, 't' | 'te'>,
  schema: StringConstraints,
  value: string,
  field?: string,
): string | undefined {
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
}

export function useValidators(composer: Pick<Composer, 't' | 'te'> = useI18n()) {
  return {
    username: value => validateField(composer, username, value, 'username'),
    nickname: value => validateField(composer, nickname, value, 'nickname'),
    password: value => validateField(composer, password, value, 'password'),
  } satisfies Record<string, FieldValidator>
}
