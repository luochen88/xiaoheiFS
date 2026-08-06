<template>
  <SettingsPage
    title="验证码设置"
    subtitle="独立管理登录、注册验证码与极验方案"
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

    <ElAlert
      type="info"
      :closable="false"
      show-icon
      title="切换到极验后，登录与注册会改用极验行为验证。"
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
    settingString,
    stringSetting,
    useAdminPermissions
  } from '../_shared/settings'

  defineOptions({ name: 'AdminSettingsCaptcha' })

  const form = reactive({
    auth_register_captcha_enabled: true,
    auth_login_captcha_enabled: false,
    auth_captcha_provider: 'image',
    auth_captcha_code_len: 5,
    auth_captcha_code_complexity: 'alnum',
    auth_geetest_captcha_id: '',
    auth_geetest_captcha_key: '',
    auth_geetest_api_server: 'https://gcaptcha4.geetest.com'
  })

  const loading = ref(false)
  const saving = ref(false)
  const { hasPermission } = useAdminPermissions()
  const canView = hasPermission('settings.view')
  const canUpdate = hasPermission('settings.update')

  const formItems = computed(() => [
    { key: 'auth_register_captcha_enabled', label: '注册启用验证码', type: 'switch' },
    { key: 'auth_login_captcha_enabled', label: '登录启用验证码', type: 'switch' },
    {
      key: 'auth_captcha_provider',
      label: '验证码方案',
      type: 'radiogroup',
      span: 24,
      props: {
        options: [
          { label: '图形验证码', value: 'image' },
          { label: '极验（GeeTest）', value: 'geetest' }
        ]
      }
    },
    {
      key: 'auth_captcha_code_len',
      label: '图形验证码长度',
      type: 'number',
      props: { min: 4, max: 12, class: 'full-width' }
    },
    {
      key: 'auth_captcha_code_complexity',
      label: '图形验证码复杂度',
      type: 'select',
      props: {
        options: [
          { label: '纯数字', value: 'digits' },
          { label: '纯字母（大写）', value: 'letters' },
          { label: '字母 + 数字', value: 'alnum' }
        ]
      }
    },
    {
      key: 'auth_geetest_captcha_id',
      label: 'GeeTest Captcha ID',
      type: 'input',
      props: { placeholder: '请输入极验 captcha_id' }
    },
    {
      key: 'auth_geetest_captcha_key',
      label: 'GeeTest Captcha Key',
      type: 'input',
      props: { type: 'password', showPassword: true, placeholder: '请输入极验 captcha_key' }
    },
    {
      key: 'auth_geetest_api_server',
      label: 'GeeTest API Server',
      type: 'input',
      span: 24,
      props: { placeholder: 'https://gcaptcha4.geetest.com' }
    }
  ])

  onMounted(fetchData)

  function normalizeProvider(value: unknown): string {
    return String(value).toLowerCase() === 'geetest' ? 'geetest' : 'image'
  }

  function normalizeComplexity(value: unknown): string {
    const normalized = String(value).toLowerCase()
    return ['digits', 'letters', 'alnum'].includes(normalized) ? normalized : 'alnum'
  }

  async function fetchData(): Promise<void> {
    if (!canView.value) return
    loading.value = true
    try {
      const map = await fetchSettingMap()
      form.auth_register_captcha_enabled = settingBoolean(
        map,
        'auth_register_captcha_enabled',
        true
      )
      form.auth_login_captcha_enabled = settingBoolean(map, 'auth_login_captcha_enabled')
      form.auth_captcha_provider = normalizeProvider(settingString(map, 'auth_captcha_provider'))
      form.auth_captcha_code_len = settingInteger(map, 'auth_captcha_code_len', 5)
      form.auth_captcha_code_complexity = normalizeComplexity(
        settingString(map, 'auth_captcha_code_complexity', 'alnum')
      )
      form.auth_geetest_captcha_id = settingString(map, 'auth_geetest_captcha_id')
      form.auth_geetest_captcha_key = settingString(map, 'auth_geetest_captcha_key')
      form.auth_geetest_api_server = settingString(
        map,
        'auth_geetest_api_server',
        'https://gcaptcha4.geetest.com'
      )
    } finally {
      loading.value = false
    }
  }

  async function save(): Promise<void> {
    saving.value = true
    try {
      await saveSettingItems([
        booleanSetting('auth_register_captcha_enabled', form.auth_register_captcha_enabled),
        booleanSetting('auth_login_captcha_enabled', form.auth_login_captcha_enabled),
        stringSetting('auth_captcha_provider', normalizeProvider(form.auth_captcha_provider)),
        stringSetting('auth_captcha_code_len', Math.max(4, form.auth_captcha_code_len)),
        stringSetting(
          'auth_captcha_code_complexity',
          normalizeComplexity(form.auth_captcha_code_complexity)
        ),
        stringSetting('auth_geetest_captcha_id', form.auth_geetest_captcha_id.trim()),
        stringSetting('auth_geetest_captcha_key', form.auth_geetest_captcha_key.trim()),
        stringSetting(
          'auth_geetest_api_server',
          form.auth_geetest_api_server.trim() || 'https://gcaptcha4.geetest.com'
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
