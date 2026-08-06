<template>
  <ElDialog
    v-model="dialogVisible"
    :title="localForm.id ? '编辑商品组' : '新增商品组'"
    width="980px"
    destroy-on-close
    align-center
  >
    <ElForm label-position="top">
      <ElFormItem label="商品组名称">
        <ElInput v-model.trim="localForm.name" placeholder="请输入商品组名称" />
      </ElFormItem>

      <div class="rule-header">
        <span>商品规则</span>
        <ElButton type="primary" plain @click="addRule">新增规则</ElButton>
      </div>

      <div v-for="(rule, index) in localForm.rules" :key="`rule-${index}`" class="rule-card">
        <div class="rule-card-header">
          <span>规则 {{ index + 1 }}</span>
          <ElButton
            link
            type="danger"
            :disabled="localForm.rules.length <= 1"
            @click="removeRule(index)"
          >
            删除
          </ElButton>
        </div>

        <ElRow :gutter="12">
          <ElCol :xs="24" :md="8">
            <ElFormItem label="范围">
              <ElSelect v-model="rule.scope" class="full-width">
                <ElOption
                  v-for="item in scopeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <ElCol :xs="24" :md="8">
            <ElFormItem label="商品类型">
              <ElSelect
                v-model="rule.goods_type_id"
                clearable
                filterable
                class="full-width"
                :disabled="!needGoodsType(rule.scope)"
              >
                <ElOption
                  v-for="item in goodsTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <ElCol :xs="24" :md="8">
            <ElFormItem label="地区">
              <ElSelect
                v-model="rule.region_id"
                clearable
                filterable
                class="full-width"
                :disabled="!needRegion(rule.scope)"
              >
                <ElOption
                  v-for="item in getRegionOptions(rule)"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <ElCol :xs="24" :md="12">
            <ElFormItem label="线路">
              <ElSelect
                v-model="rule.plan_group_id"
                clearable
                filterable
                class="full-width"
                :disabled="!needPlanGroup(rule.scope)"
              >
                <ElOption
                  v-for="item in getPlanGroupOptions(rule)"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <ElCol :xs="24" :md="12">
            <ElFormItem label="套餐">
              <ElSelect
                v-model="rule.package_id"
                clearable
                filterable
                class="full-width"
                :disabled="!needPackage(rule.scope)"
              >
                <ElOption
                  v-for="item in getPackageOptions(rule)"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>

        <ElRow v-if="rule.scope === 'addon_config'" :gutter="12">
          <ElCol :xs="12" :md="6">
            <ElFormItem label="CPU 附加项">
              <ElSwitch v-model="rule.addon_core_enabled" />
            </ElFormItem>
          </ElCol>
          <ElCol :xs="12" :md="6">
            <ElFormItem label="内存附加项">
              <ElSwitch v-model="rule.addon_mem_enabled" />
            </ElFormItem>
          </ElCol>
          <ElCol :xs="12" :md="6">
            <ElFormItem label="磁盘附加项">
              <ElSwitch v-model="rule.addon_disk_enabled" />
            </ElFormItem>
          </ElCol>
          <ElCol :xs="12" :md="6">
            <ElFormItem label="带宽附加项">
              <ElSwitch v-model="rule.addon_bw_enabled" />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </div>
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
  defineOptions({ name: 'CouponGroupDialog' })

  interface CouponRuleFormValue {
    scope: string
    goods_type_id: number | null
    region_id: number | null
    plan_group_id: number | null
    package_id: number | null
    addon_core_enabled: boolean
    addon_mem_enabled: boolean
    addon_disk_enabled: boolean
    addon_bw_enabled: boolean
  }

  interface CouponGroupFormValue {
    id: number | null
    name: string
    rules: CouponRuleFormValue[]
  }

  interface OptionItem {
    id: number | null
    name: string
    goods_type_id?: number | null
    region_id?: number | null
    plan_group_id?: number | null
  }

  interface SelectOption {
    label: string
    value: number
  }

  interface Props {
    visible: boolean
    formData: CouponGroupFormValue
    goodsTypes?: OptionItem[]
    regions?: OptionItem[]
    planGroups?: OptionItem[]
    packages?: OptionItem[]
    submitting?: boolean
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit', value: CouponGroupFormValue): void
  }

  const scopeOptions = [
    { label: '全部商品', value: 'all' },
    { label: '全部附加项', value: 'all_addons' },
    { label: '商品类型', value: 'goods_type' },
    { label: '商品类型 + 地区', value: 'goods_type_region' },
    { label: '线路', value: 'plan_group' },
    { label: '套餐', value: 'package' },
    { label: '附加项配置', value: 'addon_config' }
  ]

  const props = withDefaults(defineProps<Props>(), {
    goodsTypes: () => [],
    regions: () => [],
    planGroups: () => [],
    submitting: false
  })
  const emit = defineEmits<Emits>()

  const localForm = reactive<CouponGroupFormValue>(createDefaultForm())

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const goodsTypeOptions = computed<SelectOption[]>(() =>
    props.goodsTypes
      .filter((item) => item.id !== null)
      .map((item) => ({
        label: item.name || `#${item.id}`,
        value: Number(item.id)
      }))
  )

  watch(
    () => [props.visible, props.formData] as const,
    ([visible]) => {
      if (!visible) {
        return
      }

      Object.assign(localForm, createDefaultForm(), {
        ...props.formData,
        rules: normalizeRules(props.formData.rules)
      })
    },
    { immediate: true, deep: true }
  )

  function createEmptyRule(): CouponRuleFormValue {
    return {
      scope: 'all',
      goods_type_id: null,
      region_id: null,
      plan_group_id: null,
      package_id: null,
      addon_core_enabled: false,
      addon_mem_enabled: false,
      addon_disk_enabled: false,
      addon_bw_enabled: false
    }
  }

  function createDefaultForm(): CouponGroupFormValue {
    return {
      id: null,
      name: '',
      rules: [createEmptyRule()]
    }
  }

  function normalizeRule(rule?: Partial<CouponRuleFormValue>): CouponRuleFormValue {
    return {
      ...createEmptyRule(),
      ...rule,
      goods_type_id: toNullableNumber(rule?.goods_type_id),
      region_id: toNullableNumber(rule?.region_id),
      plan_group_id: toNullableNumber(rule?.plan_group_id),
      package_id: toNullableNumber(rule?.package_id)
    }
  }

  function normalizeRules(rules?: CouponRuleFormValue[]) {
    const items = Array.isArray(rules) ? rules.map((item) => normalizeRule(item)) : []
    return items.length ? items : [createEmptyRule()]
  }

  function toNullableNumber(value: unknown) {
    if (value === null || value === undefined || value === '' || Number(value) <= 0) {
      return null
    }

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  function needGoodsType(scope?: string) {
    return ['goods_type', 'goods_type_region', 'plan_group', 'package', 'addon_config'].includes(
      String(scope || '')
    )
  }

  function needRegion(scope?: string) {
    return ['goods_type_region', 'plan_group'].includes(String(scope || ''))
  }

  function needPlanGroup(scope?: string) {
    return ['plan_group', 'package', 'addon_config'].includes(String(scope || ''))
  }

  function needPackage(scope?: string) {
    return String(scope || '') === 'package'
  }

  function getRegionOptions(rule: CouponRuleFormValue): SelectOption[] {
    const goodsTypeId = Number(rule.goods_type_id || 0)
    return props.regions
      .filter((item) => item.id !== null)
      .filter((item) => !goodsTypeId || Number(item.goods_type_id) === goodsTypeId)
      .map((item) => ({
        label: item.name || `#${item.id}`,
        value: Number(item.id)
      }))
  }

  function getPlanGroupOptions(rule: CouponRuleFormValue): SelectOption[] {
    const goodsTypeId = Number(rule.goods_type_id || 0)
    const regionId = Number(rule.region_id || 0)

    return props.planGroups
      .filter((item) => item.id !== null)
      .filter(
        (item) =>
          (!goodsTypeId || Number(item.goods_type_id) === goodsTypeId) &&
          (!regionId || Number(item.region_id) === regionId)
      )
      .map((item) => ({
        label: item.name || `#${item.id}`,
        value: Number(item.id)
      }))
  }

  function getPackageOptions(rule: CouponRuleFormValue): SelectOption[] {
    const planGroupId = Number(rule.plan_group_id || 0)

    return props.packages
      .filter((item) => item.id !== null)
      .filter((item) => !planGroupId || Number(item.plan_group_id) === planGroupId)
      .map((item) => ({
        label: item.name || `#${item.id}`,
        value: Number(item.id)
      }))
  }

  function addRule() {
    localForm.rules.push(createEmptyRule())
  }

  function removeRule(index: number) {
    if (localForm.rules.length <= 1) {
      return
    }

    localForm.rules.splice(index, 1)
  }

  function handleSubmit() {
    emit('submit', {
      id: localForm.id,
      name: localForm.name,
      rules: localForm.rules.map((item) => normalizeRule(item))
    })
  }
</script>

<style scoped lang="scss">
  .rule-header,
  .rule-card-header,
  .dialog-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .rule-header {
    margin-bottom: 12px;
    font-weight: 600;
  }

  .rule-card {
    padding: 14px;
    margin-bottom: 12px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
  }

  .rule-card-header {
    margin-bottom: 10px;
  }

  .dialog-footer {
    gap: 12px;
    justify-content: flex-end;
  }

  .full-width {
    width: 100%;
  }
</style>
