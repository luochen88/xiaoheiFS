<template>
  <ElDialog
    v-model="dialogVisible"
    :title="localForm.id ? '编辑优惠码' : '新增优惠码'"
    width="720px"
    destroy-on-close
    align-center
  >
    <ElForm label-position="top">
      <ElRow :gutter="12">
        <ElCol :xs="24" :md="12">
          <ElFormItem label="优惠码">
            <ElInput v-model.trim="localForm.code" placeholder="请输入优惠码" />
          </ElFormItem>
        </ElCol>

        <ElCol :xs="24" :md="12">
          <ElFormItem label="折扣（千分比）">
            <ElInputNumber
              v-model="localForm.discount_permille"
              :min="1"
              :max="1000"
              class="full-width"
            />
          </ElFormItem>
        </ElCol>

        <ElCol :xs="24" :md="12">
          <ElFormItem label="商品组">
            <ElSelect
              v-model="localForm.product_group_id"
              filterable
              class="full-width"
              placeholder="请选择商品组"
            >
              <ElOption
                v-for="item in groupOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>

        <ElCol :xs="24" :md="6">
          <ElFormItem label="总使用次数">
            <ElInputNumber v-model="localForm.total_limit" class="full-width" />
          </ElFormItem>
        </ElCol>

        <ElCol :xs="24" :md="6">
          <ElFormItem label="每用户次数">
            <ElInputNumber v-model="localForm.per_user_limit" class="full-width" />
          </ElFormItem>
        </ElCol>

        <ElCol :xs="12" :md="6">
          <ElFormItem label="仅新用户">
            <ElSwitch v-model="localForm.new_user_only" />
          </ElFormItem>
        </ElCol>

        <ElCol :xs="12" :md="6">
          <ElFormItem label="启用">
            <ElSwitch v-model="localForm.active" />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">保存</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  defineOptions({ name: 'CouponDialog' })

  interface CouponFormValue {
    id: number | null
    code: string
    discount_permille: number
    product_group_id: number | null
    total_limit: number
    per_user_limit: number
    new_user_only: boolean
    active: boolean
    note: string
  }

  interface SelectOption {
    label: string
    value: number
  }

  interface Props {
    visible: boolean
    formData: CouponFormValue
    groupOptions?: SelectOption[]
    submitting?: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', value: CouponFormValue): void
  }

  const props = withDefaults(defineProps<Props>(), {
    groupOptions: () => [],
    submitting: false
  })
  const emit = defineEmits<Emits>()

  const localForm = reactive<CouponFormValue>(createDefaultForm())

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  watch(
    () => [props.visible, props.formData] as const,
    ([visible]) => {
      if (!visible) {
        return
      }

      Object.assign(localForm, createDefaultForm(), {
        ...props.formData,
        id: toNullableNumber(props.formData.id),
        product_group_id: toNullableNumber(props.formData.product_group_id)
      })
    },
    { immediate: true, deep: true }
  )

  function createDefaultForm(): CouponFormValue {
    return {
      id: null,
      code: '',
      discount_permille: 900,
      product_group_id: null,
      total_limit: -1,
      per_user_limit: -1,
      new_user_only: false,
      active: true,
      note: ''
    }
  }

  function toNullableNumber(value: unknown) {
    if (value === null || value === undefined || value === '' || Number(value) <= 0) {
      return null
    }

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  function handleSubmit() {
    emit('submit', {
      ...localForm,
      id: toNullableNumber(localForm.id),
      product_group_id: toNullableNumber(localForm.product_group_id)
    })
  }
</script>

<style scoped lang="scss">
  .full-width {
    width: 100%;
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>
