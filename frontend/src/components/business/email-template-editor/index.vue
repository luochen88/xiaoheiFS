<template>
  <ArtWangEditor
    v-model="modelValue"
    :height="height"
    :insert-keys="{ index: 10, keys: [VARIABLE_MENU_KEY] }"
    placeholder="请输入邮件模板内容"
  />
</template>

<script setup lang="ts">
  import { Boot } from '@wangeditor/editor'
  import type { IDomEditor, ISelectMenu } from '@wangeditor/editor'

  defineOptions({ name: 'EmailTemplateEditor' })

  withDefaults(defineProps<{ height?: string }>(), { height: '400px' })

  const modelValue = defineModel<string>({ required: true })
  const VARIABLE_MENU_KEY = 'xiaoheiTemplateVariable'
  const TEMPLATE_VARIABLES = [
    '{{.user.id}}',
    '{{.user.username}}',
    '{{.user.email}}',
    '{{.user.qq}}',
    '{{.order.no}}',
    '{{.vps.name}}',
    '{{.vps.expire_at}}',
    '{{.message}}',
    '{{.now}}'
  ]

  class TemplateVariableMenu implements ISelectMenu {
    readonly title = '插入变量'
    readonly tag = 'select'
    readonly width = 110
    readonly selectPanelWidth = 220

    getOptions() {
      return TEMPLATE_VARIABLES.map((value) => ({ text: value, value }))
    }

    getValue() {
      return ''
    }

    isActive() {
      return false
    }

    isDisabled(editor: IDomEditor) {
      return editor.isDisabled()
    }

    exec(editor: IDomEditor, value: string | boolean) {
      if (typeof value !== 'string' || !value) return
      editor.restoreSelection()
      editor.insertText(value)
      editor.focus()
    }
  }

  try {
    Boot.registerMenu({ key: VARIABLE_MENU_KEY, factory: () => new TemplateVariableMenu() })
  } catch (error) {
    if (!String(error).includes('Duplicated key')) throw error
  }
</script>
