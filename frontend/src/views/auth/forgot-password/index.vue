<template>
  <div class="auth-page art-full-height">
    <LoginLeftView />

    <main class="auth-main">
      <AuthTopBar />

      <div class="auth-right-wrap">
        <div class="auth-form">
          <h1 class="auth-title">找回密码</h1>
          <p class="auth-subtitle">完成身份验证后设置新密码</p>

          <ElSteps :active="step - 1" finish-status="success" align-center class="reset-steps">
            <ElStep title="账号" />
            <ElStep title="验证" />
            <ElStep title="新密码" />
          </ElSteps>

          <ElForm
            v-if="step === 1"
            ref="step1Ref"
            :model="step1Form"
            :rules="step1Rules"
            label-position="top"
          >
            <ElFormItem label="账户名/邮箱/手机号" prop="account">
              <ElInput
                v-model="step1Form.account"
                size="large"
                :maxlength="INPUT_LIMITS.EMAIL"
                clearable
              />
            </ElFormItem>
            <ElButton
              class="submit-button"
              type="primary"
              size="large"
              :loading="loading"
              @click="loadOptions"
            >
              下一步
            </ElButton>
          </ElForm>

          <ElForm
            v-else-if="step === 2"
            ref="step2Ref"
            :model="step2Form"
            :rules="step2Rules"
            label-position="top"
          >
            <ElFormItem label="重置方式">
              <ElRadioGroup v-model="step2Form.channel">
                <ElRadioButton v-for="item in channels" :key="item" :value="item">
                  {{ item === 'email' ? '邮箱' : '手机号' }}
                </ElRadioButton>
              </ElRadioGroup>
            </ElFormItem>

            <ElAlert
              v-if="step2Form.channel === 'sms' && smsRequiresPhoneFull"
              type="info"
              :closable="false"
              show-icon
              :title="`您的手机号是${maskedPhone || '已绑定号码'}，请补全后发送验证码`"
              class="phone-alert"
            />

            <ElFormItem
              v-if="step2Form.channel === 'sms' && smsRequiresPhoneFull"
              label="完整手机号（用于校验）"
              prop="phone_full"
            >
              <ElInput
                v-model="step2Form.phone_full"
                placeholder="请输入完整手机号"
                size="large"
                :maxlength="INPUT_LIMITS.PHONE"
                clearable
              />
            </ElFormItem>

            <ElFormItem label="验证码" prop="code">
              <ElInput v-model="step2Form.code" size="large" :maxlength="12" clearable />
            </ElFormItem>

            <div class="verify-actions">
              <ElButton size="large" :loading="sending" @click="sendCode">{{ sendText }}</ElButton>
              <ElButton type="primary" size="large" :loading="loading" @click="verifyCode">
                验证并继续
              </ElButton>
            </div>
          </ElForm>

          <ElForm v-else ref="step3Ref" :model="step3Form" :rules="step3Rules" label-position="top">
            <ElFormItem label="新密码" prop="new_password">
              <ElInput
                v-model="step3Form.new_password"
                type="password"
                size="large"
                :maxlength="INPUT_LIMITS.PASSWORD"
                autocomplete="new-password"
                show-password
              />
            </ElFormItem>
            <ElFormItem label="确认密码" prop="confirm_password">
              <ElInput
                v-model="step3Form.confirm_password"
                type="password"
                size="large"
                :maxlength="INPUT_LIMITS.PASSWORD"
                autocomplete="new-password"
                show-password
              />
            </ElFormItem>
            <ElButton
              class="submit-button"
              type="primary"
              size="large"
              :loading="loading"
              @click="submitReset"
            >
              重置密码
            </ElButton>
          </ElForm>

          <div class="auth-footer">
            <RouterLink class="text-theme" to="/login">返回登录</RouterLink>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import {
    confirmPasswordReset,
    getPasswordResetOptions,
    sendPasswordResetCode,
    verifyPasswordResetCode
  } from '@/services/user'
  import { INPUT_LIMITS } from '@/constants/inputLimits'

  defineOptions({ name: 'ForgotPassword' })

  type ResetChannel = 'email' | 'sms'

  const router = useRouter()
  const step = ref(1)
  const loading = ref(false)
  const sending = ref(false)
  const step1Ref = ref<FormInstance>()
  const step2Ref = ref<FormInstance>()
  const step3Ref = ref<FormInstance>()
  const channels = ref<ResetChannel[]>([])
  const maskedPhone = ref('')
  const smsRequiresPhoneFull = ref(false)
  const resetTicket = ref('')

  const step1Form = reactive({ account: '' })
  const step2Form = reactive({
    channel: 'email' as ResetChannel,
    code: '',
    phone_full: ''
  })
  const step3Form = reactive({
    new_password: '',
    confirm_password: ''
  })

  const sendText = computed(() =>
    step2Form.channel === 'email' ? '发送邮箱验证码' : '发送短信验证码'
  )

  const step1Rules: FormRules = {
    account: [
      {
        validator: () => {
          const value = String(step1Form.account || '').trim()
          if (!value) return Promise.reject('请输入账户名/邮箱/手机号')
          if (value.length > INPUT_LIMITS.EMAIL) {
            return Promise.reject(`输入长度不能超过 ${INPUT_LIMITS.EMAIL} 个字符`)
          }
          return Promise.resolve()
        },
        trigger: 'blur'
      }
    ]
  }

  const step2Rules: FormRules = {
    phone_full: [
      {
        validator: () => {
          if (step2Form.channel !== 'sms' || !smsRequiresPhoneFull.value) return Promise.resolve()
          const value = String(step2Form.phone_full || '').trim()
          if (!value) return Promise.reject('请输入完整手机号')
          if (!/^[0-9+\-\s]{6,20}$/.test(value)) return Promise.reject('请输入有效手机号')
          return Promise.resolve()
        },
        trigger: 'blur'
      }
    ],
    code: [
      { required: true, message: '请输入验证码', trigger: 'blur' },
      { min: 4, max: 12, message: '验证码长度应为 4-12 位', trigger: 'blur' }
    ]
  }

  const step3Rules: FormRules = {
    new_password: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      {
        min: 6,
        max: INPUT_LIMITS.PASSWORD,
        message: `密码长度应为 6-${INPUT_LIMITS.PASSWORD} 位`,
        trigger: 'blur'
      }
    ],
    confirm_password: [
      { required: true, message: '请再次输入密码', trigger: 'blur' },
      {
        validator: () =>
          step3Form.confirm_password === step3Form.new_password
            ? Promise.resolve()
            : Promise.reject('两次输入密码不一致'),
        trigger: 'blur'
      }
    ]
  }

  const loadOptions = async () => {
    const valid = await step1Ref.value?.validate().catch(() => false)
    if (!valid) return
    loading.value = true
    try {
      const response = await getPasswordResetOptions(step1Form.account.trim())
      const availableChannels = (response.data?.channels || []) as ResetChannel[]
      if (!availableChannels.length) {
        ElMessage.error('当前账号未绑定可用的找回方式')
        return
      }
      channels.value = availableChannels
      step2Form.channel = availableChannels[0]
      step2Form.code = ''
      step2Form.phone_full = ''
      maskedPhone.value = String(response.data?.masked_phone || '')
      smsRequiresPhoneFull.value = Boolean(response.data?.sms_requires_phone_full)
      step.value = 2
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || '账号不存在或不可重置')
    } finally {
      loading.value = false
    }
  }

  const sendCode = async () => {
    if (step2Form.channel === 'sms' && smsRequiresPhoneFull.value) {
      const valid = await step2Ref.value?.validateField('phone_full').catch(() => false)
      if (valid === false) return
    }
    sending.value = true
    try {
      await sendPasswordResetCode({
        account: step1Form.account.trim(),
        channel: step2Form.channel,
        phone_full: step2Form.phone_full.trim() || undefined
      })
      ElMessage.success('验证码已发送')
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || '发送失败')
    } finally {
      sending.value = false
    }
  }

  const verifyCode = async () => {
    const valid = await step2Ref.value?.validate().catch(() => false)
    if (!valid) return
    loading.value = true
    try {
      const response = await verifyPasswordResetCode({
        account: step1Form.account.trim(),
        channel: step2Form.channel,
        code: step2Form.code.trim()
      })
      resetTicket.value = String(response.data?.reset_ticket || '')
      if (!resetTicket.value) {
        ElMessage.error('获取重置票据失败')
        return
      }
      step.value = 3
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || '验证码错误')
    } finally {
      loading.value = false
    }
  }

  const submitReset = async () => {
    const valid = await step3Ref.value?.validate().catch(() => false)
    if (!valid) return
    loading.value = true
    try {
      await confirmPasswordReset({
        reset_ticket: resetTicket.value,
        new_password: step3Form.new_password
      })
      ElMessage.success('密码重置成功，请登录')
      await router.replace('/login')
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || '重置失败')
    } finally {
      loading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .auth-page {
    display: flex;
    width: 100%;
    min-height: 100vh;
    background: var(--default-box-color);
  }

  .auth-main {
    position: relative;
    flex: 1;
    min-width: 0;
  }

  .auth-right-wrap {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: min(520px, 100%);
    min-height: 650px;
    padding: 76px 28px 32px;
    margin: auto;
  }

  .auth-form {
    width: 100%;
  }

  .auth-title {
    margin: 0;
    font-size: 36px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .auth-subtitle {
    margin: 10px 0 24px;
    font-size: 14px;
    color: var(--art-gray-600);
  }

  .reset-steps {
    margin-bottom: 28px;
  }

  .phone-alert {
    margin-bottom: 18px;
  }

  .verify-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .submit-button {
    width: 100%;
  }

  .auth-footer {
    margin-top: 22px;
    font-size: 14px;
    text-align: center;
  }

  .text-theme {
    color: var(--theme-color);
  }

  @media (width <= 640px) {
    .auth-right-wrap {
      position: relative;
      min-height: 100vh;
      padding-inline: 24px;
    }

    .auth-title {
      font-size: 30px;
    }

    .verify-actions {
      display: grid;
      grid-template-columns: 1fr;
    }
  }
</style>
