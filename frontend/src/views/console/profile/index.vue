<template>
  <div class="profile-page pb-5">
    <div class="page-heading">
      <div>
        <h2>个人资料</h2>
        <p>管理您的账户信息和偏好设置</p>
      </div>
      <ElSpace wrap>
        <ElButton type="primary" v-ripple @click="openProtectedFlow('edit')">
          <ArtSvgIcon icon="ri:edit-line" class="button-icon" />
          编辑资料
        </ElButton>
      </ElSpace>
    </div>

    <ElCard class="art-card-xs profile-summary">
      <div class="summary-body">
        <div class="summary-main">
          <div class="avatar-wrap">
            <ElAvatar :size="76" :src="avatarSource || undefined">
              {{ profileInitial }}
            </ElAvatar>
            <span
              class="status-dot"
              :class="{ 'status-dot-active': profileStatus === 'active' }"
            ></span>
          </div>
          <div class="summary-copy">
            <div class="summary-title-row">
              <h3>{{ profileName }}</h3>
              <ElTag type="primary" effect="plain">{{ profileRole }}</ElTag>
              <ElTag :type="realnameTag.type" effect="light">{{ realnameTag.label }}</ElTag>
            </div>
          </div>
        </div>
        <div class="summary-metrics">
          <div>
            <span>钱包余额</span>
            <strong>{{ balanceText }}</strong>
          </div>
          <div>
            <span>用户 ID</span>
            <strong>#{{ profileId }}</strong>
          </div>
          <div>
            <span>注册时间</span>
            <strong>{{ formatTime(profileCreatedAt) }}</strong>
          </div>
        </div>
      </div>
    </ElCard>

    <div class="profile-grid">
      <ElCard class="art-card-xs overview-card">
        <template #header>
          <div class="card-heading">
            <ArtSvgIcon icon="ri:user-settings-line" />
            <span>账户概览</span>
          </div>
        </template>
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="账户状态">
            <ElTag :type="profileStatus === 'active' ? 'success' : 'info'" size="small">
              {{ profileStatus === 'active' ? '正常' : profileStatus || '-' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="QQ">{{ profileQq || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="用户组">
            <ElTag
              :type="tierColor ? undefined : 'primary'"
              :color="tierColor || undefined"
              effect="plain"
              size="small"
            >
              <ArtSvgIcon v-if="tierIcon" :icon="tierIcon" class="tier-icon" />
              {{ tierName || '-' }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="用户组到期">{{ formatTime(tierExpireAt) }}</ElDescriptionsItem>
          <ElDescriptionsItem label="邮箱">
            <ElTag :type="securityContacts.email_bound ? 'success' : 'info'" size="small">
              {{
                securityContacts.email_masked ||
                (securityContacts.email_bound ? '已绑定' : '未绑定')
              }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="手机">
            <ElTag :type="securityContacts.phone_bound ? 'success' : 'info'" size="small">
              {{
                securityContacts.phone_masked ||
                (securityContacts.phone_bound ? '已绑定' : '未绑定')
              }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="两步验证">
            <ElTag :type="twoFAEnabled ? 'success' : 'warning'" size="small">
              {{ twoFAEnabled ? '已启用' : '未启用' }}
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>

      <ElCard class="art-card-xs settings-card">
        <ElTabs v-model="activeTab">
          <ElTabPane label="基本资料" name="profile">
            <div class="tab-heading">
              <div>
                <h3>基本资料</h3>
                <p>用户名变更在启用 2FA 后需要动态验证码。</p>
              </div>
            </div>
            <ElForm
              ref="profileFormRef"
              :model="profileForm"
              :rules="profileRules"
              label-position="top"
            >
              <div class="form-grid">
                <ElFormItem label="用户名" prop="username">
                  <ElInput
                    v-model.trim="profileForm.username"
                    :disabled="!profileEditing"
                    :maxlength="INPUT_LIMITS.USERNAME"
                    placeholder="请输入用户名"
                    show-word-limit
                  />
                </ElFormItem>
                <ElFormItem label="QQ号码" prop="qq">
                  <ElInput
                    v-model.trim="profileForm.qq"
                    :disabled="!profileEditing"
                    :maxlength="INPUT_LIMITS.QQ"
                    placeholder="请输入QQ号码"
                  />
                </ElFormItem>
              </div>
              <div v-if="profileEditing" class="form-actions">
                <ElButton @click="cancelProfileEdit">取消</ElButton>
                <ElButton type="primary" :loading="savingProfile" @click="saveProfile"
                  >保存资料</ElButton
                >
              </div>
            </ElForm>
          </ElTabPane>

          <ElTabPane label="修改密码" name="password">
            <div class="tab-heading">
              <div>
                <h3>修改登录密码</h3>
                <p>已启用 2FA 时，提交新密码需要动态验证码。</p>
              </div>
            </div>
            <ElAlert
              v-if="!passwordAuthorized"
              title="请先完成身份校验"
              :description="
                twoFAEnabled ? '输入当前 2FA 动态验证码后继续。' : '确认后即可填写密码表单。'
              "
              type="info"
              show-icon
              :closable="false"
              class="tab-alert"
            >
              <template #default>
                <ElButton type="primary" @click="openProtectedFlow('password')">开始修改</ElButton>
              </template>
            </ElAlert>
            <ElForm
              v-else
              ref="passwordFormRef"
              :model="passwordForm"
              :rules="passwordRules"
              label-position="top"
              class="compact-form"
            >
              <ElFormItem label="当前密码" prop="current_password">
                <ElInput
                  v-model="passwordForm.current_password"
                  type="password"
                  show-password
                  :maxlength="INPUT_LIMITS.PASSWORD"
                />
              </ElFormItem>
              <ElFormItem label="新密码" prop="new_password">
                <ElInput
                  v-model="passwordForm.new_password"
                  type="password"
                  show-password
                  :maxlength="INPUT_LIMITS.PASSWORD"
                />
              </ElFormItem>
              <ElFormItem label="确认新密码" prop="confirm_new_password">
                <ElInput
                  v-model="passwordForm.confirm_new_password"
                  type="password"
                  show-password
                  :maxlength="INPUT_LIMITS.PASSWORD"
                  @keyup.enter="savePassword"
                />
              </ElFormItem>
              <div class="password-help">
                忘记当前密码？<RouterLink to="/forgot-password">通过找回密码重置</RouterLink>
              </div>
              <div class="form-actions">
                <ElButton @click="cancelPasswordChange">取消</ElButton>
                <ElButton type="primary" :loading="savingPassword" @click="savePassword"
                  >修改密码</ElButton
                >
              </div>
            </ElForm>
          </ElTabPane>

          <ElTabPane label="安全设置" name="security">
            <div class="security-list">
              <div class="security-item">
                <div class="security-icon"><ArtSvgIcon icon="ri:shield-keyhole-line" /></div>
                <div class="security-copy">
                  <div>
                    <strong>两步验证</strong>
                    <ElTag :type="twoFAEnabled ? 'success' : 'warning'" size="small">
                      {{ twoFAEnabled ? '已启用' : '未启用' }}
                    </ElTag>
                  </div>
                  <p>{{ twoFAEnabled ? '可重新绑定新的验证器。' : '绑定验证器保护敏感操作。' }}</p>
                </div>
                <ElButton @click="openProtectedFlow('twofa')">{{
                  twoFAEnabled ? '重新绑定' : '立即绑定'
                }}</ElButton>
              </div>

              <div class="security-item">
                <div class="security-icon"><ArtSvgIcon icon="ri:mail-line" /></div>
                <div class="security-copy">
                  <div>
                    <strong>邮箱绑定</strong>
                    <ElTag :type="securityContacts.email_bound ? 'success' : 'info'" size="small">
                      {{ securityContacts.email_bound ? '已绑定' : '未绑定' }}
                    </ElTag>
                  </div>
                  <p>{{ securityContacts.email_masked || '用于安全通知和身份验证。' }}</p>
                </div>
                <ElButton @click="openProtectedFlow('email')">
                  {{ securityContacts.email_bound ? '更新' : '绑定' }}
                </ElButton>
              </div>

              <div class="security-item">
                <div class="security-icon"><ArtSvgIcon icon="ri:smartphone-line" /></div>
                <div class="security-copy">
                  <div>
                    <strong>手机绑定</strong>
                    <ElTag :type="securityContacts.phone_bound ? 'success' : 'info'" size="small">
                      {{ securityContacts.phone_bound ? '已绑定' : '未绑定' }}
                    </ElTag>
                  </div>
                  <p>{{ securityContacts.phone_masked || '用于短信验证码和安全通知。' }}</p>
                </div>
                <ElButton @click="openProtectedFlow('phone')">
                  {{ securityContacts.phone_bound ? '更新' : '绑定' }}
                </ElButton>
              </div>
            </div>
          </ElTabPane>
        </ElTabs>
      </ElCard>
    </div>

    <ElDialog
      v-model="securityDialogVisible"
      :title="securityDialogTitle"
      width="min(720px, 94vw)"
      align-center
      destroy-on-close
    >
      <template v-if="securityDialogType === 'twofa'">
        <ElAlert
          :title="twoFAEnabled ? '重新绑定验证器' : '绑定验证器'"
          :description="
            twoFAEnabled
              ? '验证当前动态码后生成新的绑定二维码。'
              : '验证当前登录密码后生成绑定二维码。'
          "
          :type="twoFAEnabled ? 'warning' : 'info'"
          show-icon
          :closable="false"
          class="dialog-alert"
        />
        <div class="twofa-flow">
          <div class="twofa-auth-row">
            <ElInput
              v-if="!twoFAEnabled"
              v-model="securityForm.twofa_password"
              type="password"
              show-password
              placeholder="当前登录密码"
              :maxlength="INPUT_LIMITS.PASSWORD"
            />
            <ElInput
              v-else
              v-model.trim="securityForm.twofa_current_code"
              placeholder="当前 2FA 验证码（6 位）"
              :maxlength="6"
            />
            <ElButton
              type="primary"
              :loading="securityLoading.setup"
              :disabled="!canSetupTwoFA"
              @click="setupTwoFactor"
            >
              生成绑定信息
            </ElButton>
          </div>
          <div v-if="twoFAUrl" class="twofa-setup">
            <div class="qr-panel">
              <QrcodeVue :value="twoFAUrl" :size="180" level="M" render-as="svg" />
            </div>
            <div class="twofa-confirm">
              <strong>使用验证器扫码</strong>
              <p>打开 Google / Microsoft Authenticator 扫描二维码，然后输入 6 位动态码。</p>
              <ElInput
                v-model.trim="securityForm.twofa_code"
                placeholder="新验证器中的 6 位验证码"
                :maxlength="6"
                @keyup.enter="confirmTwoFactor"
              />
              <ElButton
                type="primary"
                :loading="securityLoading.confirm"
                :disabled="!canConfirmTwoFA"
                @click="confirmTwoFactor"
              >
                完成绑定
              </ElButton>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <ElAlert
          :title="contactDialogAlert.title"
          description="先完成身份校验，再发送验证码并确认绑定。"
          :type="contactDialogAlert.type"
          show-icon
          :closable="false"
          class="dialog-alert"
        />
        <ElForm label-position="top" class="contact-form">
          <ElFormItem :label="securityDialogType === 'email' ? '新邮箱' : '新手机号'">
            <ElInput
              v-model.trim="activeContactForm.value"
              :placeholder="
                securityDialogType === 'email' ? '请输入要绑定的新邮箱' : '请输入要绑定的新手机号'
              "
              :maxlength="securityDialogType === 'email' ? INPUT_LIMITS.EMAIL : INPUT_LIMITS.PHONE"
            />
          </ElFormItem>
          <ElFormItem v-if="!twoFAEnabled" label="当前登录密码">
            <ElInput
              v-model="activeContactForm.password"
              type="password"
              show-password
              :maxlength="INPUT_LIMITS.PASSWORD"
            />
          </ElFormItem>
          <ElAlert v-else title="已记录 2FA 校验凭据" type="success" show-icon :closable="false" />
          <ElFormItem label="验证码" class="code-form-item">
            <div class="code-row">
              <ElInput
                v-model.trim="activeContactForm.code"
                placeholder="输入 4-8 位验证码"
                :maxlength="8"
                @keyup.enter="confirmContactBind"
              />
              <ElButton
                :loading="activeContactLoading.send"
                :disabled="!canSendContactCode"
                @click="sendContactCode"
              >
                {{ activeContactCooldown > 0 ? `${activeContactCooldown}s 后重发` : '发送验证码' }}
              </ElButton>
            </div>
          </ElFormItem>
          <div class="form-actions">
            <ElButton @click="securityDialogVisible = false">取消</ElButton>
            <ElButton
              type="primary"
              :loading="activeContactLoading.confirm"
              :disabled="!canConfirmContact"
              @click="confirmContactBind"
            >
              确认绑定
            </ElButton>
          </div>
        </ElForm>
      </template>
    </ElDialog>

    <ElDialog
      v-model="precheckVisible"
      :title="precheckTitle"
      width="min(420px, 92vw)"
      align-center
      destroy-on-close
      @closed="resetPrecheck"
    >
      <ElAlert
        title="请输入当前验证器中的 6 位动态验证码"
        type="info"
        show-icon
        :closable="false"
        class="dialog-alert"
      />
      <ElInput
        v-model.trim="precheckCode"
        placeholder="6 位 2FA 验证码"
        :maxlength="6"
        @keyup.enter="submitPrecheck"
      />
      <template #footer>
        <ElButton @click="precheckVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="precheckLoading" @click="submitPrecheck">
          验证并继续
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type { FormInstance, FormRules, TagProps } from 'element-plus'
  import QrcodeVue from 'qrcode.vue'
  import { useAuthStore } from '@/stores/auth'
  import {
    changeMyPassword,
    confirmMyEmailBind,
    confirmMyPhoneBind,
    confirmTwoFA,
    getMySecurityContacts,
    getMyUserTier,
    getRealNameStatus,
    getTwoFAStatus,
    getWallet,
    sendMyEmailBindCode,
    sendMyPhoneBindCode,
    setupTwoFA,
    verifyMyEmailBind2FA,
    verifyMyPhoneBind2FA
  } from '@/services/user'
  import { INPUT_LIMITS } from '@/constants/inputLimits'

  defineOptions({ name: 'ConsoleProfile' })

  type ProtectedTarget = 'edit' | 'password' | 'twofa' | 'email' | 'phone'
  type SecurityDialogType = 'twofa' | 'email' | 'phone'
  type TagType = TagProps['type']

  interface ContactFormState {
    value: string
    code: string
    password: string
    ticket: string
  }

  interface RequestError {
    response?: { data?: { error?: unknown } }
  }

  const auth = useAuthStore()
  const profile = computed<Record<string, unknown> | null>(() => auth.profile)
  const activeTab = ref('profile')
  const profileEditing = ref(false)
  const passwordAuthorized = ref(false)
  const savingProfile = ref(false)
  const savingPassword = ref(false)
  const profileFormRef = ref<FormInstance>()
  const passwordFormRef = ref<FormInstance>()

  const wallet = reactive({ balance: 0, currency: 'CNY' })
  const realname = ref<Record<string, unknown>>({})
  const tier = reactive({ name: '', color: '', icon: '', expireAt: '' })
  const securityContacts = reactive({
    email_bound: false,
    phone_bound: false,
    email_masked: '',
    phone_masked: ''
  })

  const profileForm = reactive({ username: '', qq: '' })
  const passwordForm = reactive({
    current_password: '',
    new_password: '',
    confirm_new_password: '',
    totp_code: ''
  })

  const securityDialogVisible = ref(false)
  const securityDialogType = ref<SecurityDialogType>('twofa')
  const twoFAEnabled = ref(false)
  const twoFAUrl = ref('')
  const twoFASecret = ref('')
  const securityForm = reactive({
    profile_totp: '',
    twofa_password: '',
    twofa_current_code: '',
    twofa_code: ''
  })
  const emailForm = reactive<ContactFormState>({ value: '', code: '', password: '', ticket: '' })
  const phoneForm = reactive<ContactFormState>({ value: '', code: '', password: '', ticket: '' })
  const securityLoading = reactive({
    setup: false,
    confirm: false,
    emailSend: false,
    emailConfirm: false,
    phoneSend: false,
    phoneConfirm: false
  })
  const emailCodeSent = ref(false)
  const phoneCodeSent = ref(false)
  const emailCooldown = ref(0)
  const phoneCooldown = ref(0)
  let emailTimer: ReturnType<typeof setInterval> | undefined
  let phoneTimer: ReturnType<typeof setInterval> | undefined

  const precheckVisible = ref(false)
  const precheckTarget = ref<ProtectedTarget>()
  const precheckCode = ref('')
  const precheckLoading = ref(false)

  const otpPattern = /^\d{6}$/
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phonePattern = /^[0-9+\-\s]{6,20}$/

  const profileRules: FormRules<typeof profileForm> = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      {
        min: 2,
        max: INPUT_LIMITS.USERNAME,
        message: `用户名长度应为 2-${INPUT_LIMITS.USERNAME} 个字符`,
        trigger: 'blur'
      }
    ]
  }

  const passwordRules: FormRules<typeof passwordForm> = {
    current_password: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
    new_password: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      {
        min: 6,
        max: INPUT_LIMITS.PASSWORD,
        message: `密码长度应为 6-${INPUT_LIMITS.PASSWORD} 位`,
        trigger: 'blur'
      }
    ],
    confirm_new_password: [
      { required: true, message: '请再次输入新密码', trigger: 'blur' },
      {
        validator: (_rule, value, callback) => {
          if (String(value ?? '') !== passwordForm.new_password) {
            callback(new Error('两次输入密码不一致'))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ]
  }

  const getProfileField = (...keys: string[]): string => {
    const record = profile.value ?? {}
    for (const key of keys) {
      const value = record[key]
      if (value != null && value !== '') return String(value)
    }
    return ''
  }

  const profileName = computed(() => getProfileField('username', 'Username') || '用户')
  const profileInitial = computed(() => profileName.value.slice(0, 1).toUpperCase())
  const profileId = computed(() => getProfileField('id', 'ID') || '-')
  const profileRole = computed(() => getProfileField('role', 'Role') || 'user')
  const profileStatus = computed(() => getProfileField('status', 'Status'))
  const profileQq = computed(() => getProfileField('qq', 'QQ'))
  const profileCreatedAt = computed(() => getProfileField('created_at', 'createdAt', 'CreatedAt'))
  const avatarSource = computed(() => {
    const explicit = getProfileField('avatar_url', 'avatar', 'AvatarURL', 'Avatar')
    if (explicit) return explicit
    return profileQq.value
      ? `https://q1.qlogo.cn/g?b=qq&nk=${encodeURIComponent(profileQq.value)}&s=100`
      : ''
  })

  const balanceText = computed(() => {
    const prefix = wallet.currency === 'CNY' ? '¥' : `${wallet.currency} `
    return `${prefix}${Number(wallet.balance || 0).toFixed(2)}`
  })
  const tierName = computed(() => tier.name)
  const tierColor = computed(() => tier.color)
  const tierExpireAt = computed(() => tier.expireAt)
  const tierIcon = computed(() => {
    const icons: Record<string, string> = {
      fire: 'ri:fire-line',
      gift: 'ri:gift-line',
      heart: 'ri:heart-line',
      star: 'ri:star-line',
      crown: 'ri:vip-crown-line',
      rocket: 'ri:rocket-line',
      thunder: 'ri:flashlight-line',
      trophy: 'ri:trophy-line',
      badge: 'ri:verified-badge-line'
    }
    return icons[tier.icon.toLocaleLowerCase()] ?? (tier.icon ? 'ri:verified-badge-line' : '')
  })

  const realnameTag = computed<{ label: string; type: TagType }>(() => {
    const verified = Boolean(realname.value.verified ?? realname.value.Verified)
    const verification = (realname.value.verification ??
      realname.value.Verification ??
      {}) as Record<string, unknown>
    const status = String(verification.status ?? verification.Status ?? '')
    if (verified) return { label: '已实名', type: 'success' }
    if (status === 'pending') return { label: '实名审核中', type: 'warning' }
    if (status === 'failed') return { label: '实名未通过', type: 'danger' }
    return { label: '未实名', type: 'info' }
  })

  const formatTime = (value: string): string => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    const pad = (part: number): string => String(part).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  const unwrapRecord = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object') return {}
    const record = value as Record<string, unknown>
    if (record.data && typeof record.data === 'object')
      return record.data as Record<string, unknown>
    return record
  }

  const getRequestErrorMessage = (error: unknown, fallback: string): string => {
    if (!error || typeof error !== 'object') return fallback
    const message = (error as RequestError).response?.data?.error
    return typeof message === 'string' && message.trim() ? message : fallback
  }

  const fillProfileForm = (): void => {
    Object.assign(profileForm, {
      username: profileName.value === '用户' ? '' : profileName.value,
      qq: profileQq.value
    })
  }

  const fetchTwoFAStatus = async (): Promise<void> => {
    try {
      const response = await getTwoFAStatus()
      const payload = unwrapRecord(response.data)
      const enabled =
        payload.enabled ?? payload.totp_enabled ?? payload.Enabled ?? payload.TOTPEnabled
      if (enabled != null) twoFAEnabled.value = Boolean(enabled)
    } catch {
      twoFAEnabled.value = Boolean(
        profile.value?.totp_enabled ?? profile.value?.totpEnabled ?? profile.value?.TOTPEnabled
      )
    }
  }

  const fetchContacts = async (): Promise<void> => {
    try {
      const response = await getMySecurityContacts()
      const payload = unwrapRecord(response.data)
      securityContacts.email_bound = Boolean(payload.email_bound ?? payload.EmailBound)
      securityContacts.phone_bound = Boolean(payload.phone_bound ?? payload.PhoneBound)
      securityContacts.email_masked = String(payload.email_masked ?? payload.EmailMasked ?? '')
      securityContacts.phone_masked = String(payload.phone_masked ?? payload.PhoneMasked ?? '')
      const enabled = payload.totp_enabled ?? payload.TOTPEnabled
      if (enabled != null) twoFAEnabled.value = Boolean(enabled)
    } catch {
      securityContacts.email_bound = Boolean(
        profile.value?.email_bound ?? profile.value?.EmailBound ?? getProfileField('email', 'Email')
      )
      securityContacts.phone_bound = Boolean(
        profile.value?.phone_bound ?? profile.value?.PhoneBound ?? getProfileField('phone', 'Phone')
      )
      securityContacts.email_masked = getProfileField(
        'email_masked',
        'email',
        'EmailMasked',
        'Email'
      )
      securityContacts.phone_masked = getProfileField(
        'phone_masked',
        'phone',
        'PhoneMasked',
        'Phone'
      )
    }
  }

  const fetchExtras = async (): Promise<void> => {
    const [walletResult, realnameResult, tierResult] = await Promise.allSettled([
      getWallet(),
      getRealNameStatus(),
      getMyUserTier()
    ])
    if (walletResult.status === 'fulfilled') {
      const payload = unwrapRecord(walletResult.value.data)
      const walletPayload = unwrapRecord(payload.wallet ?? payload.Wallet ?? payload)
      wallet.balance = Number(walletPayload.balance ?? walletPayload.Balance ?? 0)
      wallet.currency = String(walletPayload.currency ?? walletPayload.Currency ?? 'CNY')
    }
    if (realnameResult.status === 'fulfilled') {
      realname.value = unwrapRecord(realnameResult.value.data)
    }
    if (tierResult.status === 'fulfilled') {
      const payload = unwrapRecord(tierResult.value.data)
      tier.name = String(payload.group_name ?? payload.GroupName ?? '')
      tier.color = String(payload.group_color ?? payload.GroupColor ?? '')
      tier.icon = String(payload.group_icon ?? payload.GroupIcon ?? '')
      tier.expireAt = String(payload.expire_at ?? payload.ExpireAt ?? '')
    }
  }

  const initializeProfile = async (): Promise<void> => {
    await Promise.allSettled([auth.fetchMe(), fetchExtras(), fetchTwoFAStatus(), fetchContacts()])
    fillProfileForm()
  }

  const startProfileEdit = (): void => {
    fillProfileForm()
    profileEditing.value = true
    activeTab.value = 'profile'
  }

  const cancelProfileEdit = (): void => {
    profileEditing.value = false
    securityForm.profile_totp = ''
    fillProfileForm()
    profileFormRef.value?.clearValidate()
  }

  const saveProfile = async (): Promise<void> => {
    if (!profileFormRef.value) return
    const valid = await profileFormRef.value.validate().catch(() => false)
    if (!valid) return
    const usernameChanged = profileForm.username.trim() !== profileName.value
    if (twoFAEnabled.value && usernameChanged && !otpPattern.test(securityForm.profile_totp)) {
      ElMessage.warning('已启用2FA，修改账号需输入6位验证码')
      return
    }

    savingProfile.value = true
    try {
      await auth.updateProfile({
        username: profileForm.username.trim(),
        qq: profileForm.qq.trim(),
        totp_code: twoFAEnabled.value && usernameChanged ? securityForm.profile_totp : undefined
      })
      ElMessage.success('资料已更新')
      profileEditing.value = false
      securityForm.profile_totp = ''
      fillProfileForm()
    } finally {
      savingProfile.value = false
    }
  }

  const authorizePasswordChange = (): void => {
    passwordAuthorized.value = true
    activeTab.value = 'password'
  }

  const resetPasswordForm = (): void => {
    Object.assign(passwordForm, {
      current_password: '',
      new_password: '',
      confirm_new_password: '',
      totp_code: ''
    })
    passwordFormRef.value?.clearValidate()
  }

  const cancelPasswordChange = (): void => {
    passwordAuthorized.value = false
    resetPasswordForm()
  }

  const savePassword = async (): Promise<void> => {
    if (!passwordFormRef.value) return
    const valid = await passwordFormRef.value.validate().catch(() => false)
    if (!valid) return
    if (twoFAEnabled.value && !otpPattern.test(passwordForm.totp_code)) {
      ElMessage.warning('已启用2FA，修改密码需输入6位验证码')
      return
    }

    savingPassword.value = true
    try {
      await changeMyPassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        totp_code: twoFAEnabled.value ? passwordForm.totp_code : undefined
      })
      ElMessage.success('密码已更新')
      cancelPasswordChange()
    } finally {
      savingPassword.value = false
    }
  }

  const resetTwoFAForm = (keepCurrentCode = false): void => {
    securityForm.twofa_password = ''
    if (!keepCurrentCode) securityForm.twofa_current_code = ''
    securityForm.twofa_code = ''
    twoFAUrl.value = ''
    twoFASecret.value = ''
  }

  const resetContactForm = (form: ContactFormState): void => {
    Object.assign(form, { value: '', code: '', password: '', ticket: '' })
  }

  const stopCooldown = (kind: 'email' | 'phone'): void => {
    const timer = kind === 'email' ? emailTimer : phoneTimer
    if (timer) clearInterval(timer)
    if (kind === 'email') emailTimer = undefined
    else phoneTimer = undefined
  }

  const startCooldown = (kind: 'email' | 'phone'): void => {
    stopCooldown(kind)
    const counter = kind === 'email' ? emailCooldown : phoneCooldown
    counter.value = 60
    const timer = setInterval(() => {
      if (counter.value <= 1) {
        counter.value = 0
        stopCooldown(kind)
        return
      }
      counter.value -= 1
    }, 1000)
    if (kind === 'email') emailTimer = timer
    else phoneTimer = timer
  }

  const openSecurityDialog = async (
    type: SecurityDialogType,
    options: { keepTicket?: boolean; keepCurrentCode?: boolean } = {}
  ): Promise<void> => {
    securityDialogType.value = type
    if (type === 'twofa') {
      resetTwoFAForm(Boolean(options.keepCurrentCode))
      await fetchTwoFAStatus()
    } else {
      const target = type === 'email' ? emailForm : phoneForm
      const ticket = options.keepTicket ? target.ticket : ''
      resetContactForm(target)
      target.ticket = ticket
      await Promise.allSettled([fetchTwoFAStatus(), fetchContacts()])
    }
    securityDialogVisible.value = true
    activeTab.value = 'security'
  }

  const openProtectedFlow = async (target: ProtectedTarget): Promise<void> => {
    await fetchTwoFAStatus()
    if (!twoFAEnabled.value) {
      if (target === 'edit') startProfileEdit()
      else if (target === 'password') authorizePasswordChange()
      else void openSecurityDialog(target)
      return
    }
    precheckTarget.value = target
    precheckCode.value = ''
    precheckVisible.value = true
  }

  const precheckTitle = computed(() => {
    const titles: Record<ProtectedTarget, string> = {
      edit: '验证 2FA 后编辑资料',
      password: '验证 2FA 后修改密码',
      twofa: '验证 2FA 后进入设置',
      email: '验证 2FA 后绑定邮箱',
      phone: '验证 2FA 后绑定手机'
    }
    return precheckTarget.value ? titles[precheckTarget.value] : '验证 2FA 后进入设置'
  })

  const resetPrecheck = (): void => {
    precheckCode.value = ''
    precheckTarget.value = undefined
    precheckLoading.value = false
  }

  const submitPrecheck = async (): Promise<void> => {
    const target = precheckTarget.value
    const code = precheckCode.value.trim()
    if (!target || !otpPattern.test(code)) {
      ElMessage.warning('请输入 6 位 2FA 验证码')
      return
    }
    precheckLoading.value = true
    try {
      if (target === 'email') {
        const response = await verifyMyEmailBind2FA({ totp_code: code })
        const payload = unwrapRecord(response.data)
        emailForm.ticket = String(payload.security_ticket ?? payload.SecurityTicket ?? '')
        if (!emailForm.ticket) throw new Error('missing email security ticket')
      } else if (target === 'phone') {
        const response = await verifyMyPhoneBind2FA({ totp_code: code })
        const payload = unwrapRecord(response.data)
        phoneForm.ticket = String(payload.security_ticket ?? payload.SecurityTicket ?? '')
        if (!phoneForm.ticket) throw new Error('missing phone security ticket')
      } else if (target === 'edit') {
        securityForm.profile_totp = code
      } else if (target === 'password') {
        passwordForm.totp_code = code
      } else {
        securityForm.twofa_current_code = code
      }

      precheckVisible.value = false
      precheckTarget.value = undefined
      precheckCode.value = ''
      ElMessage.success('2FA 验证通过')
      if (target === 'edit') startProfileEdit()
      else if (target === 'password') authorizePasswordChange()
      else if (target === 'twofa') await openSecurityDialog('twofa', { keepCurrentCode: true })
      else await openSecurityDialog(target, { keepTicket: true })
    } catch (error) {
      ElMessage.error(getRequestErrorMessage(error, '2FA 校验失败'))
    } finally {
      precheckLoading.value = false
    }
  }

  const canSetupTwoFA = computed(() => {
    if (securityLoading.setup) return false
    return twoFAEnabled.value
      ? otpPattern.test(securityForm.twofa_current_code.trim())
      : Boolean(securityForm.twofa_password.trim())
  })
  const canConfirmTwoFA = computed(
    () => Boolean(twoFAUrl.value) && otpPattern.test(securityForm.twofa_code.trim())
  )

  const setupTwoFactor = async (): Promise<void> => {
    if (!canSetupTwoFA.value) return
    securityLoading.setup = true
    try {
      const response = await setupTwoFA({
        password: twoFAEnabled.value ? undefined : securityForm.twofa_password.trim(),
        current_code: twoFAEnabled.value ? securityForm.twofa_current_code.trim() : undefined
      })
      const payload = unwrapRecord(response.data)
      twoFASecret.value = String(payload.secret ?? payload.Secret ?? '')
      twoFAUrl.value = String(payload.otpauth_url ?? payload.OtpauthURL ?? payload.OTPAuthURL ?? '')
      if (!twoFASecret.value || !twoFAUrl.value) {
        resetTwoFAForm(true)
        ElMessage.error('未获取到有效的 2FA 绑定信息')
        return
      }
      ElMessage.success('已生成，请使用验证器添加后输入验证码确认')
    } catch (error) {
      const message = getRequestErrorMessage(error, '生成失败')
      if (message.toLocaleLowerCase().includes('unauthorized')) {
        ElMessage.error(twoFAEnabled.value ? '当前 2FA 验证码错误' : '登录密码错误')
      } else {
        ElMessage.error(message)
      }
    } finally {
      securityLoading.setup = false
    }
  }

  const confirmTwoFactor = async (): Promise<void> => {
    if (!canConfirmTwoFA.value) return
    securityLoading.confirm = true
    try {
      await confirmTwoFA({ code: securityForm.twofa_code.trim() })
      await Promise.allSettled([fetchTwoFAStatus(), auth.fetchMe()])
      ElMessage.success('2FA 已开启')
      securityDialogVisible.value = false
    } catch (error) {
      const message = getRequestErrorMessage(error, '确认失败')
      if (message.toLocaleLowerCase().includes('unauthorized')) {
        ElMessage.error('验证码错误，请检查验证器时间后重试')
      } else {
        ElMessage.error(message)
      }
    } finally {
      securityLoading.confirm = false
    }
  }

  const activeContactForm = computed(() =>
    securityDialogType.value === 'email' ? emailForm : phoneForm
  )
  const activeContactCooldown = computed(() =>
    securityDialogType.value === 'email' ? emailCooldown.value : phoneCooldown.value
  )
  const activeContactLoading = computed(() =>
    securityDialogType.value === 'email'
      ? { send: securityLoading.emailSend, confirm: securityLoading.emailConfirm }
      : { send: securityLoading.phoneSend, confirm: securityLoading.phoneConfirm }
  )
  const contactValueValid = computed(() =>
    securityDialogType.value === 'email'
      ? emailPattern.test(activeContactForm.value.value.trim())
      : phonePattern.test(activeContactForm.value.value.trim())
  )
  const activeCodeSent = computed(() =>
    securityDialogType.value === 'email' ? emailCodeSent.value : phoneCodeSent.value
  )
  const canSendContactCode = computed(() => {
    if (activeContactLoading.value.send || activeContactCooldown.value > 0) return false
    if (!contactValueValid.value) return false
    return twoFAEnabled.value
      ? Boolean(activeContactForm.value.ticket)
      : Boolean(activeContactForm.value.password.trim())
  })
  const canConfirmContact = computed(
    () =>
      !activeContactLoading.value.confirm &&
      activeCodeSent.value &&
      contactValueValid.value &&
      /^[0-9A-Za-z]{4,8}$/.test(activeContactForm.value.code.trim())
  )

  const contactDialogAlert = computed<{ title: string; type: 'success' | 'info' }>(() => {
    const email = securityDialogType.value === 'email'
    const bound = email ? securityContacts.email_bound : securityContacts.phone_bound
    const masked = email ? securityContacts.email_masked : securityContacts.phone_masked
    return {
      title: bound ? `当前绑定：${masked || '已绑定'}` : `当前未绑定${email ? '邮箱' : '手机号'}`,
      type: bound ? 'success' : 'info'
    }
  })

  const sendContactCode = async (): Promise<void> => {
    if (!canSendContactCode.value) {
      ElMessage.warning(
        `请填写有效的${securityDialogType.value === 'email' ? '邮箱' : '手机号'}和身份凭据`
      )
      return
    }
    const target = activeContactForm.value
    const payload = {
      value: target.value.trim(),
      current_password: twoFAEnabled.value ? undefined : target.password.trim(),
      security_ticket: twoFAEnabled.value ? target.ticket : undefined
    }
    if (securityDialogType.value === 'email') {
      securityLoading.emailSend = true
      try {
        await sendMyEmailBindCode(payload)
        emailCodeSent.value = true
        startCooldown('email')
        ElMessage.success('邮箱验证码已发送')
      } finally {
        securityLoading.emailSend = false
      }
    } else {
      securityLoading.phoneSend = true
      try {
        await sendMyPhoneBindCode(payload)
        phoneCodeSent.value = true
        startCooldown('phone')
        ElMessage.success('短信验证码已发送')
      } finally {
        securityLoading.phoneSend = false
      }
    }
  }

  const confirmContactBind = async (): Promise<void> => {
    if (!canConfirmContact.value) return
    const target = activeContactForm.value
    const payload = {
      value: target.value.trim(),
      code: target.code.trim(),
      security_ticket: twoFAEnabled.value ? target.ticket : undefined
    }
    if (securityDialogType.value === 'email') {
      securityLoading.emailConfirm = true
      try {
        await confirmMyEmailBind(payload)
      } finally {
        securityLoading.emailConfirm = false
      }
    } else {
      securityLoading.phoneConfirm = true
      try {
        await confirmMyPhoneBind(payload)
      } finally {
        securityLoading.phoneConfirm = false
      }
    }
    ElMessage.success(`${securityDialogType.value === 'email' ? '邮箱' : '手机号'}绑定已更新`)
    securityDialogVisible.value = false
    await Promise.allSettled([auth.fetchMe(), fetchContacts()])
  }

  const securityDialogTitle = computed(() => {
    if (securityDialogType.value === 'email') return '邮箱绑定 / 换绑'
    if (securityDialogType.value === 'phone') return '手机绑定 / 换绑'
    return '双因素认证（2FA）'
  })

  watch(
    profile,
    () => {
      if (!profileEditing.value) fillProfileForm()
    },
    { immediate: true }
  )

  watch(securityDialogVisible, (visible) => {
    if (visible) return
    resetTwoFAForm()
    resetContactForm(emailForm)
    resetContactForm(phoneForm)
    emailCodeSent.value = false
    phoneCodeSent.value = false
    emailCooldown.value = 0
    phoneCooldown.value = 0
    stopCooldown('email')
    stopCooldown('phone')
  })

  onMounted(() => {
    void initializeProfile()
  })

  onBeforeUnmount(() => {
    stopCooldown('email')
    stopCooldown('phone')
  })
</script>

<style lang="scss" scoped>
  .page-heading {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 22px;
      color: var(--art-gray-900);
      letter-spacing: 0;
    }

    p {
      margin: 6px 0 0;
      font-size: 13px;
      color: var(--art-gray-600);
    }
  }

  .button-icon {
    margin-right: 6px;
  }

  .profile-summary {
    margin-bottom: 16px;
  }

  .summary-body {
    display: flex;
    gap: 22px;
    align-items: center;
    justify-content: space-between;
  }

  .summary-main {
    display: flex;
    gap: 16px;
    align-items: center;
    min-width: 0;
  }

  .avatar-wrap {
    position: relative;
    flex: none;
  }

  .status-dot {
    position: absolute;
    right: 3px;
    bottom: 3px;
    width: 14px;
    height: 14px;
    background: var(--art-gray-500);
    border: 2px solid var(--default-box-color);
    border-radius: 50%;
  }

  .status-dot-active {
    background: var(--el-color-success);
  }

  .summary-copy {
    min-width: 0;

    p {
      max-width: 520px;
      margin: 7px 0 0;
      overflow: hidden;
      font-size: 13px;
      color: var(--art-gray-600);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .summary-title-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 21px;
      color: var(--art-gray-900);
      letter-spacing: 0;
    }
  }

  .summary-metrics {
    display: grid;
    flex: none;
    grid-template-columns: repeat(3, minmax(105px, auto));
    gap: 0;

    div {
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 0 18px;
      border-left: 1px solid var(--default-border);
    }

    span {
      font-size: 12px;
      color: var(--art-gray-600);
    }

    strong {
      font-size: 14px;
      color: var(--art-gray-900);
      white-space: nowrap;
    }
  }

  .profile-grid {
    display: grid;
    grid-template-columns: 310px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  .overview-card {
    position: sticky;
    top: 16px;
  }

  .card-heading {
    display: flex;
    gap: 8px;
    align-items: center;
    font-weight: 600;
    color: var(--art-gray-900);

    > :first-child {
      color: var(--theme-color);
    }
  }

  .tier-icon {
    margin-right: 4px;
  }

  .settings-card {
    min-width: 0;
  }

  .tab-heading {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 18px;

    h3 {
      margin: 0;
      font-size: 17px;
      color: var(--art-gray-900);
      letter-spacing: 0;
    }

    p {
      margin: 5px 0 0;
      font-size: 12px;
      color: var(--art-gray-600);
    }
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .compact-form {
    max-width: 560px;
  }

  .form-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 8px;
  }

  .password-help {
    margin: -2px 0 14px;
    font-size: 12px;
    color: var(--art-gray-600);

    a {
      color: var(--theme-color);
    }
  }

  .tab-alert {
    max-width: 600px;
  }

  .security-list,
  .security-item {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 18px 0;
    border-bottom: 1px solid var(--default-border);

    &:last-child {
      border-bottom: 0;
    }
  }

  .security-icon {
    display: grid;
    flex: none;
    place-items: center;
    width: 42px;
    height: 42px;
    color: var(--theme-color);
    background: var(--el-color-primary-light-9);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .security-copy {
    flex: 1;
    min-width: 0;

    > div {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    strong {
      color: var(--art-gray-900);
    }

    p {
      margin: 5px 0 0;
      overflow: hidden;
      font-size: 12px;
      color: var(--art-gray-600);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .dialog-alert {
    margin-bottom: 18px;
  }

  .twofa-flow {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .twofa-auth-row,
  .code-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
  }

  .twofa-setup {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    gap: 18px;
    padding-top: 18px;
    border-top: 1px solid var(--default-border);
  }

  .qr-panel {
    display: grid;
    place-items: center;
    min-height: 200px;
    padding: 10px;
    background: var(--el-color-white);
    border: 1px solid var(--default-border);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .twofa-confirm {
    display: flex;
    flex-direction: column;
    gap: 12px;

    strong {
      color: var(--art-gray-900);
    }

    p {
      margin: 0;
      line-height: 1.6;
      color: var(--art-gray-600);
    }
  }

  .code-form-item {
    margin-bottom: 8px;
  }

  @media (width <= 1100px) {
    .summary-body {
      align-items: flex-start;
    }

    .summary-metrics {
      grid-template-columns: 1fr;

      div {
        padding: 5px 0 5px 16px;
      }
    }
  }

  @media (width <= 840px) {
    .summary-body {
      flex-direction: column;
    }

    .summary-metrics {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      width: 100%;

      div {
        padding: 8px 12px;
      }
    }

    .profile-grid {
      grid-template-columns: 1fr;
    }

    .overview-card {
      position: static;
    }
  }

  @media (width <= 640px) {
    .page-heading {
      flex-direction: column;
    }

    .summary-main {
      align-items: flex-start;
    }

    .summary-metrics,
    .form-grid {
      grid-template-columns: 1fr;
    }

    .summary-metrics div {
      padding-left: 0;
      border-top: 1px solid var(--default-border);
      border-left: 0;
    }

    .security-item {
      flex-wrap: wrap;
      align-items: flex-start;

      .security-copy {
        min-width: calc(100% - 56px);
      }

      > .el-button {
        width: 100%;
      }
    }

    .twofa-auth-row,
    .code-row,
    .twofa-setup {
      grid-template-columns: 1fr;
    }

    .qr-panel {
      width: 200px;
      margin: 0 auto;
    }
  }
</style>
