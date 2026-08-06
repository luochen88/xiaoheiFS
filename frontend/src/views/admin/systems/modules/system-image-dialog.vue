<template>
  <ElDialog
    v-model="dialogVisible"
    :title="localForm.id ? t('systemImage.dialog.editTitle') : t('systemImage.dialog.createTitle')"
    width="480px"
    destroy-on-close
    align-center
  >
    <ElForm label-position="top">
      <ElFormItem :label="t('systemImage.dialog.imageId')">
        <ElInputNumber v-model="localForm.image_id" :min="1" :precision="0" class="full-width" />
      </ElFormItem>

      <ElFormItem :label="t('systemImage.dialog.name')">
        <ElInput
          v-model.trim="localForm.name"
          :placeholder="t('systemImage.dialog.namePlaceholder')"
        />
      </ElFormItem>

      <ElFormItem :label="t('systemImage.dialog.type')">
        <ElSelect
          v-model="localForm.type"
          class="full-width"
          :placeholder="t('systemImage.dialog.typePlaceholder')"
        >
          <ElOption label="Linux" value="linux" />
          <ElOption label="Windows" value="windows" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem :label="t('systemImage.dialog.enabled')">
        <ElSwitch v-model="localForm.enabled" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">{{ t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="submitting" @click="emit('submit', { ...localForm })">
          {{ t('systemImage.dialog.save') }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { useSystemImageDialogBinding } from '@/components/business/system-image-dialog/model'
  import type { SystemImageDialogFormValue } from '@/components/business/system-image-dialog/model'

  defineOptions({ name: 'SystemsImageDialog' })

  interface Props {
    visible: boolean
    formData: SystemImageDialogFormValue
    submitting?: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', value: SystemImageDialogFormValue): void
  }

  const props = withDefaults(defineProps<Props>(), {
    submitting: false
  })
  const emit = defineEmits<Emits>()

  const texts: Record<string, string> = {
    'systemImage.dialog.editTitle': '编辑系统镜像',
    'systemImage.dialog.createTitle': '新增系统镜像',
    'systemImage.dialog.imageId': '镜像 ID',
    'systemImage.dialog.name': '名称',
    'systemImage.dialog.namePlaceholder': '请输入镜像名称',
    'systemImage.dialog.type': '类型',
    'systemImage.dialog.typePlaceholder': '请选择镜像类型',
    'systemImage.dialog.enabled': '启用',
    'systemImage.dialog.save': '保存',
    'common.cancel': '取消'
  }
  const t = (key: string) => texts[key] || key

  const { localForm, dialogVisible } = useSystemImageDialogBinding(props, (value) =>
    emit('update:visible', value)
  )
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
</style>
