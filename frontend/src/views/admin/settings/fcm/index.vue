<template>
  <SettingsPage
    title="FCM 推送设置"
    subtitle="配置管理员设备推送与 Firebase HTTP v1 凭据"
    :loading="loading"
    :saving="saving"
    :can-view="canView"
    :can-update="canUpdate"
    @refresh="fetchData"
    @save="save"
  >
    <div class="fcm-settings-form">
      <ArtForm
        v-model="form"
        :items="formItems"
        :disabled="loading || saving || !canUpdate"
        :show-reset="false"
        :show-submit="false"
        :span="24"
        label-position="top"
      >
        <template #fcm_enabled>
          <ElSwitch v-model="form.fcm_enabled" :disabled="loading || saving || !canUpdate" />
          <span class="switch-tip">关闭后不会向管理员设备发送推送通知</span>
        </template>
      </ArtForm>
      <ElAlert
        type="info"
        :closable="false"
        show-icon
        title="说明"
        description="优先使用 HTTP v1（Project ID + Service Account JSON）。管理员设备需先调用 /admin/api/v1/push-tokens 注册 token。"
      />
    </div>
  </SettingsPage>
</template>

<script setup lang="ts">
  import SettingsPage from '../_shared/settings-page.vue'
  import {
    booleanSetting,
    fetchSettingMap,
    saveSettingItems,
    settingBoolean,
    settingString,
    stringSetting,
    useAdminPermissions
  } from '../_shared/settings'

  defineOptions({ name: 'AdminSettingsFcm' })

  const form = reactive({
    fcm_enabled: false,
    fcm_server_key: '',
    fcm_project_id: '',
    fcm_service_account_json: ''
  })
  const loading = ref(false)
  const saving = ref(false)
  const { hasPermission } = useAdminPermissions()
  const canView = hasPermission('settings.view')
  const canUpdate = hasPermission('settings.update')

  const formItems = computed(() => [
    { key: 'fcm_enabled', label: '启用 FCM 推送', type: 'switch' },
    {
      key: 'fcm_server_key',
      label: 'FCM Server Key',
      type: 'input',
      props: { type: 'textarea', rows: 3, placeholder: '（可选）旧版 Legacy Server Key，建议留空' }
    },
    {
      key: 'fcm_project_id',
      label: 'FCM Project ID',
      type: 'input',
      props: { placeholder: 'your-firebase-project-id' }
    },
    {
      key: 'fcm_service_account_json',
      label: 'Service Account JSON',
      type: 'input',
      props: { type: 'textarea', rows: 10, placeholder: '粘贴 Service Account JSON' }
    }
  ])

  onMounted(fetchData)

  async function fetchData(): Promise<void> {
    if (!canView.value) return
    loading.value = true
    try {
      const map = await fetchSettingMap()
      form.fcm_enabled = settingBoolean(map, 'fcm_enabled')
      form.fcm_server_key = settingString(map, 'fcm_server_key')
      form.fcm_project_id = settingString(map, 'fcm_project_id')
      form.fcm_service_account_json = settingString(map, 'fcm_service_account_json')
    } finally {
      loading.value = false
    }
  }

  async function save(): Promise<void> {
    saving.value = true
    try {
      await saveSettingItems([
        booleanSetting('fcm_enabled', form.fcm_enabled),
        stringSetting('fcm_server_key', form.fcm_server_key),
        stringSetting('fcm_project_id', form.fcm_project_id),
        stringSetting('fcm_service_account_json', form.fcm_service_account_json)
      ])
      ElMessage.success('保存成功')
    } finally {
      saving.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .fcm-settings-form {
    min-width: 0;
  }
</style>
