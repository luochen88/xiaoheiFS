<template>
  <SettingsPage
    title="生命周期设置"
    subtitle="配置到期提醒、自动回收与紧急续费策略"
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
      :span="12"
      :gutter="20"
      label-position="top"
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
    stringSetting,
    useAdminPermissions
  } from '../_shared/settings'

  defineOptions({ name: 'AdminSettingsLifecycle' })

  const form = reactive({
    email_expire_enabled: false,
    expire_reminder_days: 7,
    auto_delete_enabled: false,
    auto_delete_days: 7,
    emergency_renew_enabled: true,
    emergency_renew_window_days: 7,
    emergency_renew_days: 1,
    emergency_renew_interval_hours: 720
  })
  const loading = ref(false)
  const saving = ref(false)
  const { hasPermission } = useAdminPermissions()
  const canView = hasPermission('settings.view')
  const canUpdate = hasPermission('settings.update')

  const numberProps = (min: number, disabled = false) => ({ min, disabled, class: 'full-width' })
  const formItems = computed(() => [
    { key: 'email_expire_enabled', label: '邮件到期提醒', type: 'switch' },
    {
      key: 'expire_reminder_days',
      label: '提前提醒天数',
      type: 'number',
      props: numberProps(0)
    },
    { key: 'auto_delete_enabled', label: 'VPS 到期自动删除', type: 'switch' },
    {
      key: 'auto_delete_days',
      label: '到期多少天后自动删除',
      type: 'number',
      props: numberProps(0, !form.auto_delete_enabled)
    },
    { key: 'emergency_renew_enabled', label: '允许紧急续费', type: 'switch' },
    {
      key: 'emergency_renew_window_days',
      label: '紧急续费窗口（到期前天数）',
      type: 'number',
      props: numberProps(0, !form.emergency_renew_enabled)
    },
    {
      key: 'emergency_renew_days',
      label: '每次紧急续费延长天数',
      type: 'number',
      props: numberProps(1, !form.emergency_renew_enabled)
    },
    {
      key: 'emergency_renew_interval_hours',
      label: '紧急续费间隔（小时）',
      type: 'number',
      props: numberProps(1, !form.emergency_renew_enabled)
    }
  ])

  onMounted(fetchData)

  async function fetchData(): Promise<void> {
    if (!canView.value) return
    loading.value = true
    try {
      const map = await fetchSettingMap()
      form.email_expire_enabled = settingBoolean(map, 'email_expire_enabled')
      form.expire_reminder_days = Math.max(0, settingInteger(map, 'expire_reminder_days', 7))
      form.auto_delete_enabled = settingBoolean(map, 'auto_delete_enabled')
      form.auto_delete_days = Math.max(0, settingInteger(map, 'auto_delete_days', 7))
      form.emergency_renew_enabled = settingBoolean(map, 'emergency_renew_enabled', true)
      form.emergency_renew_window_days = Math.max(
        0,
        settingInteger(map, 'emergency_renew_window_days', 7)
      )
      form.emergency_renew_days = Math.max(1, settingInteger(map, 'emergency_renew_days', 1))
      form.emergency_renew_interval_hours = Math.max(
        1,
        settingInteger(map, 'emergency_renew_interval_hours', 720)
      )
    } finally {
      loading.value = false
    }
  }

  async function save(): Promise<void> {
    saving.value = true
    try {
      await saveSettingItems([
        booleanSetting('email_expire_enabled', form.email_expire_enabled),
        stringSetting('expire_reminder_days', Math.max(0, form.expire_reminder_days)),
        booleanSetting('auto_delete_enabled', form.auto_delete_enabled),
        stringSetting('auto_delete_days', Math.max(0, form.auto_delete_days)),
        booleanSetting('emergency_renew_enabled', form.emergency_renew_enabled),
        stringSetting('emergency_renew_window_days', Math.max(0, form.emergency_renew_window_days)),
        stringSetting('emergency_renew_days', Math.max(1, form.emergency_renew_days)),
        stringSetting(
          'emergency_renew_interval_hours',
          Math.max(1, form.emergency_renew_interval_hours)
        )
      ])
      ElMessage.success('保存成功')
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
