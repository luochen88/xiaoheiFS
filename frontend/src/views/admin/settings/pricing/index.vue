<template>
  <SettingsPage
    title="价格与退款"
    subtitle="配置退款时间规则、退款曲线与扩缩容定价"
    :loading="loading"
    :saving="saving"
    :can-view="canView"
    :can-update="canUpdate"
    @refresh="fetchData"
    @save="save"
  >
    <ArtForm
      v-model="form"
      :items="formItems"
      :disabled="loading || saving || !canUpdate"
      :show-reset="false"
      :show-submit="false"
      :span="8"
      :gutter="20"
      label-position="top"
    />

    <ElAlert
      type="info"
      :closable="false"
      show-icon
      title="退款曲线优先级高于按天、按小时规则"
      description="按“天”生效；若下方“全额退款（小时）”大于 0，则优先生效。按“天”线性递减；若下方“按比例退款（小时）”大于 0，则优先生效。超过该天数不再允许退款；若下方“不再退款（小时）”大于 0，则优先生效。可选：大于 0 时覆盖“全额退款（天）”。可选：大于 0 时覆盖“按比例退款（天）”。可选：大于 0 时覆盖“不再退款（天）”。开启后，用户退款申请进入待审核。开启后，管理员删除实例会触发自动退款（按当前规则计算）。若配置退款曲线，将优先按曲线计算（覆盖左侧天/小时规则）。曲线的 X 轴为“已使用周期百分比”(0-100)，Y 轴为退款系数 (0-1)，后端按点之间线性插值。字段说明：percent（已使用百分比 0-100），ratio（退款系数 0-1）。当缩配产生退款时，按该系数折算入钱包金额。小于该金额的补差价将提升到该值。小于该金额的退款将被视为 0。当前后端仅实现“按剩余周期比例”。缩配退款自动入钱包。"
    />
  </SettingsPage>
</template>

