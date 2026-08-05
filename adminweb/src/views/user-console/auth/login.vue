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

    <ElCard class="login-card" shadow="never">
      <div class="card-title">用户登录</div>
      <div class="card-desc">登录后管理云服务器、订单、钱包和工单</div>

      <ElForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="login-form"
        @keyup.enter="handleSubmit"
      >
        <ElTabs v-model="loginMode" class="login-tabs">
          <ElTabPane label="账号登录" name="account" />
          <ElTabPane label="手机号登录" name="phone" />
        </ElTabs>

        <ElFormItem v-if="loginMode === 'account'" label="账号" prop="username">
          <ElInput
            v-model.trim="form.username"
            :maxlength="INPUT_LIMITS.EMAIL"
            placeholder="请输入用户名或邮箱"
          />
        </ElFormItem>

        <ElFormItem v-else label="手机号" prop="phone">
          <ElInput
            v-model.trim="form.phone"
            :maxlength="INPUT_LIMITS.PHONE"
            placeholder="请输入手机号"
          />
        </ElFormItem>

        <ElFormItem label="密码" prop="password">
          <ElInput
            v-model.trim="form.password"
            :maxlength="INPUT_LIMITS.PASSWORD"
            placeholder="请输入密码"
            type="password"
            show-password
          />
        </ElFormItem>

        <ElFormItem
          v-if="settings.login_captcha_enabled"
          :label="settings.captcha_provider === 'geetest' ? '行为验证码' : '图形验证码'"
          prop="captcha_code"
        >
          <div v-if="settings.captcha_provider !== 'geetest'" class="captcha-row">
            <ElInput v-model.trim="form.captcha_code" placeholder="请输入验证码" />
            <button class="captcha-image" type="button" @click="refreshCaptcha">
              <img v-if="captchaImage" :src="captchaImage" alt="验证码" />
              <span v-else>刷新</span>
            </button>
          </div>
          <div v-else class="geetest-row">
            <ElButton :loading="geetest.loading" :disabled="!geetest.ready" @click="verifyGeeTest">
              {{ geetest.passed ? '已通过验证，点击重试' : '点击完成极验验证' }}
            </ElButton>
            <ElTag :type="geetest.passed ? 'success' : 'info'">
              {{ geetest.passed ? '验证通过' : '未验证' }}
            </ElTag>
          </div>
        </ElFormItem>

        <ElButton type="primary" class="login-button" :loading="user.loading" @click="handleSubmit">
          登录
        </ElButton>
      </ElForm>

      <div class="login-footer">
        <RouterLink to="/user/forgot-password">忘记密码</RouterLink>
        <span>管理员登录请使用后台入口</span>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules } from 'element-plus'
  import { getAuthSettings, getCaptcha } from '@/api/console-user'
  import { useConsoleSiteStore } from '@/store/modules/console-site'
  import { useConsoleUserStore } from '@/store/modules/console-user'
  import { INPUT_LIMITS } from '@/utils/constants'

  defineOptions({ name: 'ConsoleUserLogin' })

  declare global {
    interface Window {
      initGeetest4?: (config: Record<string, unknown>, callback: (captchaObj: any) => void) => void
    }
  }

  const route = useRoute()
  const router = useRouter()
  const user = useConsoleUserStore()
  const site = useConsoleSiteStore()
  const formRef = ref<FormInstance>()
  const loginMode = ref('account')
  const captchaId = ref('')
  const captchaImage = ref('')

  const settings = reactive({
    login_captcha_enabled: false,
    captcha_provider: 'image' as 'image' | 'geetest'
  })

  const form = reactive({
    username: '',
    phone: '',
    password: '',
    captcha_code: ''
  })

  const geetest = reactive({
    widget: null as any,
    ready: false,
    loading: false,
    passed: false,
    lot_number: '',
    captcha_output: '',
    pass_token: '',
    gen_time: ''
  })

  const rules = computed<FormRules>(() => ({
    username:
      loginMode.value === 'account'
        ? [{ required: true, message: '请输入账号', trigger: 'blur' }]
        : [],
    phone:
      loginMode.value === 'phone'
        ? [
            { required: true, message: '请输入手机号', trigger: 'blur' },
            {
              validator: (_rule, value, callback) => {
                if (!/^[0-9+\-\s]{6,20}$/.test(String(value || ''))) {
                  callback(new Error('请输入有效手机号'))
                  return
                }
                callback()
              },
              trigger: 'blur'
            }
          ]
        : [],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
    captcha_code:
      settings.login_captcha_enabled && settings.captcha_provider !== 'geetest'
        ? [{ required: true, message: '请输入验证码', trigger: 'blur' }]
        : []
  }))

  function resetGeeTestResult() {
    geetest.passed = false
    geetest.lot_number = ''
    geetest.captcha_output = ''
    geetest.pass_token = ''
    geetest.gen_time = ''
  }

  async function ensureGeeTestScript() {
    if (window.initGeetest4) return

    await new Promise<void>((resolve, reject) => {
      const existed = document.querySelector("script[data-geetest='gt4']")
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

  async function initGeeTest(captchaID: string) {
    resetGeeTestResult()
    geetest.ready = false
    geetest.widget = null
    if (!captchaID) return

    try {
      await ensureGeeTestScript()
      await new Promise<void>((resolve) => {
        window.initGeetest4?.(
          { captchaId: captchaID, product: 'bind', language: 'zho' },
          (captchaObj) => {
            geetest.widget = captchaObj
            geetest.ready = true
            captchaObj.onSuccess(() => {
              const result = captchaObj.getValidate ? captchaObj.getValidate() : null
              geetest.lot_number = String(result?.lot_number || '')
              geetest.captcha_output = String(result?.captcha_output || '')
              geetest.pass_token = String(result?.pass_token || '')
              geetest.gen_time = String(result?.gen_time || '')
              geetest.passed = Boolean(
                geetest.lot_number &&
                  geetest.captcha_output &&
                  geetest.pass_token &&
                  geetest.gen_time
              )
            })
            resolve()
          }
        )
      })
    } catch {
      ElMessage.error('极验脚本加载失败')
    }
  }

  async function verifyGeeTest() {
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

  async function refreshCaptcha() {
    if (!settings.login_captcha_enabled) return

    const response = await getCaptcha()
    const provider = String(
      response.captcha_provider || settings.captcha_provider || 'image'
    ).toLowerCase()
    settings.captcha_provider = provider === 'geetest' ? 'geetest' : 'image'
    captchaId.value = String(response.captcha_id || '')

    if (settings.captcha_provider === 'geetest') {
      captchaImage.value = ''
      await initGeeTest(captchaId.value)
      return
    }

    const base64 = String(response.image_base64 || '')
    captchaImage.value = base64 ? `data:image/png;base64,${base64}` : ''
    resetGeeTestResult()
  }

  async function loadSettings() {
    try {
      Object.assign(settings, await getAuthSettings())
    } finally {
      await refreshCaptcha()
    }
  }

  async function handleSubmit() {
    if (!formRef.value) return

    try {
      await formRef.value.validate()

      if (
        settings.login_captcha_enabled &&
        settings.captcha_provider === 'geetest' &&
        !geetest.passed
      ) {
        ElMessage.warning('请先完成极验验证')
        return
      }

      const loginAccount =
        loginMode.value === 'phone'
          ? String(form.phone || '').trim()
          : String(form.username || '').trim()

      const token = await user.login({
        username: loginAccount,
        password: form.password,
        captcha_id: captchaId.value,
        captcha_code: form.captcha_code,
        lot_number: geetest.lot_number,
        captcha_output: geetest.captcha_output,
        pass_token: geetest.pass_token,
        gen_time: geetest.gen_time
      })

      if (!token) {
        ElMessage.error('登录失败')
        await refreshCaptcha()
        return
      }

      await user.fetchMe()
      ElMessage.success('登录成功')
      await router.replace(String(route.query.redirect || '/console'))
    } catch (error: any) {
      if (error?.message) {
        ElMessage.error(
          error.response?.data?.error || error.response?.data?.message || error.message
        )
      }
      await refreshCaptcha()
    }
  }

  onMounted(() => {
    site.fetchSettings()
    loadSettings()
  })
</script>

<style scoped lang="scss">
  @use './auth.scss';
</style>
