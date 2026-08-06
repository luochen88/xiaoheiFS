<template>
  <ElDialog
    v-model="dialogVisible"
    :title="localForm.id ? '编辑商品类型' : '新增商品类型'"
    width="560px"
    destroy-on-close
    align-center
  >
    <ElForm label-position="top">
      <ElFormItem label="名称">
        <ElInput v-model.trim="localForm.name" placeholder="请输入名称" />
      </ElFormItem>
      <ElFormItem label="代码">
        <ElInput v-model.trim="localForm.code" placeholder="请输入代码" />
      </ElFormItem>
      <ElFormItem label="自动化实例">
        <ElSelect
          v-model="selectedAutomationRef"
          clearable
          filterable
          placeholder="选择 automation 插件实例"
          class="full-width"
          @change="handleAutomationRefChange"
        >
          <ElOption
            v-for="item in automationOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElRow :gutter="12">
        <ElCol :span="12">
          <ElFormItem label="排序">
            <ElInputNumber v-model="localForm.sort_order" :min="0" class="full-width" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="启用">
            <ElSwitch v-model="localForm.active" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow :gutter="12">
        <ElCol :span="12">
          <ElFormItem label="允许升降配">
            <ElSwitch v-model="localForm.resize_enabled" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="允许退款">
            <ElSwitch v-model="localForm.refund_enabled" />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <template v-if="showConfigSection">
        <ElDivider content-position="left">自动化实例配置</ElDivider>

        <ElAlert
          v-if="configError"
          type="error"
          :closable="false"
          show-icon
          :title="configError"
          class="config-alert"
        />

        <div class="config-layout">
          <ElSkeleton v-if="configLoading" :rows="10" animated />
          <JsonSchemaForm
            v-else
            :schema="schemaObject"
            :ui-schema="uiSchemaObject"
            v-model:model-value="configModel"
          />
        </div>
      </template>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="emit('submit', { ...localForm })">
          保存
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import JsonSchemaForm from '@/components/business/json-schema-form/index.vue'
  defineOptions({ name: 'CatalogGoodsTypeDialog' })

  interface GoodsTypeDialogFormValue {
    id: number | null
    code: string
    name: string
    active: boolean
    sort_order: number
    automation_plugin_id: string
    automation_instance_id: string
    resize_enabled: boolean
    refund_enabled: boolean
  }

  interface Props {
    visible: boolean
    formData: GoodsTypeDialogFormValue
    automationOptions?: Array<{ label: string; value: string }>
    schemaJson?: string
    uiSchemaJson?: string
    configJson?: string
    configError?: string
    configLoading?: boolean
    submitting?: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'update:configJson', value: string): void
    (e: 'automation-change', value: { pluginId: string; instanceId: string }): void
    (e: 'submit', value: GoodsTypeDialogFormValue): void
  }

  const props = withDefaults(defineProps<Props>(), {
    automationOptions: () => [],
    schemaJson: '{}',
    uiSchemaJson: '{}',
    configJson: '{}',
    configError: '',
    configLoading: false,
    submitting: false
  })
  const emit = defineEmits<Emits>()

  const localForm = reactive<GoodsTypeDialogFormValue>(createDefaultForm())
  const selectedAutomationRef = ref('')

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const configModel = ref<Record<string, unknown>>({})
  const schemaObject = computed(() => parseObject(props.schemaJson))
  const uiSchemaObject = computed(() => parseObject(props.uiSchemaJson))

  const showConfigSection = computed(
    () =>
      Boolean(String(localForm.automation_plugin_id || '').trim()) &&
      Boolean(String(localForm.automation_instance_id || '').trim())
  )

  watch(
    () => props.configJson,
    (value) => {
      configModel.value = parseObject(value)
    },
    { immediate: true }
  )

  watch(configModel, (value) => emit('update:configJson', JSON.stringify(value || {})), {
    deep: true
  })

  watch(
    () => [props.visible, props.formData] as const,
    ([visible]) => {
      if (!visible) return
      Object.assign(localForm, createDefaultForm(), props.formData)
      selectedAutomationRef.value = toAutomationRef(
        localForm.automation_plugin_id,
        localForm.automation_instance_id
      )
    },
    { immediate: true, deep: true }
  )

  watch(
    () =>
      [localForm.automation_plugin_id, localForm.automation_instance_id, props.visible] as const,
    ([pluginId, instanceId, visible]) => {
      if (!visible) {
        return
      }

      emit('automation-change', {
        pluginId: String(pluginId || '').trim(),
        instanceId: String(instanceId || '').trim()
      })
    },
    { immediate: true }
  )

  function createDefaultForm(): GoodsTypeDialogFormValue {
    return {
      id: null,
      code: '',
      name: '',
      active: true,
      sort_order: 0,
      automation_plugin_id: '',
      automation_instance_id: '',
      resize_enabled: true,
      refund_enabled: true
    }
  }

  function parseObject(value?: string) {
    try {
      const parsed = JSON.parse(String(value || '{}'))
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }

  function toAutomationRef(pluginId?: string, instanceId?: string) {
    const plugin = String(pluginId || '').trim()
    const instance = String(instanceId || '').trim()
    return plugin && instance ? `${plugin}:${instance}` : ''
  }

  function handleAutomationRefChange(value?: string) {
    const raw = String(value || '').trim()
    if (!raw) {
      localForm.automation_plugin_id = ''
      localForm.automation_instance_id = ''
      return
    }
    const [pluginId, instanceId] = raw.split(':')
    localForm.automation_plugin_id = String(pluginId || '').trim()
    localForm.automation_instance_id = String(instanceId || '').trim()
  }
</script>

<style scoped lang="scss">
  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .full-width {
    width: 100%;
  }

  .config-alert {
    margin-bottom: 12px;
  }

  .config-layout {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .config-card {
    min-width: 0;
  }

  .config-title {
    font-weight: 600;
  }

  .config-tip {
    margin-top: 8px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }

  @media (width <= 900px) {
    .config-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
