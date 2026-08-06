<template>
  <div class="auth-page art-full-height">
    <LoginLeftView />

    <main class="auth-main">
      <AuthTopBar />

      <div class="auth-right-wrap register-wrap">
        <div class="auth-form">
          <h1 class="auth-title">创建账号</h1>
          <p class="auth-subtitle">欢迎加入我们，请填写以下信息完成注册</p>

          <ElAlert
            v-if="!settings.register_enabled"
            title="当前已关闭注册"
            type="warning"
            :closable="false"
            show-icon
            class="register-alert"
          />

          <ElForm ref="formRef" :model="form" :rules="rules" label-position="top">
            <ElSegmented
              v-if="showChannelTabs"
              v-model="activeRegisterTab"
              :options="channelOptions"
              class="register-tabs"
            />

            <ElFormItem label="用户名" prop="username">
              <ElInput
                v-model="form.username"
                placeholder="请输入用户名"
                size="large"
                :maxlength="INPUT_LIMITS.USERNAME"
                clearable
              >
                <template #prefix><ArtSvgIcon icon="ri:user-3-line" /></template>
              </ElInput>
            </ElFormItem>

            <ElFormItem v-if="showEmailField" label="邮箱" prop="email">
              <ElInput
                v-model="form.email"
                type="email"
                placeholder="请输入邮箱地址"
                size="large"
                :maxlength="INPUT_LIMITS.EMAIL"
                clearable
              >
                <template #prefix><ArtSvgIcon icon="ri:mail-line" /></template>
              </ElInput>
            </ElFormItem>

            <ElFormItem v-if="showField('qq')" label="QQ" prop="qq">
              <ElInput
                v-model="form.qq"
                placeholder="请输入QQ号"
                size="large"
                :maxlength="INPUT_LIMITS.QQ"
                clearable
              >
                <template #prefix><ArtSvgIcon icon="ri:qq-line" /></template>
              </ElInput>
            </ElFormItem>

            <ElFormItem v-if="showPhoneField" label="手机号" prop="phone">
              <ElInput
                v-model="form.phone"
                placeholder="请输入手机号"
                size="large"
                :maxlength="INPUT_LIMITS.PHONE"
                clearable
              >
                <template #prefix><ArtSvgIcon icon="ri:smartphone-line" /></template>
              </ElInput>
            </ElFormItem>

            <ElFormItem label="密码" prop="password">
              <ElInput
                v-model="form.password"
                type="password"
                placeholder="请设置登录密码"
                size="large"
                :maxlength="INPUT_LIMITS.PASSWORD"
                autocomplete="new-password"
                show-password
              >
                <template #prefix><ArtSvgIcon icon="ri:lock-password-line" /></template>
              </ElInput>
            </ElFormItem>

            <ElFormItem
              v-if="settings.register_captcha_enabled"
              :label="settings.captcha_provider === 'geetest' ? '行为验证码' : '图形验证码'"
              prop="captcha_code"
            >
              <div v-if="settings.captcha_provider !== 'geetest'" class="captcha-row">
                <ElInput v-model="form.captcha_code" placeholder="请输入验证码" size="large" />
                <button class="captcha-image" type="button" @click="refreshCaptcha">
                  <img v-if="captchaImage" :src="captchaImage" alt="captcha" />
                  <span v-else>加载中</span>
                </button>
              </div>
              <div v-else class="geetest-row">
                <ElButton
                  class="geetest-button"
                  :disabled="!geetest.ready"
                  :loading="geetest.loading"
                  @click="verifyGeeTest"
                >
                  {{ geetest.passed ? '已通过验证，点击重试' : '点击完成极验验证' }}
                </ElButton>
                <ElTag :type="geetest.passed ? 'success' : 'info'">
                  {{ geetest.passed ? '验证通过' : '未验证' }}
                </ElTag>
              </div>
            </ElFormItem>

            <ElFormItem
              v-if="verifyChannels.length > 0"
              :label="verifyChannel === 'email' ? '邮箱验证码' : '短信验证码'"
              prop="verify_code"
            >
              <div class="verify-code-row">
                <ElInput
                  v-model="form.verify_code"
                  placeholder="请输入验证码"
                  size="large"
                  :maxlength="12"
                />
                <ElButton
                  size="large"
                  :disabled="sendCooling || !canSendCode"
                  :loading="sendCooling && sendCount === 60"
                  @click="sendCode"
                >
                  {{ sendCooling ? `${sendCount}s` : '获取验证码' }}
                </ElButton>
              </div>
            </ElFormItem>

            <ElButton
              class="submit-button"
              type="primary"
              size="large"
              :loading="loading"
              @click="handleSubmit"
              v-ripple
            >
              立即注册
            </ElButton>
          </ElForm>

          <div class="auth-footer">
            <span>已有账号？</span>
            <RouterLink class="text-theme" to="/login">立即登录</RouterLink>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { getAuthSettings, getCaptcha, requestRegisterCode, userRegister } from '@/services/user'
  import { INPUT_LIMITS } from '@/constants/inputLimits'

  defineOptions({ name: 'Register' })

  type VerifyChannel = 'email' | 'sms'

  interface GeeTestValidation {
    lot_number?: string
    captcha_output?: string
    pass_token?: string
    gen_time?: string
  }

  interface GeeTestWidget {
    showCaptcha: () => void
    getValidate?: () => GeeTestValidation | null
    onSuccess: (callback: () => void) => void
    onError: (callback: () => void) => void
  }

  type InitGeeTest = (
    options: { captchaId: string; product: string; language: string },
    callback: (widget: GeeTestWidget) => void
  ) => void

  const router = useRouter()
  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const captchaId = ref('')
  const captchaImage = ref('')
  const sendCooling = ref(false)
  const sendCount = ref(60)
  const verifyChannel = ref<VerifyChannel>('email')
  const activeRegisterTab = ref<VerifyChannel>('email')
  let sendTimer: ReturnType<typeof setInterval> | undefined

  const form = reactive({
    username: '',
    email: '',
    qq: '',
    phone: '',
    password: '',
    captcha_code: '',
    verify_code: ''
  })

  const settings = reactive({
    register_enabled: true,
    register_required_fields: ['username', 'password'] as string[],
    register_email_required: true,
    register_verify_type: 'none' as 'none' | VerifyChannel,
    register_verify_channels: [] as VerifyChannel[],
    register_captcha_enabled: true,
    captcha_provider: 'image' as 'image' | 'geetest'
  })

  const geetest = reactive({
    widget: null as GeeTestWidget | null,
    ready: false,
    loading: false,
    passed: false,
    lot_number: '',
    captcha_output: '',
    pass_token: '',
    gen_time: ''
  })

  const verifyChannels = computed<VerifyChannel[]>(() => {
    const configured = Array.isArray(settings.register_verify_channels)
      ? [...settings.register_verify_channels]
      : []
    if (
      configured.length === 0 &&
      (settings.register_verify_type === 'email' || settings.register_verify_type === 'sms')
    ) {
      return [settings.register_verify_type]
    }
    return configured
  })

  const showChannelTabs = computed(
    () => verifyChannels.value.includes('email') && verifyChannels.value.includes('sms')
  )
  const channelOptions = computed(() =>
    verifyChannels.value.map((channel) => ({
      label: channel === 'email' ? '邮箱注册' : '手机号注册',
      value: channel
    }))
  )
  const requiredSet = computed(
    () =>
      new Set((settings.register_required_fields || []).map((value) => String(value).toLowerCase()))
  )
  const isRequired = (field: string) => requiredSet.value.has(field.toLowerCase())
  const showField = (field: string) => isRequired(field) || field === 'qq'
  const showEmailField = computed(() => verifyChannel.value === 'email')
  const showPhoneField = computed(() => verifyChannel.value === 'sms' || isRequired('phone'))
  const canSendCode = computed(() =>
    verifyChannel.value === 'email'
      ? String(form.email || '').trim().length > 0
      : String(form.phone || '').trim().length > 0
  )

  const rules = computed<FormRules>(() => ({
    username: [
      { required: isRequired('username'), message: '请输入用户名', trigger: 'blur' },
      {
        min: 1,
        max: INPUT_LIMITS.USERNAME,
        message: `用户名长度不能超过 ${INPUT_LIMITS.USERNAME} 个字符`,
        trigger: 'blur'
      }
    ],
    email: [
      {
        required:
          verifyChannel.value === 'email' &&
          (settings.register_email_required || isRequired('email')),
        message: '请输入邮箱',
        trigger: 'blur'
      }
    ],
    qq: [{ required: isRequired('qq'), message: '请输入QQ', trigger: 'blur' }],
    phone: [
      {
        required: isRequired('phone') || verifyChannel.value === 'sms',
        message: '请输入手机号',
        trigger: 'blur'
      }
    ],
    password: [
      { required: isRequired('password'), message: '请输入密码', trigger: 'blur' },
      {
        min: 1,
        max: INPUT_LIMITS.PASSWORD,
        message: `密码长度不能超过 ${INPUT_LIMITS.PASSWORD} 个字符`,
        trigger: 'blur'
      }
    ],
    captcha_code:
      settings.register_captcha_enabled && settings.captcha_provider !== 'geetest'
        ? [{ required: true, message: '请输入验证码', trigger: 'blur' }]
        : [],
    verify_code:
      verifyChannels.value.length > 0
        ? [{ required: true, message: '请输入验证码', trigger: 'blur' }]
        : []
  }))

  const resetGeeTestResult = () => {
    geetest.passed = false
    geetest.lot_number = ''
    geetest.captcha_output = ''
    geetest.pass_token = ''
    geetest.gen_time = ''
  }

  const getInitGeeTest = () => (window as Window & { initGeetest4?: InitGeeTest }).initGeetest4

  const ensureGeeTestScript = async () => {
    if (getInitGeeTest()) return
    await new Promise<void>((resolve, reject) => {
      const existed = document.querySelector<HTMLScriptElement>("script[data-geetest='gt4']")
      if (existed) {
        existed.addEventListener('load', () => resolve(), { once: true })
        existed.addEventListener('error', reject, { once: true })
        return
      }
      const script = document.createElement('script')
      script.src = 'https://static.geetest.com/v4/gt4.js'
      script.async = true
      script.defer = true
      script.dataset.geetest = 'gt4'
      script.onload = () => resolve()
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  const initGeeTest = async (captchaID: string) => {
    resetGeeTestResult()
    geetest.ready = false
    geetest.widget = null
    if (!captchaID) return
    try {
      await ensureGeeTestScript()
      await new Promise<void>((resolve, reject) => {
        const init = getInitGeeTest()
        if (!init) {
          reject(new Error('GeeTest is unavailable'))
          return
        }
        init({ captchaId: captchaID, product: 'bind', language: 'zho' }, (widget) => {
          geetest.widget = widget
          geetest.ready = true
          widget.onSuccess(() => {
            const result = widget.getValidate?.()
            geetest.lot_number = String(result?.lot_number || '')
            geetest.captcha_output = String(result?.captcha_output || '')
            geetest.pass_token = String(result?.pass_token || '')
            geetest.gen_time = String(result?.gen_time || '')
            geetest.passed = Boolean(
              geetest.lot_number && geetest.captcha_output && geetest.pass_token && geetest.gen_time
            )
          })
          widget.onError(() => {
            resetGeeTestResult()
            ElMessage.error('极验初始化失败')
          })
          resolve()
        })
      })
    } catch {
      ElMessage.error('极验脚本加载失败')
    }
  }

  const verifyGeeTest = () => {
    if (!geetest.widget || !geetest.ready) {
      ElMessage.warning('极验尚未就绪，请稍后')
      return
    }
    geetest.loading = true
    try {
      resetGeeTestResult()
      geetest.widget.showCaptcha()
    } finally {
      geetest.loading = false
    }
  }

  const refreshCaptcha = async () => {
    if (!settings.register_captcha_enabled) return
    try {
      const response = await getCaptcha()
      const provider = String(
        response.data?.captcha_provider || settings.captcha_provider || 'image'
      ).toLowerCase()
      settings.captcha_provider = provider === 'geetest' ? 'geetest' : 'image'
      captchaId.value = String(response.data?.captcha_id || '')
      form.captcha_code = ''
      if (settings.captcha_provider === 'geetest') {
        captchaImage.value = ''
        await initGeeTest(captchaId.value)
        return
      }
      const base64 = String(response.data?.image_base64 || '')
      captchaImage.value = base64 ? `data:image/png;base64,${base64}` : ''
      resetGeeTestResult()
    } catch (error) {
      console.error('Failed to refresh captcha:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await getAuthSettings()
      Object.assign(settings, response.data || {})
      if (verifyChannels.value.length && !verifyChannels.value.includes(verifyChannel.value)) {
        verifyChannel.value = verifyChannels.value[0]
      }
      activeRegisterTab.value = verifyChannel.value
    } catch (error) {
      console.error('Failed to fetch auth settings:', error)
    } finally {
      await refreshCaptcha()
    }
  }

  watch(activeRegisterTab, (value) => {
    if (value === 'email' || value === 'sms') {
      verifyChannel.value = value
      form.verify_code = ''
    }
  })

  watch(verifyChannel, (value) => {
    if (showChannelTabs.value && activeRegisterTab.value !== value) activeRegisterTab.value = value
  })

  const sendCode = async () => {
    if (!canSendCode.value || sendCooling.value) return
    if (
      settings.register_captcha_enabled &&
      settings.captcha_provider === 'geetest' &&
      !geetest.passed
    ) {
      ElMessage.warning('请先完成极验验证')
      return
    }
    sendCooling.value = true
    sendCount.value = 60
    try {
      await requestRegisterCode({
        channel: verifyChannel.value,
        email: verifyChannel.value === 'email' ? form.email : '',
        phone: verifyChannel.value === 'sms' ? form.phone : '',
        captcha_id: captchaId.value,
        captcha_code: form.captcha_code,
        lot_number: geetest.lot_number,
        captcha_output: geetest.captcha_output,
        pass_token: geetest.pass_token,
        gen_time: geetest.gen_time
      })
      ElMessage.success('验证码已发送')
      await refreshCaptcha()
      sendTimer = setInterval(() => {
        sendCount.value -= 1
        if (sendCount.value <= 0) {
          if (sendTimer) clearInterval(sendTimer)
          sendTimer = undefined
          sendCooling.value = false
        }
      }, 1000)
    } catch {
      ElMessage.error('发送失败，请稍后重试')
      sendCooling.value = false
      await refreshCaptcha()
    }
  }

  const handleSubmit = async () => {
    if (!settings.register_enabled) {
      ElMessage.warning('当前已关闭注册')
      return
    }
    if (!formRef.value) return
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return
    if (
      settings.register_captcha_enabled &&
      settings.captcha_provider === 'geetest' &&
      !geetest.passed
    ) {
      ElMessage.warning('请先完成极验验证')
      return
    }
    loading.value = true
    try {
      await userRegister({
        username: form.username,
        email: verifyChannel.value === 'email' ? form.email : '',
        qq: form.qq,
        phone: verifyChannel.value === 'sms' ? form.phone : '',
        password: form.password,
        verify_channel: verifyChannel.value,
        captcha_id: captchaId.value,
        captcha_code: form.captcha_code,
        lot_number: geetest.lot_number,
        captcha_output: geetest.captcha_output,
        pass_token: geetest.pass_token,
        gen_time: geetest.gen_time,
        verify_code: form.verify_code
      })
      ElMessage.success('注册成功，请登录')
      await router.replace('/login')
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || '注册失败')
    } finally {
      loading.value = false
    }
  }

  onMounted(loadSettings)
  onBeforeUnmount(() => {
    if (sendTimer) clearInterval(sendTimer)
  })
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
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    width: min(560px, 100%);
    min-height: 100vh;
    padding: 84px 28px 40px;
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
    margin: 10px 0 22px;
    font-size: 14px;
    color: var(--art-gray-600);
  }

  .register-alert {
    margin-bottom: 16px;
  }

  .register-tabs {
    width: 100%;
    margin-bottom: 18px;
  }

  .captcha-row,
  .geetest-row,
  .verify-code-row {
    display: flex;
    gap: 10px;
    align-items: center;
    width: 100%;
  }

  .captcha-image {
    display: flex;
    flex: 0 0 120px;
    align-items: center;
    justify-content: center;
    height: 40px;
    padding: 0;
    overflow: hidden;
    color: var(--art-gray-600);
    cursor: pointer;
    background: var(--default-bg-color);
    border: 1px dashed var(--default-border-dashed);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .captcha-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .verify-code-row .el-button {
    flex: 0 0 auto;
  }

  .text-theme {
    color: var(--theme-color);
  }

  .submit-button {
    width: 100%;
    height: 40px;
  }

  .auth-footer {
    margin-top: 20px;
    font-size: 14px;
    color: var(--art-gray-600);
    text-align: center;
  }

  .auth-footer a {
    margin-left: 4px;
  }

  @media (width <= 640px) {
    .auth-right-wrap {
      padding-inline: 24px;
    }

    .auth-title {
      font-size: 30px;
    }
  }
</style>
