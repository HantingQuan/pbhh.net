<script setup lang="ts">
import type { HTMLAttributes, InputAutoCompleteAttribute, InputTypeHTMLAttribute } from 'vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

defineProps<{
  id: string
  label: string
  modelValue: string
  inputmode?: HTMLAttributes['inputmode']
  type?: InputTypeHTMLAttribute
  optional?: boolean
  autocomplete?: InputAutoCompleteAttribute
  placeholder?: string
  error?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
  'blur': []
}>()
</script>

<template>
  <div class="space-y-2">
    <div class="flex justify-between items-end">
      <Label :for="id">
        {{ label }}
        <span v-if="!optional" class="text-destructive">*</span>
      </Label>
      <p v-if="error" class="text-xs text-destructive">
        {{ error }}
      </p>
    </div>
    <Input
      :id="id"
      :model-value="modelValue"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      spellcheck="false"
      :type="type"
      :class="error && 'border-destructive'"
      @update:model-value="$emit('update:modelValue', $event as string)"
      @blur="$emit('blur')"
    />
  </div>
</template>
