<template>
  <SettingsPage
    title="注册与登录设置"
    subtitle="统一管理注册入口、密码规则、验证码策略和登录保护"
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
    >
      <template #password_rules>
        <div class="password-rules">
          <ElCheckbox v-model="form.auth_password_require_upper">大写字母</ElCheckbox>
          <ElCheckbox v-model="form.auth_password_require_lower">小写字母</ElCheckbox>
          <ElCheckbox v-model="form.auth_password_require_number">数字</ElCheckbox>
          <ElCheckbox v-model="form.auth_password_require_symbol">符号</ElCheckbox>
        </div>
      </template>
    </ArtForm>

    <ElAlert
      type="info"
      :closable="false"
      show-icon
      title="邮箱模板和短信模板分别在邮件设置、短信设置中维护。"
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
    settingList,
    settingString,
    stringSetting,
    useAdminPermissions
  } from '../_shared/settings'

  defineOptions({ name: 'AdminSettingsAuth' })

  interface AuthForm extends Record<string, unknown> {
    auth_register_enabled: boolean
    auth_register_required_fields: string[]
    auth_register_email_required: boolean
    auth_password_min_len: number
    auth_password_require_upper: boolean
    auth_password_require_lower: boolean
    auth_password_require_number: boolean
    auth_password_require_symbol: boolean
    auth_register_verify_type: string
    auth_register_verify_channels: string[]
    auth_register_verify_ttl_sec: number
    auth_login_rate_limit_enabled: boolean
    auth_login_rate_limit_window_sec: number
    auth_login_rate_limit_max_attempts: number
    auth_login_notify_enabled: boolean
    auth_login_notify_events: string[]
    auth_login_notify_channels: string[]
    auth_password_reset_enabled: boolean
    auth_password_reset_channels: string[]
    auth_password_reset_verify_ttl_sec: number
    auth_sms_code_len: number
    auth_sms_code_complexity: string
    auth_email_code_len: number
    auth_email_code_complexity: string
    auth_email_bind_enabled: boolean
    auth_phone_bind_enabled: boolean
    auth_contact_change_notify_old_enabled: boolean
    auth_contact_bind_verify_ttl_sec: number
    auth_bind_require_password_when_no_2fa: boolean
    auth_rebind_require_password_when_no_2fa: boolean
    auth_2fa_enabled: boolean
    auth_2fa_bind_enabled: boolean
    auth_2fa_rebind_enabled: boolean
  }

  const form = reactive<AuthForm>({
    auth_register_enabled: true,
    auth_register_required_fields: ['username', 'password'],
    auth_register_email_required: true,
    auth_password_min_len: 6,
    auth_password_require_upper: false,
    auth_password_require_lower: false,
    auth_password_require_number: false,
    auth_password_require_symbol: false,
    auth_register_verify_type: 'none',
    auth_register_verify_channels: ['email'],
    auth_register_verify_ttl_sec: 600,
    auth_login_rate_limit_enabled: true,
    auth_login_rate_limit_window_sec: 300,
    auth_login_rate_limit_max_attempts: 5,
    auth_login_notify_enabled: true,
    auth_login_notify_events: ['first', 'ip_change'],
    auth_login_notify_channels: ['email'],
    auth_password_reset_enabled: true,
    auth_password_reset_channels: ['email'],
    auth_password_reset_verify_ttl_sec: 600,
    auth_sms_code_len: 6,
    auth_sms_code_complexity: 'digits',
    auth_email_code_len: 6,
    auth_email_code_complexity: 'alnum',
    auth_email_bind_enabled: true,
    auth_phone_bind_enabled: true,
    auth_contact_change_notify_old_enabled: true,
    auth_contact_bind_verify_ttl_sec: 600,
    auth_bind_require_password_when_no_2fa: false,
    auth_rebind_require_password_when_no_2fa: true,
    auth_2fa_enabled: true,
    auth_2fa_bind_enabled: true,
    auth_2fa_rebind_enabled: true
  })

  const loading = ref(false)
  const saving = ref(false)
  const { hasPermission } = useAdminPermissions()
  const canView = hasPermission('settings.view')
  const canUpdate = hasPermission('settings.update')

  const channelOptions = [
    { label: '邮箱', value: 'email' },
    { label: '短信', value: 'sms' }
  ]
  const complexityOptions = [
    { label: '纯数字', value: 'digits' },
    { label: '纯字母（大写）', value: 'letters' },
    { label: '字母 + 数字', value: 'alnum' }
  ]
  const fullNumberProps = (min: number, max?: number) => ({ min, max, class: 'full-width' })

  const formItems = computed(() => [
    { key: 'auth_register_enabled', label: '开启注册', type: 'switch' },
    { key: 'auth_register_email_required', label: '注册时邮箱必填', type: 'switch' },
    {
      key: 'auth_register_required_fields',
      label: '注册必填字段',
      type: 'checkboxgroup',
      span: 24,
      props: {
        options: [
          { label: '用户名', value: 'username', disabled: true },
          { label: '密码', value: 'password', disabled: true },
          { label: '手机号', value: 'phone' },
          { label: 'QQ', value: 'qq' }
        ]
      }
    },
    {
      key: 'auth_password_min_len',
      label: '密码最小长度',
      type: 'number',
      props: fullNumberProps(6, 64)
    },
    { key: 'password_rules', label: '密码必须包含', span: 12 },
    {
      key: 'auth_register_verify_channels',
      label: '注册验证码渠道',
      type: 'checkboxgroup',
      props: { options: channelOptions }
    },
    {
      key: 'auth_register_verify_ttl_sec',
      label: '注册验证码有效期（秒）',
      type: 'number',
      props: fullNumberProps(60, 3600)
    },
    {
      key: 'auth_sms_code_len',
      label: '短信验证码长度',
      type: 'number',
      props: fullNumberProps(4, 12)
    },
    {
      key: 'auth_sms_code_complexity',
      label: '短信验证码复杂度',
      type: 'select',
      props: { options: complexityOptions }
    },
    {
      key: 'auth_email_code_len',
      label: '邮箱验证码长度',
      type: 'number',
      props: fullNumberProps(4, 12)
    },
    {
      key: 'auth_email_code_complexity',
      label: '邮箱验证码复杂度',
      type: 'select',
      props: { options: complexityOptions }
    },
    { key: 'auth_login_notify_enabled', label: '登录提醒', type: 'switch' },
    {
      key: 'auth_login_notify_events',
      label: '登录提醒触发事件',
      type: 'checkboxgroup',
      props: {
        options: [
          { label: '首次登录', value: 'first' },
          { label: 'IP 变化', value: 'ip_change' }
        ]
      }
    },
    {
      key: 'auth_login_notify_channels',
      label: '登录提醒渠道',
      type: 'checkboxgroup',
      props: { options: channelOptions }
    },
    { key: 'auth_password_reset_enabled', label: '允许找回密码', type: 'switch' },
    {
      key: 'auth_password_reset_channels',
      label: '找回密码渠道',
      type: 'checkboxgroup',
      props: { options: channelOptions }
    },
    {
      key: 'auth_password_reset_verify_ttl_sec',
      label: '找回验证码有效期（秒）',
      type: 'number',
      props: fullNumberProps(60, 3600)
    },
    { key: 'auth_email_bind_enabled', label: '允许绑定邮箱', type: 'switch' },
    { key: 'auth_phone_bind_enabled', label: '允许绑定手机号', type: 'switch' },
    {
      key: 'auth_contact_change_notify_old_enabled',
      label: '换绑后通知旧联系方式',
      type: 'switch'
    },
    {
      key: 'auth_contact_bind_verify_ttl_sec',
      label: '绑定验证码有效期（秒）',
      type: 'number',
      props: fullNumberProps(60, 3600)
    },
    {
      key: 'auth_bind_require_password_when_no_2fa',
      label: '未开 2FA 时首次绑定需密码',
      type: 'switch'
    },
    {
      key: 'auth_rebind_require_password_when_no_2fa',
      label: '未开 2FA 时换绑需密码',
      type: 'switch'
    },
    { key: 'auth_2fa_enabled', label: '2FA 总开关', type: 'switch' },
    { key: 'auth_2fa_bind_enabled', label: '2FA 绑定流程', type: 'switch' },
    { key: 'auth_2fa_rebind_enabled', label: '2FA 换绑流程', type: 'switch' },
    { key: 'auth_login_rate_limit_enabled', label: '登录频率限制', type: 'switch' },
    {
      key: 'auth_login_rate_limit_window_sec',
      label: '频率限制窗口（秒）',
      type: 'number',
      props: fullNumberProps(60, 3600)
    },
    {
      key: 'auth_login_rate_limit_max_attempts',
      label: '窗口内最大尝试次数',
      type: 'number',
      props: fullNumberProps(3, 30)
    }
  ])

  onMounted(fetchData)

  function normalizeRequiredFields(): void {
    const values = new Set(form.auth_register_required_fields.map(String))
    values.add('username')
    values.add('password')
    values.delete('email')
    form.auth_register_required_fields = [...values]
  }

  function normalizeComplexity(value: unknown, fallback: string): string {
    const normalized = String(value).toLowerCase()
    return ['digits', 'letters', 'alnum'].includes(normalized) ? normalized : fallback
  }

  async function fetchData(): Promise<void> {
    if (!canView.value) return
    loading.value = true
    try {
      const map = await fetchSettingMap()
      form.auth_register_enabled = settingBoolean(map, 'auth_register_enabled', true)
      form.auth_register_required_fields = settingList(map, 'auth_register_required_fields', [
        'username',
        'password'
      ])
      form.auth_register_email_required = settingBoolean(map, 'auth_register_email_required', true)
      form.auth_password_min_len = settingInteger(map, 'auth_password_min_len', 6)
      form.auth_password_require_upper = settingBoolean(map, 'auth_password_require_upper')
      form.auth_password_require_lower = settingBoolean(map, 'auth_password_require_lower')
      form.auth_password_require_number = settingBoolean(map, 'auth_password_require_number')
      form.auth_password_require_symbol = settingBoolean(map, 'auth_password_require_symbol')
      form.auth_register_verify_type = settingString(map, 'auth_register_verify_type', 'none')
      form.auth_register_verify_channels = settingList(
        map,
        'auth_register_verify_channels',
        form.auth_register_verify_type === 'none' ? [] : [form.auth_register_verify_type]
      )
      form.auth_register_verify_ttl_sec = settingInteger(map, 'auth_register_verify_ttl_sec', 600)
      form.auth_login_rate_limit_enabled = settingBoolean(
        map,
        'auth_login_rate_limit_enabled',
        true
      )
      form.auth_login_rate_limit_window_sec = settingInteger(
        map,
        'auth_login_rate_limit_window_sec',
        300
      )
      form.auth_login_rate_limit_max_attempts = settingInteger(
        map,
        'auth_login_rate_limit_max_attempts',
        5
      )
      form.auth_login_notify_enabled = settingBoolean(map, 'auth_login_notify_enabled', true)
      form.auth_login_notify_events = [
        ...(settingBoolean(map, 'auth_login_notify_on_first_login', true) ? ['first'] : []),
        ...(settingBoolean(map, 'auth_login_notify_on_ip_change', true) ? ['ip_change'] : [])
      ]
      form.auth_login_notify_channels = settingList(map, 'auth_login_notify_channels', ['email'])
      form.auth_password_reset_enabled = settingBoolean(map, 'auth_password_reset_enabled', true)
      form.auth_password_reset_channels = settingList(map, 'auth_password_reset_channels', [
        'email'
      ])
      form.auth_password_reset_verify_ttl_sec = settingInteger(
        map,
        'auth_password_reset_verify_ttl_sec',
        600
      )
      form.auth_sms_code_len = settingInteger(map, 'auth_sms_code_len', 6)
      form.auth_sms_code_complexity = normalizeComplexity(
        settingString(map, 'auth_sms_code_complexity'),
        'digits'
      )
      form.auth_email_code_len = settingInteger(map, 'auth_email_code_len', 6)
      form.auth_email_code_complexity = normalizeComplexity(
        settingString(map, 'auth_email_code_complexity'),
        'alnum'
      )
      form.auth_email_bind_enabled = settingBoolean(map, 'auth_email_bind_enabled', true)
      form.auth_phone_bind_enabled = settingBoolean(map, 'auth_phone_bind_enabled', true)
      form.auth_contact_change_notify_old_enabled = settingBoolean(
        map,
        'auth_contact_change_notify_old_enabled',
        true
      )
      form.auth_contact_bind_verify_ttl_sec = settingInteger(
        map,
        'auth_contact_bind_verify_ttl_sec',
        600
      )
      form.auth_bind_require_password_when_no_2fa = settingBoolean(
        map,
        'auth_bind_require_password_when_no_2fa'
      )
      form.auth_rebind_require_password_when_no_2fa = settingBoolean(
        map,
        'auth_rebind_require_password_when_no_2fa',
        true
      )
      form.auth_2fa_enabled = settingBoolean(map, 'auth_2fa_enabled', true)
      form.auth_2fa_bind_enabled = settingBoolean(map, 'auth_2fa_bind_enabled', true)
      form.auth_2fa_rebind_enabled = settingBoolean(map, 'auth_2fa_rebind_enabled', true)
      normalizeRequiredFields()
    } finally {
      loading.value = false
    }
  }

  async function save(): Promise<void> {
    normalizeRequiredFields()
    form.auth_register_verify_type = !form.auth_register_verify_channels.length
      ? 'none'
      : form.auth_register_verify_channels.includes('email')
        ? 'email'
        : 'sms'
    saving.value = true
    try {
      await saveSettingItems([
        booleanSetting('auth_register_enabled', form.auth_register_enabled),
        stringSetting(
          'auth_register_required_fields',
          JSON.stringify(form.auth_register_required_fields)
        ),
        booleanSetting('auth_register_email_required', form.auth_register_email_required),
        stringSetting('auth_password_min_len', form.auth_password_min_len),
        booleanSetting('auth_password_require_upper', form.auth_password_require_upper),
        booleanSetting('auth_password_require_lower', form.auth_password_require_lower),
        booleanSetting('auth_password_require_number', form.auth_password_require_number),
        booleanSetting('auth_password_require_symbol', form.auth_password_require_symbol),
        stringSetting('auth_register_verify_type', form.auth_register_verify_type),
        stringSetting(
          'auth_register_verify_channels',
          JSON.stringify(form.auth_register_verify_channels)
        ),
        stringSetting('auth_register_verify_ttl_sec', form.auth_register_verify_ttl_sec),
        booleanSetting('auth_login_rate_limit_enabled', form.auth_login_rate_limit_enabled),
        stringSetting('auth_login_rate_limit_window_sec', form.auth_login_rate_limit_window_sec),
        stringSetting(
          'auth_login_rate_limit_max_attempts',
          form.auth_login_rate_limit_max_attempts
        ),
        booleanSetting('auth_login_notify_enabled', form.auth_login_notify_enabled),
        stringSetting(
          'auth_login_notify_channels',
          JSON.stringify(form.auth_login_notify_channels)
        ),
        booleanSetting(
          'auth_login_notify_on_first_login',
          form.auth_login_notify_events.includes('first')
        ),
        booleanSetting(
          'auth_login_notify_on_ip_change',
          form.auth_login_notify_events.includes('ip_change')
        ),
        booleanSetting('auth_password_reset_enabled', form.auth_password_reset_enabled),
        stringSetting(
          'auth_password_reset_channels',
          JSON.stringify(form.auth_password_reset_channels)
        ),
        stringSetting(
          'auth_password_reset_verify_ttl_sec',
          form.auth_password_reset_verify_ttl_sec
        ),
        stringSetting('auth_sms_code_len', form.auth_sms_code_len),
        stringSetting(
          'auth_sms_code_complexity',
          normalizeComplexity(form.auth_sms_code_complexity, 'digits')
        ),
        stringSetting('auth_email_code_len', form.auth_email_code_len),
        stringSetting(
          'auth_email_code_complexity',
          normalizeComplexity(form.auth_email_code_complexity, 'alnum')
        ),
        booleanSetting('auth_email_bind_enabled', form.auth_email_bind_enabled),
        booleanSetting('auth_phone_bind_enabled', form.auth_phone_bind_enabled),
        booleanSetting(
          'auth_contact_change_notify_old_enabled',
          form.auth_contact_change_notify_old_enabled
        ),
        stringSetting('auth_contact_bind_verify_ttl_sec', form.auth_contact_bind_verify_ttl_sec),
        booleanSetting(
          'auth_bind_require_password_when_no_2fa',
          form.auth_bind_require_password_when_no_2fa
        ),
        booleanSetting(
          'auth_rebind_require_password_when_no_2fa',
          form.auth_rebind_require_password_when_no_2fa
        ),
        booleanSetting('auth_2fa_enabled', form.auth_2fa_enabled),
        booleanSetting('auth_2fa_bind_enabled', form.auth_2fa_bind_enabled),
        booleanSetting('auth_2fa_rebind_enabled', form.auth_2fa_rebind_enabled)
      ])
      ElMessage.success('保存成功')
    } finally {
      saving.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .password-rules {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    min-height: 32px;
  }

  .full-width {
    width: 100%;
  }
</style>