<script setup lang="ts">
  import SettingsPage from '../_shared/settings-page.vue'
  import {
    booleanSetting,
    fetchSettingMap,
    saveSettingItems,
    settingBoolean,
    settingInteger,
    settingNumber,
    settingString,
    stringSetting,
    useAdminPermissions
  } from '../_shared/settings'

  defineOptions({ name: 'AdminSettingsPricing' })

  const form = reactive({
    refund_full_days: 1,
    refund_prorate_days: 7,
    refund_no_refund_days: 30,
    refund_full_hours: 0,
    refund_prorate_hours: 0,
    refund_no_refund_hours: 0,
    refund_requires_approval: true,
    refund_on_admin_delete: true,
    refund_curve_json: '[]',
    resize_price_mode: 'remaining',
    resize_refund_ratio: 1,
    resize_rounding: 'round',
    resize_min_charge: 0,
    resize_min_refund: 0,
    resize_refund_to_wallet: true
  })
  const loading = ref(false)
  const saving = ref(false)
  const { hasPermission } = useAdminPermissions()
  const canView = hasPermission('settings.view')
  const canUpdate = hasPermission('settings.update')
  const numberProps = (min: number, max?: number, step = 1) => ({
    min,
    max,
    step,
    class: 'full-width'
  })

  const formItems = computed(() => [
    {
      key: 'refund_full_days',
      label: '全额退款（天）',
      type: 'number',
      props: numberProps(0)
    },
    {
      key: 'refund_prorate_days',
      label: '按比例退款（天）',
      type: 'number',
      props: numberProps(0)
    },
    {
      key: 'refund_no_refund_days',
      label: '不再退款（天）',
      type: 'number',
      props: numberProps(0)
    },
    {
      key: 'refund_full_hours',
      label: '全额退款（小时）',
      type: 'number',
      props: numberProps(0)
    },
    {
      key: 'refund_prorate_hours',
      label: '按比例退款（小时）',
      type: 'number',
      props: numberProps(0)
    },
    {
      key: 'refund_no_refund_hours',
      label: '不再退款（小时）',
      type: 'number',
      props: numberProps(0)
    },
    { key: 'refund_requires_approval', label: '退款需要审核', type: 'switch' },
    { key: 'refund_on_admin_delete', label: '管理员删除实例时自动退款', type: 'switch' },
    { key: 'resize_refund_to_wallet', label: '缩配退款自动进入钱包', type: 'switch' },
    {
      key: 'refund_curve_json',
      label: '退款曲线 JSON',
      type: 'input',
      span: 24,
      props: { type: 'textarea', rows: 10, placeholder: '[{"percent":0,"ratio":1}]' }
    },
    {
      key: 'resize_refund_ratio',
      label: '扩缩容退款系数',
      type: 'number',
      props: numberProps(0, 1, 0.01)
    },
    {
      key: 'resize_min_charge',
      label: '最小补差价',
      type: 'number',
      props: numberProps(0, undefined, 0.01)
    },
    {
      key: 'resize_min_refund',
      label: '最小退款',
      type: 'number',
      props: numberProps(0, undefined, 0.01)
    },
    {
      key: 'resize_price_mode',
      label: '扩缩容计算方式',
      type: 'select',
      props: { options: [{ label: '按剩余周期比例', value: 'remaining' }] }
    },
    {
      key: 'resize_rounding',
      label: '金额舍入方式',
      type: 'select',
      props: {
        options: [
          { label: '四舍五入', value: 'round' },
          { label: '向上取整', value: 'ceil' },
          { label: '向下取整', value: 'floor' }
        ]
      }
    }
  ])

  onMounted(fetchData)

  function normalizeCurve(raw: string): string {
    const text = raw.trim()
    if (!text) return '[]'
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error('退款曲线不是合法 JSON')
    }
    if (!Array.isArray(parsed)) throw new Error('退款曲线必须是数组')

    const normalized = parsed.map((item, index) => {
      const record = item as { percent?: unknown; hours?: unknown; ratio?: unknown }
      const percent = Number(record.percent ?? record.hours)
      const ratio = Number(record.ratio)
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        throw new Error(`退款曲线第 ${index + 1} 项 percent 必须在 0-100 之间`)
      }
      if (!Number.isFinite(ratio) || ratio < 0 || ratio > 1) {
        throw new Error(`退款曲线第 ${index + 1} 项 ratio 必须在 0-1 之间`)
      }
      return { percent: Math.round(percent), ratio }
    })
    normalized.sort((left, right) => left.percent - right.percent)
    return JSON.stringify(normalized, null, 2)
  }

  async function fetchData(): Promise<void> {
    if (!canView.value) return
    loading.value = true
    try {
      const map = await fetchSettingMap()
      form.refund_full_days = settingInteger(map, 'refund_full_days', 1)
      form.refund_prorate_days = settingInteger(map, 'refund_prorate_days', 7)
      form.refund_no_refund_days = settingInteger(map, 'refund_no_refund_days', 30)
      form.refund_full_hours = settingInteger(map, 'refund_full_hours')
      form.refund_prorate_hours = settingInteger(map, 'refund_prorate_hours')
      form.refund_no_refund_hours = settingInteger(map, 'refund_no_refund_hours')
      form.refund_requires_approval = settingBoolean(map, 'refund_requires_approval', true)
      form.refund_on_admin_delete = settingBoolean(map, 'refund_on_admin_delete', true)
      form.refund_curve_json = settingString(map, 'refund_curve_json', '[]')
      form.resize_price_mode = settingString(map, 'resize_price_mode', 'remaining')
      form.resize_refund_ratio = settingNumber(map, 'resize_refund_ratio', 1)
      form.resize_rounding = settingString(map, 'resize_rounding', 'round')
      form.resize_min_charge = settingNumber(map, 'resize_min_charge')
      form.resize_min_refund = settingNumber(map, 'resize_min_refund')
      form.resize_refund_to_wallet = settingBoolean(map, 'resize_refund_to_wallet', true)
    } finally {
      loading.value = false
    }
  }

  async function save(): Promise<void> {
    saving.value = true
    try {
      form.refund_curve_json = normalizeCurve(form.refund_curve_json)
      await saveSettingItems([
        stringSetting('refund_full_days', form.refund_full_days),
        stringSetting('refund_prorate_days', form.refund_prorate_days),
        stringSetting('refund_no_refund_days', form.refund_no_refund_days),
        stringSetting('refund_full_hours', form.refund_full_hours),
        stringSetting('refund_prorate_hours', form.refund_prorate_hours),
        stringSetting('refund_no_refund_hours', form.refund_no_refund_hours),
        booleanSetting('refund_requires_approval', form.refund_requires_approval),
        booleanSetting('refund_on_admin_delete', form.refund_on_admin_delete),
        stringSetting('refund_curve_json', form.refund_curve_json),
        stringSetting('resize_price_mode', form.resize_price_mode),
        stringSetting('resize_refund_ratio', form.resize_refund_ratio),
        stringSetting('resize_rounding', form.resize_rounding),
        stringSetting('resize_min_charge', form.resize_min_charge),
        stringSetting('resize_min_refund', form.resize_min_refund),
        booleanSetting('resize_refund_to_wallet', form.resize_refund_to_wallet)
      ])
      ElMessage.success('保存成功')
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      saving.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .full-width {
    width: 100%;
  }
</style>
