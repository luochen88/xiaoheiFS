<template>
  <div class="email-template-editor" @keydown.capture="handleKeydown">
    <div class="mode-switcher">
      <ElSegmented v-model="mode" :options="modeOptions" size="small" />
    </div>
    <ArtWangEditor
      v-if="mode === 'rich'"
      v-model="editorValue"
      :height="height"
      :insert-keys="{ index: 10, keys: [VARIABLE_MENU_KEY] }"
      placeholder="请输入邮件模板内容"
    />
    <ElInput
      v-else
      v-model="modelValue"
      class="source-editor"
      type="textarea"
      :rows="18"
      resize="vertical"
      placeholder="请输入 HTML 源码"
    />
  </div>
</template>

<script setup lang="ts">
  import { Boot } from '@wangeditor/editor'
  import type { IDomEditor, ISelectMenu } from '@wangeditor/editor'

  defineOptions({ name: 'EmailTemplateEditor' })

  withDefaults(defineProps<{ height?: string }>(), { height: '400px' })

  const modelValue = defineModel<string>({ required: true })
  const mode = ref<'rich' | 'source'>('rich')
  const modeOptions = [
    { label: '可视化', value: 'rich' },
    { label: 'HTML 源码', value: 'source' }
  ]
  const VARIABLE_MENU_KEY = 'xiaoheiTemplateVariable'
  const VARIABLE_PATTERN = /(\{\{\s*\.[a-zA-Z0-9_.]+\s*\}\})/g
  const PROTECTED_VARIABLE_PATTERN =
    /<span\s+class="template-variable"\s+contenteditable="false"\s+data-variable="[^"]*">(\{\{\s*\.[a-zA-Z0-9_.]+\s*\}\})<\/span>/g

  function unprotectVariables(value: string): string {
    return value.replace(PROTECTED_VARIABLE_PATTERN, '$1')
  }

  function protectVariables(value: string): string {
    return unprotectVariables(value).replace(
      VARIABLE_PATTERN,
      '<span class="template-variable" contenteditable="false" data-variable="$1">$1</span>'
    )
  }

  const editorValue = ref(protectVariables(modelValue.value))

  watch(editorValue, (value) => {
    const rawValue = unprotectVariables(value)
    if (rawValue !== modelValue.value) modelValue.value = rawValue
  })

  watch(modelValue, (value) => {
    if (unprotectVariables(editorValue.value) !== value) editorValue.value = protectVariables(value)
  })

  watch(mode, (value) => {
    if (value === 'rich') editorValue.value = protectVariables(modelValue.value)
  })

  function handleKeydown(event: KeyboardEvent): void {
    if (!event.ctrlKey || !event.shiftKey || event.key.toLowerCase() !== 's') return
    event.preventDefault()
    mode.value = mode.value === 'rich' ? 'source' : 'rich'
  }

  const TEMPLATE_VARIABLES = [
    '{{.user.id}}',
    '{{.user.username}}',
    '{{.user.email}}',
    '{{.user.qq}}',
    '{{.order.no}}',
    '{{.order.amount}}',
    '{{.vps.name}}',
    '{{.vps.ip}}',
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
      editor.dangerouslyInsertHtml(
        `<span class="template-variable" contenteditable="false" data-variable="${value}">${value}</span>`
      )
      editor.focus()
    }
  }

  try {
    Boot.registerMenu({ key: VARIABLE_MENU_KEY, factory: () => new TemplateVariableMenu() })
  } catch (error) {
    if (!String(error).includes('Duplicated key')) throw error
  }
</script>

<style lang="scss" scoped>
  .email-template-editor {
    min-width: 0;
  }

  .mode-switcher {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
  }

  .source-editor {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
</style>
