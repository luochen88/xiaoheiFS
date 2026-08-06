<template>
  <div
    class="editable-region"
    :class="{
      'is-editing': isEditing,
      'is-hovering': isHovering,
      'always-show-controls': alwaysShowControls
    }"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <span v-if="!isEditing && (isHovering || alwaysShowControls)" class="edit-icon">
      <ArtSvgIcon icon="ri:pencil-line" />
    </span>

    <div
      v-if="isArrayItem && !isEditing && (isHovering || alwaysShowControls)"
      class="array-item-controls"
    >
      <button
        v-if="canRemove"
        type="button"
        class="array-btn remove"
        title="删除"
        @click.stop="handleRemove"
      >
        <ArtSvgIcon icon="ri:delete-bin-5-line" />
      </button>
      <button
        v-if="canAdd"
        type="button"
        class="array-btn add"
        title="添加"
        @click.stop="handleAdd"
      >
        <ArtSvgIcon icon="ri:add-line" />
      </button>
    </div>

    <ElPopover
      v-if="!isEditing"
      v-model:visible="popoverVisible"
      :title="label || '编辑'"
      trigger="click"
      placement="top-start"
      @show="handlePopoverChange(true)"
      @hide="handlePopoverChange(false)"
    >
      <template #default>
        <div class="inline-edit-content">
          <ElInput
            v-if="editType === 'text' || editType === 'url'"
            ref="inputRef"
            :model-value="modelValue"
            :placeholder="placeholder"
            size="small"
            autofocus
            @update:model-value="handleUpdate"
            @keydown.enter="handleSave"
            @keydown.esc="handleCancel"
          />
          <ElInput
            v-else-if="editType === 'textarea'"
            ref="inputRef"
            :model-value="modelValue"
            :placeholder="placeholder"
            :rows="rows || 3"
            type="textarea"
            size="small"
            autofocus
            @update:model-value="handleUpdate"
          />
          <ElInputNumber
            v-else-if="editType === 'number'"
            ref="inputRef"
            :model-value="modelValue"
            :placeholder="placeholder"
            class="number-input"
            size="small"
            autofocus
            @update:model-value="handleUpdate"
          />

          <div class="inline-edit-actions">
            <ElButton size="small" @click="handleCancel">取消</ElButton>
            <ElButton size="small" type="primary" @click="handleSave">确定</ElButton>
          </div>
        </div>
      </template>

      <template #reference>
        <div class="editable-content" @click="handleClick">
          <slot>{{ displayValue }}</slot>
        </div>
      </template>
    </ElPopover>

    <div v-else class="inline-editing">
      <ElInput
        v-if="editType === 'text' || editType === 'url'"
        ref="inputRef"
        :model-value="modelValue"
        :placeholder="placeholder"
        size="small"
        autofocus
        @update:model-value="handleUpdate"
        @keydown.enter="handleSave"
        @keydown.esc="handleCancel"
      />
      <ElInput
        v-else-if="editType === 'textarea'"
        ref="inputRef"
        :model-value="modelValue"
        :placeholder="placeholder"
        :rows="rows || 3"
        type="textarea"
        size="small"
        autofocus
        @update:model-value="handleUpdate"
      />
      <ElInputNumber
        v-else-if="editType === 'number'"
        ref="inputRef"
        :model-value="modelValue"
        :placeholder="placeholder"
        class="number-input"
        size="small"
        autofocus
        @update:model-value="handleUpdate"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'InlineEdit' })

  interface Props {
    fieldPath?: string
    modelValue: any
    editType?: 'text' | 'textarea' | 'number' | 'url'
    isArrayItem?: boolean
    canAdd?: boolean
    canRemove?: boolean
    label?: string
    placeholder?: string
    rows?: number
    alwaysShowControls?: boolean
  }

  interface Emits {
    (event: 'update:modelValue', value: any): void
    (event: 'edit'): void
    (event: 'save'): void
    (event: 'cancel'): void
    (event: 'addItem'): void
    (event: 'removeItem'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    editType: 'text',
    isArrayItem: false,
    canAdd: false,
    canRemove: false,
    alwaysShowControls: false,
    rows: 3
  })

  const emit = defineEmits<Emits>()
  const isHovering = ref(false)
  const isEditing = ref(false)
  const popoverVisible = ref(false)
  const inputRef = ref<{ focus: () => void } | null>(null)

  const displayValue = computed(() => {
    if (props.modelValue === null || props.modelValue === undefined) {
      return props.placeholder || '点击编辑'
    }
    return props.modelValue
  })

  const focusInput = () => {
    nextTick(() => inputRef.value?.focus())
  }

  const handleClick = () => {
    emit('edit')
  }

  const handlePopoverChange = (open: boolean) => {
    if (open) focusInput()
  }

  const handleUpdate = (value: any) => {
    emit('update:modelValue', value)
  }

  const handleSave = () => {
    isEditing.value = false
    popoverVisible.value = false
    emit('save')
  }

  const handleCancel = () => {
    isEditing.value = false
    popoverVisible.value = false
    emit('cancel')
  }

  const handleAdd = () => emit('addItem')
  const handleRemove = () => emit('removeItem')

  defineExpose({
    startEdit: () => {
      isEditing.value = true
      focusInput()
    },
    endEdit: () => {
      isEditing.value = false
    }
  })
</script>

<style lang="scss" scoped>
  .editable-region {
    position: relative;
    display: inline-block;
    min-width: 20px;
    min-height: 20px;
    padding: 4px 8px;
    cursor: pointer;
    border: 1px dashed transparent;
    border-radius: var(--el-border-radius-base);
    transition:
      border-color 0.2s ease,
      background-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover,
    &.is-hovering {
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-3);
    }

    &.is-editing {
      z-index: 10;
      cursor: default;
      background: var(--default-box-color);
      border-color: var(--el-color-primary);
      border-style: solid;
      box-shadow: var(--el-box-shadow-light);
    }

    &:hover .edit-icon,
    &:hover .array-item-controls,
    &.is-hovering .edit-icon,
    &.is-hovering .array-item-controls,
    &.always-show-controls .edit-icon,
    &.always-show-controls .array-item-controls {
      opacity: 1;
    }
  }

  .edit-icon {
    position: absolute;
    top: -8px;
    right: -8px;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: var(--el-color-white);
    background: var(--el-color-primary);
    border: 2px solid var(--default-box-color);
    border-radius: 50%;
    box-shadow: var(--el-box-shadow-lighter);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .array-item-controls {
    position: absolute;
    top: -10px;
    right: -10px;
    z-index: 11;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .array-btn {
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    color: var(--el-color-white);
    cursor: pointer;
    border: 2px solid var(--default-box-color);
    border-radius: var(--el-border-radius-base);
    box-shadow: var(--el-box-shadow-lighter);
    transition: transform 0.2s ease;

    &.add {
      background: var(--el-color-success);
    }

    &.remove {
      background: var(--el-color-danger);
    }

    &:hover {
      transform: scale(1.1);
    }
  }

  .editable-content {
    display: inline-block;
    width: 100%;
  }

  .inline-edit-content {
    min-width: 200px;
  }

  .inline-edit-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 12px;
  }

  .inline-editing,
  .number-input {
    display: block;
    width: 100%;
  }
</style>
