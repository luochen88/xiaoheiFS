<template>
  <ElDialog
    v-model="dialogVisible"
    title="批量生成优惠码"
    width="720px"
    destroy-on-close
    align-center
  >
    <ElForm label-position="top">
      <ElRow :gutter="12">
        <ElCol :xs="24" :md="8">
          <ElFormItem label="前缀">
            <ElInput v-model.trim="localForm.prefix" placeholder="CP" />
          </ElFormItem>
        </ElCol>

        <ElCol :xs="24" :md="8">
          <ElFormItem label="数量">
            <ElInputNumber v-model="localForm.count" :min="1" :max="1000" class="full-width" />
          </ElFormItem>
        </ElCol>

        <ElCol :xs="24" :md="8">
          <ElFormItem label="随机长度">
            <ElInputNumber v-model="localForm.length" :min="4" :max="16" class="full-width" />
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
      </ElRow>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">生成</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  defineOptions({ name: 'CouponBatchDialog' })

  interface CouponBatchFormValue {
    prefix: string
    count: number
    length: number
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
    formData: CouponBatchFormValue
    groupOptions?: SelectOption[]
    submitting?: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', value: CouponBatchFormValue): void
  }

  const props = withDefaults(defineProps<Props>(), {
    groupOptions: () => [],
    submitting: false
  })
  const emit = defineEmits<Emits>()

  const localForm = reactive<CouponBatchFormValue>(createDefaultForm())

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
        product_group_id: toNullableNumber(props.formData.product_group_id)
      })
    },
    { immediate: true, deep: true }
  )

  function createDefaultForm(): CouponBatchFormValue {
    return {
      prefix: 'CP',
      count: 20,
      length: 8,
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
