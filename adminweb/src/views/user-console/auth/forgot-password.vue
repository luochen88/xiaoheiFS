<template>
  <div class="user-login-page">
    <div class="login-brand">
      <div class="brand-mark">
        <ArtLogo :size="34" />
      </div>
      <div>
        <div class="brand-title">{{ site.resolvedSiteName }}</div>
        <div class="brand-subtitle">用户控制台</div>
      </div>
    </div>

    <ElCard class="login-card reset-card" shadow="never">
      <div class="card-title">找回密码</div>
      <div class="card-desc">通过账号绑定的邮箱或手机号验证身份后重置密码。</div>

      <ElSteps :active="activeStep" finish-status="success" simple class="reset-steps">
        <ElStep title="确认账号" />
        <ElStep title="验证身份" />
        <ElStep title="设置密码" />
      </ElSteps>

      <ElAlert
        v-if="errorMessage"
        class="reset-alert"
        type="error"
        :title="errorMessage"
        show-icon
        :closable="true"
        @close="errorMessage = ''"
      />

      <ElForm
        v-if="step === 'account'"
        ref="accountFormRef"
        :model="accountForm"
        :rules="accountRules"
        label-position="top"
        class="login-form"
        @keyup.enter="loadResetOptions"
      >
        <ElFormItem label="账号" prop="account">
          <ElInput
            v-model.trim="accountForm.account"
            :maxlength="INPUT_LIMITS.EMAIL"
            placeholder="请输入用户名、邮箱或手机号"
            clearable
            @input="clearResetState"
          />
        </ElFormItem>

        <ElEmpty
          v-if="settingsLoaded && settings.auth_password_reset_enabled === false"
          description="当前站点未开启用户密码找回"
          :image-size="88"
        />

        <ElButton
          type="primary"
          class="login-button"
          :loading="loading.options"
          :disabled="settings.auth_password_reset_enabled === false"
          @click="loadResetOptions"
        >
          下一步
        </ElButton>
      </ElForm>

      <ElForm
        v-else-if="step === 'verify'"
        ref="verifyFormRef"
        :model="verifyForm"
        :rules="verifyRules"
        label-position="top"
        class="login-form"
        @keyup.enter="verifyCode"
      >
        <ElFormItem label="验证方式" prop="channel">
          <ElRadioGroup
            v-model="verifyForm.channel"
            class="channel-list"
            @change="handleChannelChange"
          >
            <ElRadioButton v-for="channel in availableChannels" :key="channel" :label="channel">
              {{ channelLabel(channel) }}
            </ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>

        <ElEmpty
          v-if="availableChannels.length === 0"
          description="该账号没有可用的密码找回方式"
          :image-size="88"
        />

        <template v-else>
          <div class="channel-hint"> 验证码将发送到 {{ receiverLabel }} </div>

          <ElFormItem
            v-if="verifyForm.channel === 'sms' && resetOptions?.sms_requires_phone_full"
            label="完整手机号"
            prop="phone_full"
          >
            <ElInput
              v-model.trim="verifyForm.phone_full"
              :maxlength="INPUT_LIMITS.PHONE"
              placeholder="请输入完整手机号"
              clearable
              @input="resetTicketState"
            />
          </ElFormItem>

          <ElFormItem label="验证码" prop="code">
            <div class="code-row">
              <ElInput
                v-model.trim="verifyForm.code"
                maxlength="12"
                placeholder="请输入验证码"
                clearable
                @input="resetTicketState"
              />
              <ElButton :loading="loading.sendCode" :disabled="sendCodeDisabled" @click="sendCode">
                {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
              </ElButton>
            </div>
          </ElFormItem>

          <ElButton
            type="primary"
            class="login-button"
            :loading="loading.verify"
            @click="verifyCode"
          >
            验证并继续
          </ElButton>
        </template>

        <ElButton class="secondary-button" text @click="backToAccount">返回修改账号</ElButton>
      </ElForm>

      <ElForm
        v-else
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-position="top"
        class="login-form"
        @keyup.enter="confirmReset"
      >
        <ElAlert
          class="reset-alert"
          type="success"
          title="身份验证已通过，请设置新密码。"
          show-icon
          :closable="false"
        />

        <ElFormItem label="新密码" prop="new_password">
          <ElInput
            v-model.trim="passwordForm.new_password"
            :maxlength="INPUT_LIMITS.PASSWORD"
            placeholder="请输入新密码"
            type="password"
            show-password
          />
        </ElFormItem>

        <ElFormItem label="确认新密码" prop="confirm_password">
          <ElInput
            v-model.trim="passwordForm.confirm_password"
            :maxlength="INPUT_LIMITS.PASSWORD"
            placeholder="请再次输入新密码"
            type="password"
            show-password
          />
        </ElFormItem>

        <ElButton
          type="primary"
          class="login-button"
          :loading="loading.confirm"
          @click="confirmReset"
        >
          重置密码并登录
        </ElButton>
        <ElButton class="secondary-button" text @click="backToVerify">重新验证</ElButton>
      </ElForm>

      <div class="login-footer">
        <RouterLink to="/user/login">返回登录</RouterLink>
        <span>普通用户密码找回</span>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    confirmUserPasswordReset,
    getAuthSettings,
    getUserPasswordResetOptions,
    sendUserPasswordResetCode,
    verifyUserPasswordResetCode,
    type AuthSettings,
    type PasswordResetChannel,
    type PasswordResetOptionsResponse
  } from '@/api/console-user'
  import { useConsoleSiteStore } from '@/store/modules/console-site'
  import { useConsoleUserStore } from '@/store/modules/console-user'
  import { INPUT_LIMITS } from '@/utils/constants'

  defineOptions({ name: 'ConsoleUserForgotPassword' })

  type ResetStep = 'account' | 'verify' | 'password'

  const router = useRouter()
  const site = useConsoleSiteStore()
  const user = useConsoleUserStore()

  const accountFormRef = ref<FormInstance>()
  const verifyFormRef = ref<FormInstance>()
  const passwordFormRef = ref<FormInstance>()
  const step = ref<ResetStep>('account')
  const resetOptions = ref<PasswordResetOptionsResponse | null>(null)
  const resetTicket = ref('')
  const ticketExpiresIn = ref(0)
  const countdown = ref(0)
  const countdownTimer = ref<number | null>(null)
  const errorMessage = ref('')
  const settingsLoaded = ref(false)

  const settings = reactive<AuthSettings>({
    auth_password_reset_enabled: true,
    auth_password_reset_channels: ['email']
  })

  const loading = reactive({
    settings: false,
    options: false,
    sendCode: false,
    verify: false,
    confirm: false
  })

  const accountForm = reactive({
    account: ''
  })

  const verifyForm = reactive<{
    channel: PasswordResetChannel
    phone_full: string
    code: string
  }>({
    channel: 'email',
    phone_full: '',
    code: ''
  })

  const passwordForm = reactive({
    new_password: '',
    confirm_password: ''
  })

  const activeStep = computed(() => {
    if (step.value === 'account') return 0
    if (step.value === 'verify') return 1
    return 2
  })

  const availableChannels = computed<PasswordResetChannel[]>(() => {
    const enabled = new Set(settings.auth_password_reset_channels || [])
    return (resetOptions.value?.channels || []).filter((channel) => enabled.has(channel))
  })

  const receiverLabel = computed(() => {
    if (verifyForm.channel === 'sms') {
      return resetOptions.value?.masked_phone || '绑定手机号'
    }
    return resetOptions.value?.masked_email || '绑定邮箱'
  })

  const sendCodeDisabled = computed(() => {
    return loading.sendCode || countdown.value > 0 || availableChannels.value.length === 0
  })

  const accountRules: FormRules = {
    account: [{ required: true, message: '请输入账号', trigger: 'blur' }]
  }

  const verifyRules = computed<FormRules>(() => ({
    channel: [{ required: true, message: '请选择验证方式', trigger: 'change' }],
    phone_full:
      verifyForm.channel === 'sms' && resetOptions.value?.sms_requires_phone_full
        ? [
            { required: true, message: '请输入完整手机号', trigger: 'blur' },
            {
              validator: (_rule, value, callback) => {
                if (!/^[0-9+\-\s]{6,20}$/.test(String(value || '').trim())) {
                  callback(new Error('请输入有效手机号'))
                  return
                }
                callback()
              },
              trigger: 'blur'
            }
          ]
        : [],
    code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
  }))

  const passwordRules = computed<FormRules>(() => ({
    new_password: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      {
        validator: (_rule, value, callback) => {
          const password = String(value || '')
          const minLen = settings.password_min_len || 6
          if (password.length < minLen) {
            callback(new Error(`密码长度不能少于 ${minLen} 位`))
            return
          }
          if (settings.password_require_upper && !/[A-Z]/.test(password)) {
            callback(new Error('密码需要包含大写字母'))
            return
          }
          if (settings.password_require_lower && !/[a-z]/.test(password)) {
            callback(new Error('密码需要包含小写字母'))
            return
          }
          if (settings.password_require_number && !/[0-9]/.test(password)) {
            callback(new Error('密码需要包含数字'))
            return
          }
          if (settings.password_require_symbol && !/[^A-Za-z0-9]/.test(password)) {
            callback(new Error('密码需要包含符号'))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ],
    confirm_password: [
      { required: true, message: '请再次输入新密码', trigger: 'blur' },
      {
        validator: (_rule, value, callback) => {
          if (String(value || '') !== passwordForm.new_password) {
            callback(new Error('两次输入的密码不一致'))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ]
  }))

  function getErrorMessage(error: any) {
    return (
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.response?.data?.msg ||
      error?.message ||
      '操作失败，请稍后重试'
    )
  }

  function setError(error: any) {
    errorMessage.value = getErrorMessage(error)
    ElMessage.error(errorMessage.value)
  }

  function channelLabel(channel: PasswordResetChannel) {
    return channel === 'sms' ? '短信验证' : '邮箱验证'
  }

  function stopCountdown() {
    if (countdownTimer.value !== null) {
      window.clearInterval(countdownTimer.value)
      countdownTimer.value = null
    }
    countdown.value = 0
  }

  function startCountdown(seconds = 60) {
    stopCountdown()
    countdown.value = seconds
    countdownTimer.value = window.setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0) {
        stopCountdown()
      }
    }, 1000)
  }

  function resetTicketState() {
    resetTicket.value = ''
    ticketExpiresIn.value = 0
    passwordForm.new_password = ''
    passwordForm.confirm_password = ''
  }

  function clearVerifyState() {
    verifyForm.phone_full = ''
    verifyForm.code = ''
    resetTicketState()
    stopCountdown()
  }

  function clearResetState() {
    resetOptions.value = null
    errorMessage.value = ''
    clearVerifyState()
    if (step.value !== 'account') {
      step.value = 'account'
    }
  }

  function handleChannelChange() {
    verifyForm.code = ''
    verifyForm.phone_full = ''
    resetTicketState()
    stopCountdown()
  }

  async function loadSettings() {
    loading.settings = true
    try {
      Object.assign(settings, await getAuthSettings())
    } catch {
      // Keep defaults so the page can still try the public reset flow.
    } finally {
      settingsLoaded.value = true
      loading.settings = false
    }
  }

  async function loadResetOptions() {
    if (!accountFormRef.value) return
    await accountFormRef.value.validate()

    errorMessage.value = ''
    clearVerifyState()
    loading.options = true
    try {
      const account = accountForm.account.trim()
      const options = await getUserPasswordResetOptions(account)
      resetOptions.value = options || {}

      if (availableChannels.value.length === 0) {
        step.value = 'verify'
        return
      }

      verifyForm.channel = availableChannels.value.includes('email')
        ? 'email'
        : availableChannels.value[0]
      step.value = 'verify'
    } catch (error) {
      resetOptions.value = null
      setError(error)
    } finally {
      loading.options = false
    }
  }

  async function sendCode() {
    if (!verifyFormRef.value) return
    await verifyFormRef.value.validateField(['channel', 'phone_full'])

    errorMessage.value = ''
    verifyForm.code = ''
    resetTicketState()
    loading.sendCode = true
    try {
      await sendUserPasswordResetCode({
        account: accountForm.account.trim(),
        channel: verifyForm.channel,
        phone_full: verifyForm.phone_full.trim() || undefined
      })
      ElMessage.success('验证码已发送')
      startCountdown()
    } catch (error) {
      setError(error)
    } finally {
      loading.sendCode = false
    }
  }

  async function verifyCode() {
    if (!verifyFormRef.value) return
    await verifyFormRef.value.validate()

    errorMessage.value = ''
    resetTicketState()
    loading.verify = true
    try {
      const response = await verifyUserPasswordResetCode({
        account: accountForm.account.trim(),
        channel: verifyForm.channel,
        code: verifyForm.code.trim()
      })
      resetTicket.value = response?.reset_ticket || ''
      ticketExpiresIn.value = response?.expires_in || 0

      if (!resetTicket.value) {
        throw new Error('未获取到重置票据，请重新验证')
      }

      stopCountdown()
      step.value = 'password'
    } catch (error) {
      resetTicketState()
      setError(error)
    } finally {
      loading.verify = false
    }
  }

  async function confirmReset() {
    if (!passwordFormRef.value) return
    await passwordFormRef.value.validate()

    if (!resetTicket.value) {
      ElMessage.warning('重置票据已失效，请重新验证')
      step.value = 'verify'
      return
    }

    errorMessage.value = ''
    loading.confirm = true
    try {
      const response = await confirmUserPasswordReset({
        reset_ticket: resetTicket.value,
        new_password: passwordForm.new_password
      })
      resetTicketState()
      clearVerifyState()

      if (response?.access_token) {
        user.setToken(response.access_token)
        user.profile = response.user || null
        if (!user.profile) {
          await user.fetchMe()
        }
      }

      ElMessage.success('密码已重置')
      await router.replace('/console')
    } catch (error) {
      resetTicketState()
      setError(error)
      step.value = 'verify'
    } finally {
      loading.confirm = false
    }
  }

  function backToAccount() {
    clearResetState()
  }

  function backToVerify() {
    resetTicketState()
    step.value = 'verify'
  }

  onMounted(() => {
    site.fetchSettings()
    loadSettings()
  })

  onBeforeUnmount(() => {
    stopCountdown()
    resetTicketState()
  })
</script>

<style scoped lang="scss">
  @use './auth.scss';

  .reset-card {
    width: min(520px, 100%);
  }

  .reset-steps {
    margin-top: 18px;
  }

  .reset-alert {
    margin-top: 16px;
  }

  .channel-list {
    width: 100%;
  }

  .channel-hint {
    margin: 2px 0 14px;
    color: var(--art-gray-500);
    font-size: 13px;
  }

  .code-row {
    display: flex;
    width: 100%;
    gap: 10px;

    .el-button {
      flex-shrink: 0;
    }
  }

  .secondary-button {
    width: 100%;
    margin-top: 10px;
    margin-left: 0;
  }
</style>
