import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.yaml'

export const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
  },
  datetimeFormats: {
    'zh-CN': {
      short: {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      },
      long: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      },
    },
  },
})
