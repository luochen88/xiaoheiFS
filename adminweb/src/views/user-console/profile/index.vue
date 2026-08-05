<template>
  <div>
    <ConsolePageHeader title="个人资料" description="维护个人信息、登录密码和账号安全。">
      <template #actions>
        <ElButton
          :icon="Refresh"
          :loading="user.loading || securityLoading.contacts"
          @click="refreshAll"
        >
          刷新
        </ElButton>
      </template>
    </ConsolePageHeader>

    <ElRow :gutter="16">
      <ElCol :xs="24" :lg="10">
        <div class="console-card profile-card">
          <ElAvatar :size="72" :src="user.avatarUrl">{{ user.displayName.slice(0, 1) }}</ElAvatar>
          <div class="profile-name">{{ user.displayName }}</div>
          <div class="muted">
            {{
              user.profile?.email_masked || user.profile?.email || user.profile?.phone_masked || '-'
            }}
          </div>
          <ElDescriptions :column="1" border class="profile-desc">
            <ElDescriptionsItem label="用户 ID">{{ user.profile?.id || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="状态">{{ user.profile?.status || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="邮箱">
              <ElTag :type="securityContacts.email_bound ? 'success' : 'info'">
                {{
                  securityContacts.email_bound
                    ? securityContacts.email_masked || '已绑定'
                    : '未绑定'
                }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="手机">
              <ElTag :type="securityContacts.phone_bound ? 'success' : 'info'">
                {{
                  securityContacts.phone_bound
                    ? securityContacts.phone_masked || '已绑定'
                    : '未绑定'
                }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="2FA">
              <ElTag :type="twoFAEnabled ? 'success' : 'warning'">
                {{ twoFAEnabled ? '已启用' : '未启用' }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="注册时间">
              {{ formatDateTime(user.profile?.created_at) }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </div>
      </ElCol>

      <ElCol :xs="24" :lg="14">
        <div class="console-card form-card">
          <ElTabs v-model="activeTab">
            <ElTabPane label="基础资料" name="profile">
              <ElForm label-position="top">
                <ElRow :gutter="14">
                  <ElCol :xs="24" :sm="12">
                    <ElFormItem label="用户名">
                      <ElInput
                        v-model.trim="profileForm.username"
                        :maxlength="INPUT_LIMITS.USERNAME"
                      />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :xs="24" :sm="12">
                    <ElFormItem label="QQ">
                      <ElInput v-model.trim="profileForm.qq" :maxlength="INPUT_LIMITS.QQ" />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :xs="24">
                    <ElFormItem label="头像 URL">
                      <ElInput
                        v-model.trim="profileForm.avatar_url"
                        :maxlength="INPUT_LIMITS.URL"
                      />
                    </ElFormItem>
                  </ElCol>
                  <ElCol v-if="twoFAEnabled && usernameChanged" :xs="24">
                    <ElFormItem label="两步验证码">
                      <ElInput
                        v-model.trim="profileForm.totp_code"
                        maxlength="6"
                        placeholder="修改用户名需要输入 6 位 2FA 验证码"
                      />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :xs="24">
                    <ElFormItem label="个人简介">
                      <ElInput
                        v-model="profileForm.bio"
                        type="textarea"
                        :rows="4"
                        :maxlength="INPUT_LIMITS.BIO"
                        show-word-limit
                      />
                    </ElFormItem>
                  </ElCol>
                </ElRow>
                <ElButton type="primary" :loading="savingProfile" @click="saveProfile">
                  保存资料
                </ElButton>
              </ElForm>
            </ElTabPane>

            <ElTabPane label="修改密码" name="password">
              <ElForm label-position="top">
                <ElFormItem label="当前密码">
                  <ElInput v-model="passwordForm.current_password" type="password" show-password />
                </ElFormItem>
                <ElFormItem label="新密码">
                  <ElInput v-model="passwordForm.new_password" type="password" show-password />
                </ElFormItem>
                <ElFormItem v-if="twoFAEnabled" label="两步验证码">
                  <ElInput
                    v-model.trim="passwordForm.totp_code"
                    maxlength="6"
                    placeholder="请输入 6 位 2FA 验证码"
                  />
                </ElFormItem>
                <ElButton type="primary" :loading="savingPassword" @click="savePassword">
                  修改密码
                </ElButton>
              </ElForm>
            </ElTabPane>

            <ElTabPane label="安全设置" name="security">
              <div class="security-section">
                <div class="section-head">
                  <div>
                    <div class="section-title">两步验证</div>
                    <div class="muted">
                      {{
                        twoFAEnabled
                          ? '当前已启用 2FA，可重新绑定验证器。'
                          : '绑定验证器后，敏感操作需要验证码。'
                      }}
                    </div>
                  </div>
                  <ElTag :type="twoFAEnabled ? 'success' : 'warning'">
                    {{ twoFAEnabled ? '已启用' : '未启用' }}
                  </ElTag>
                </div>
                <ElRow :gutter="12">
                  <ElCol :xs="24" :sm="16">
                    <ElInput
                      v-if="!twoFAEnabled"
                      v-model="twoFAForm.password"
                      type="password"
                      show-password
                      placeholder="当前登录密码"
                    />
                    <ElInput
                      v-else
                      v-model.trim="twoFAForm.current_code"
                      maxlength="6"
                      placeholder="当前 2FA 验证码"
                    />
                  </ElCol>
                  <ElCol :xs="24" :sm="8">
                    <ElButton
                      class="full-width"
                      type="primary"
                      :loading="securityLoading.twofaSetup"
                      @click="submitTwoFASetup"
                    >
                      生成绑定信息
                    </ElButton>
                  </ElCol>
                </ElRow>
                <div v-if="twoFASetup.otpauth_url" class="twofa-bind">
                  <QrcodeVue :value="twoFASetup.otpauth_url" :size="180" level="M" />
                  <div class="twofa-confirm">
                    <div class="muted">使用验证器扫码后输入 6 位验证码完成绑定。</div>
                    <ElInput v-model.trim="twoFAForm.code" maxlength="6" placeholder="6 位验证码" />
                    <ElButton
                      type="primary"
                      :loading="securityLoading.twofaConfirm"
                      @click="submitTwoFAConfirm"
                    >
                      完成绑定
                    </ElButton>
                  </div>
                </div>
              </div>

              <div class="security-section">
                <div class="section-head">
                  <div>
                    <div class="section-title">邮箱绑定</div>
                    <div class="muted">
                      当前：{{
                        securityContacts.email_masked ||
                        (securityContacts.email_bound ? '已绑定' : '未绑定')
                      }}
                    </div>
                  </div>
                  <ElTag :type="securityContacts.email_bound ? 'success' : 'info'">
                    {{ securityContacts.email_bound ? '已绑定' : '未绑定' }}
                  </ElTag>
                </div>
                <ContactBindForm
                  v-model:value="emailForm.value"
                  v-model:password="emailForm.password"
                  v-model:totp="emailForm.totp"
                  v-model:code="emailForm.code"
                  kind="email"
                  :twofa-enabled="twoFAEnabled"
                  :ticket-ready="Boolean(emailForm.ticket)"
                  :cooldown="emailCooldown"
                  :verify-loading="securityLoading.emailVerify"
                  :send-loading="securityLoading.emailSend"
                  :confirm-loading="securityLoading.emailConfirm"
                  @verify="verifyEmail2FA"
                  @send="sendEmailCode"
                  @confirm="confirmEmail"
                />
              </div>

              <div class="security-section">
                <div class="section-head">
                  <div>
                    <div class="section-title">手机绑定</div>
                    <div class="muted">
                      当前：{{
                        securityContacts.phone_masked ||
                        (securityContacts.phone_bound ? '已绑定' : '未绑定')
                      }}
                    </div>
                  </div>
                  <ElTag :type="securityContacts.phone_bound ? 'success' : 'info'">
                    {{ securityContacts.phone_bound ? '已绑定' : '未绑定' }}
                  </ElTag>
                </div>
                <ContactBindForm
                  v-model:value="phoneForm.value"
                  v-model:password="phoneForm.password"
                  v-model:totp="phoneForm.totp"
                  v-model:code="phoneForm.code"
                  kind="phone"
                  :twofa-enabled="twoFAEnabled"
                  :ticket-ready="Boolean(phoneForm.ticket)"
                  :cooldown="phoneCooldown"
                  :verify-loading="securityLoading.phoneVerify"
                  :send-loading="securityLoading.phoneSend"
                  :confirm-loading="securityLoading.phoneConfirm"
                  @verify="verifyPhone2FA"
                  @send="sendPhoneCode"
                  @confirm="confirmPhone"
                />
              </div>
            </ElTabPane>
          </ElTabs>
        </div>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import { Refresh } from '@element-plus/icons-vue'
  import { ElButton, ElInput, ElMessage } from 'element-plus'
  import QrcodeVue from 'qrcode.vue'
  import {
    changeMyPassword,
    confirmMyEmailBind,
    confirmMyPhoneBind,
    confirmTwoFA,
    getMySecurityContacts,
    getTwoFAStatus,
    sendMyEmailBindCode,
    sendMyPhoneBindCode,
    setupTwoFA,
    verifyMyEmailBind2FA,
    verifyMyPhoneBind2FA,
    type ConsoleSecurityContacts,
    type SecurityTicketResponse
  } from '@/api/console-user'
  import { useConsoleUserStore } from '@/store/modules/console-user'
  import { formatDateTime } from '@/utils/console-user'
  import { INPUT_LIMITS } from '@/utils/constants'
  import ConsolePageHeader from '../shared/PageHeader.vue'
  import '../shared/styles.scss'

  defineOptions({ name: 'ConsoleUserProfile' })

  const ContactBindForm = defineComponent({
    props: {
      value: { type: String, default: '' },
      password: { type: String, default: '' },
      totp: { type: String, default: '' },
      code: { type: String, default: '' },
      kind: { type: String, required: true },
      twofaEnabled: { type: Boolean, default: false },
      ticketReady: { type: Boolean, default: false },
      cooldown: { type: Number, default: 0 },
      verifyLoading: { type: Boolean, default: false },
      sendLoading: { type: Boolean, default: false },
      confirmLoading: { type: Boolean, default: false }
    },
    emits: [
      'update:value',
      'update:password',
      'update:totp',
      'update:code',
      'verify',
      'send',
      'confirm'
    ],
    setup(props, { emit }) {
      const label = computed(() => (props.kind === 'email' ? '邮箱地址' : '手机号码'))
      return () =>
        h('div', { class: 'contact-form' }, [
          h(ElInput, {
            modelValue: props.value,
            'onUpdate:modelValue': (value: string) => emit('update:value', value),
            placeholder: `请输入${label.value}`,
            maxlength: props.kind === 'email' ? 128 : 32
          }),
          props.twofaEnabled
            ? h('div', { class: 'contact-row' }, [
                h(ElInput, {
                  modelValue: props.totp,
                  'onUpdate:modelValue': (value: string) => emit('update:totp', value),
                  placeholder: props.ticketReady ? '2FA 已验证' : '请输入 6 位 2FA 验证码',
                  maxlength: 6,
                  disabled: props.ticketReady
                }),
                h(
                  ElButton,
                  {
                    loading: props.verifyLoading,
                    disabled: props.ticketReady,
                    onClick: () => emit('verify')
                  },
                  () => (props.ticketReady ? '已验证' : '验证 2FA')
                )
              ])
            : h(ElInput, {
                modelValue: props.password,
                'onUpdate:modelValue': (value: string) => emit('update:password', value),
                placeholder: '当前登录密码',
                type: 'password',
                showPassword: true
              }),
          h('div', { class: 'contact-row' }, [
            h(ElInput, {
              modelValue: props.code,
              'onUpdate:modelValue': (value: string) => emit('update:code', value),
              placeholder: '验证码',
              maxlength: 12
            }),
            h(
              ElButton,
              {
                loading: props.sendLoading,
                disabled: props.cooldown > 0,
                onClick: () => emit('send')
              },
              () => (props.cooldown > 0 ? `${props.cooldown}s` : '发送验证码')
            ),
            h(
              ElButton,
              {
                type: 'primary',
                loading: props.confirmLoading,
                onClick: () => emit('confirm')
              },
              () => '确认绑定'
            )
          ])
        ])
    }
  })

  const user = useConsoleUserStore()
  const activeTab = ref('profile')
  const savingProfile = ref(false)
  const savingPassword = ref(false)
  const securityLoading = reactive({
    contacts: false,
    twofaSetup: false,
    twofaConfirm: false,
    emailVerify: false,
    emailSend: false,
    emailConfirm: false,
    phoneVerify: false,
    phoneSend: false,
    phoneConfirm: false
  })
  const securityContacts = reactive<ConsoleSecurityContacts>({
    email_bound: false,
    phone_bound: false,
    email_masked: '',
    phone_masked: '',
    totp_enabled: false
  })
  const twoFAEnabled = ref(false)
  const profileForm = reactive({
    username: '',
    qq: '',
    avatar_url: '',
    bio: '',
    totp_code: ''
  })
  const passwordForm = reactive({
    current_password: '',
    new_password: '',
    totp_code: ''
  })
  const twoFAForm = reactive({
    password: '',
    current_code: '',
    code: ''
  })
  const twoFASetup = reactive({
    secret: '',
    otpauth_url: ''
  })
  const emailForm = reactive({ value: '', password: '', totp: '', code: '', ticket: '' })
  const phoneForm = reactive({ value: '', password: '', totp: '', code: '', ticket: '' })
  const emailCooldown = ref(0)
  const phoneCooldown = ref(0)
  let emailTimer: number | null = null
  let phoneTimer: number | null = null

  const usernameChanged = computed(() => {
    return (
      String(profileForm.username || '').trim() !== String(user.profile?.username || '').trim() &&
      String(profileForm.username || '').trim() !== ''
    )
  })

  function fillProfile() {
    const profile = user.profile || {}
    profileForm.username = profile.username || ''
    profileForm.qq = profile.qq || ''
    profileForm.avatar_url = profile.avatar_url || profile.avatar || ''
    profileForm.bio = profile.bio || profile.intro || ''
    profileForm.totp_code = ''
  }

  function applySecurityFallback() {
    const profile = user.profile || {}
    securityContacts.email_bound = Boolean(
      profile.email_bound || profile.email || profile.email_masked
    )
    securityContacts.phone_bound = Boolean(
      profile.phone_bound || profile.phone || profile.phone_masked
    )
    securityContacts.email_masked = profile.email_masked || profile.email || ''
    securityContacts.phone_masked = profile.phone_masked || profile.phone || ''
    securityContacts.totp_enabled = Boolean(profile.totp_enabled)
    twoFAEnabled.value = Boolean(profile.totp_enabled)
  }

  async function fetchSecurity() {
    securityLoading.contacts = true
    try {
      const [contacts, twoFA] = await Promise.allSettled([
        getMySecurityContacts(),
        getTwoFAStatus()
      ])
      if (contacts.status === 'fulfilled') {
        Object.assign(securityContacts, contacts.value || {})
      } else {
        applySecurityFallback()
      }
      if (twoFA.status === 'fulfilled') {
        twoFAEnabled.value = Boolean(twoFA.value?.enabled ?? twoFA.value?.totp_enabled)
      } else if (typeof securityContacts.totp_enabled !== 'undefined') {
        twoFAEnabled.value = Boolean(securityContacts.totp_enabled)
      }
    } finally {
      securityLoading.contacts = false
    }
  }

  async function refreshAll() {
    await Promise.all([user.fetchMe(), fetchSecurity()])
    fillProfile()
  }

  async function saveProfile() {
    if (twoFAEnabled.value && usernameChanged.value && !/^\d{6}$/.test(profileForm.totp_code)) {
      ElMessage.warning('修改用户名需要输入 6 位 2FA 验证码')
      return
    }
    savingProfile.value = true
    try {
      await user.updateProfile({
        username: profileForm.username,
        qq: profileForm.qq,
        avatar_url: profileForm.avatar_url,
        bio: profileForm.bio,
        totp_code: twoFAEnabled.value && usernameChanged.value ? profileForm.totp_code : undefined
      })
      ElMessage.success('资料已保存')
      fillProfile()
    } finally {
      savingProfile.value = false
    }
  }

  async function savePassword() {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      ElMessage.warning('请填写当前密码和新密码')
      return
    }
    if (twoFAEnabled.value && !/^\d{6}$/.test(passwordForm.totp_code)) {
      ElMessage.warning('请输入 6 位 2FA 验证码')
      return
    }
    savingPassword.value = true
    try {
      await changeMyPassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        totp_code: twoFAEnabled.value ? passwordForm.totp_code : undefined
      })
      ElMessage.success('密码已修改')
      passwordForm.current_password = ''
      passwordForm.new_password = ''
      passwordForm.totp_code = ''
    } finally {
      savingPassword.value = false
    }
  }

  async function submitTwoFASetup() {
    if (!twoFAEnabled.value && !twoFAForm.password) {
      ElMessage.warning('请输入当前登录密码')
      return
    }
    if (twoFAEnabled.value && !/^\d{6}$/.test(twoFAForm.current_code)) {
      ElMessage.warning('请输入当前 6 位 2FA 验证码')
      return
    }
    securityLoading.twofaSetup = true
    try {
      const response = await setupTwoFA({
        password: twoFAEnabled.value ? undefined : twoFAForm.password,
        current_code: twoFAEnabled.value ? twoFAForm.current_code : undefined
      })
      twoFASetup.secret = response.secret || ''
      twoFASetup.otpauth_url = response.otpauth_url || ''
      if (!twoFASetup.otpauth_url) {
        ElMessage.error('未获取到 2FA 绑定信息')
        return
      }
      ElMessage.success('已生成 2FA 绑定信息')
    } finally {
      securityLoading.twofaSetup = false
    }
  }

  async function submitTwoFAConfirm() {
    if (!/^\d{6}$/.test(twoFAForm.code)) {
      ElMessage.warning('请输入 6 位验证码')
      return
    }
    securityLoading.twofaConfirm = true
    try {
      await confirmTwoFA({ code: twoFAForm.code })
      ElMessage.success('2FA 已启用')
      twoFAForm.password = ''
      twoFAForm.current_code = ''
      twoFAForm.code = ''
      twoFASetup.secret = ''
      twoFASetup.otpauth_url = ''
      await refreshAll()
    } finally {
      securityLoading.twofaConfirm = false
    }
  }

  function validateContact(kind: 'email' | 'phone', value: string) {
    if (kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      ElMessage.warning('请输入有效邮箱地址')
      return false
    }
    if (kind === 'phone' && !/^[0-9+\-\s]{6,20}$/.test(value)) {
      ElMessage.warning('请输入有效手机号码')
      return false
    }
    return true
  }

  async function verifyContact2FA(kind: 'email' | 'phone') {
    const form = kind === 'email' ? emailForm : phoneForm
    if (!/^\d{6}$/.test(form.totp)) {
      ElMessage.warning('请输入 6 位 2FA 验证码')
      return
    }
    const loadingKey = kind === 'email' ? 'emailVerify' : 'phoneVerify'
    securityLoading[loadingKey] = true
    try {
      const response: SecurityTicketResponse =
        kind === 'email'
          ? await verifyMyEmailBind2FA({ totp_code: form.totp })
          : await verifyMyPhoneBind2FA({ totp_code: form.totp })
      form.ticket = response.security_ticket || ''
      if (!form.ticket) {
        ElMessage.error('2FA 校验失败')
        return
      }
      ElMessage.success('2FA 已验证')
    } finally {
      securityLoading[loadingKey] = false
    }
  }

  async function sendContactCode(kind: 'email' | 'phone') {
    const form = kind === 'email' ? emailForm : phoneForm
    const value = String(form.value || '').trim()
    if (!validateContact(kind, value)) return
    if (twoFAEnabled.value && !form.ticket) {
      ElMessage.warning('请先完成 2FA 验证')
      return
    }
    if (!twoFAEnabled.value && !form.password) {
      ElMessage.warning('请输入当前登录密码')
      return
    }
    const loadingKey = kind === 'email' ? 'emailSend' : 'phoneSend'
    securityLoading[loadingKey] = true
    try {
      const payload = {
        value,
        current_password: twoFAEnabled.value ? undefined : form.password,
        security_ticket: twoFAEnabled.value ? form.ticket : undefined
      }
      if (kind === 'email') {
        await sendMyEmailBindCode(payload)
        startCooldown(emailCooldown, 'email')
      } else {
        await sendMyPhoneBindCode(payload)
        startCooldown(phoneCooldown, 'phone')
      }
      ElMessage.success('验证码已发送')
    } finally {
      securityLoading[loadingKey] = false
    }
  }

  async function confirmContact(kind: 'email' | 'phone') {
    const form = kind === 'email' ? emailForm : phoneForm
    const value = String(form.value || '').trim()
    if (!validateContact(kind, value)) return
    if (!String(form.code || '').trim()) {
      ElMessage.warning('请输入验证码')
      return
    }
    const loadingKey = kind === 'email' ? 'emailConfirm' : 'phoneConfirm'
    securityLoading[loadingKey] = true
    try {
      const payload = {
        value,
        code: String(form.code || '').trim(),
        security_ticket: twoFAEnabled.value ? form.ticket : undefined
      }
      if (kind === 'email') {
        await confirmMyEmailBind(payload)
        resetContactForm(emailForm)
      } else {
        await confirmMyPhoneBind(payload)
        resetContactForm(phoneForm)
      }
      ElMessage.success('绑定已更新')
      await refreshAll()
    } finally {
      securityLoading[loadingKey] = false
    }
  }

  function resetContactForm(form: typeof emailForm) {
    form.value = ''
    form.password = ''
    form.totp = ''
    form.code = ''
    form.ticket = ''
  }

  function startCooldown(target: Ref<number>, kind: 'email' | 'phone') {
    target.value = 60
    const current = kind === 'email' ? emailTimer : phoneTimer
    if (current) {
      window.clearInterval(current)
    }
    const timer = window.setInterval(() => {
      target.value -= 1
      if (target.value <= 0) {
        target.value = 0
        window.clearInterval(timer)
        if (kind === 'email') emailTimer = null
        else phoneTimer = null
      }
    }, 1000)
    if (kind === 'email') emailTimer = timer
    else phoneTimer = timer
  }

  function verifyEmail2FA() {
    return verifyContact2FA('email')
  }

  function verifyPhone2FA() {
    return verifyContact2FA('phone')
  }

  function sendEmailCode() {
    return sendContactCode('email')
  }

  function sendPhoneCode() {
    return sendContactCode('phone')
  }

  function confirmEmail() {
    return confirmContact('email')
  }

  function confirmPhone() {
    return confirmContact('phone')
  }

  watch(() => user.profile, fillProfile, { immediate: true })

  onMounted(async () => {
    if (!user.profile) {
      await user.fetchMe()
    }
    fillProfile()
    await fetchSecurity()
  })

  onBeforeUnmount(() => {
    if (emailTimer) window.clearInterval(emailTimer)
    if (phoneTimer) window.clearInterval(phoneTimer)
  })
</script>

<style scoped lang="scss">
  .profile-card,
  .form-card {
    padding: 22px;
  }

  .profile-card {
    text-align: center;
  }

  .profile-name {
    margin-top: 12px;
    color: var(--art-gray-900);
    font-size: 22px;
    font-weight: 700;
  }

  .profile-desc {
    margin-top: 20px;
    text-align: left;
  }

  .security-section {
    padding: 18px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: 0;
    }
  }

  .section-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
  }

  .section-title {
    color: var(--art-gray-900);
    font-size: 16px;
    font-weight: 700;
  }

  .full-width {
    width: 100%;
  }

  .twofa-bind {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-top: 16px;
  }

  .twofa-confirm {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 10px;
  }

  :deep(.contact-form) {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  :deep(.contact-row) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 10px;
  }

  @media (max-width: 992px) {
    .form-card {
      margin-top: 16px;
    }
  }

  @media (max-width: 640px) {
    .section-head,
    .twofa-bind {
      align-items: stretch;
      flex-direction: column;
    }

    :deep(.contact-row) {
      grid-template-columns: 1fr;
    }
  }
</style>
