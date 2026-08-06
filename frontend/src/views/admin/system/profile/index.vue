<template>
  <div v-loading="pageLoading" class="profile-page art-full-height">
    <ElRow :gutter="16">
      <ElCol :xs="24" :lg="8">
        <ElCard shadow="never" class="hero-card">
          <div class="hero-avatar-wrap">
            <ElAvatar :size="88" :src="avatarUrl">
              {{ profileInitial }}
            </ElAvatar>
          </div>

          <h2 class="hero-name">{{ profileName }}</h2>
          <p class="hero-role">{{ roleLabel }}</p>
          <ElTag :type="permissionTagType" size="large">{{ permissionGroupLabel }}</ElTag>

          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-label">加入日期</span>
              <strong>{{ formatDate(profile.created_at) }}</strong>
            </div>
            <div class="stat-item">
              <span class="stat-label">权限数</span>
              <strong>{{ permissionCount }}</strong>
            </div>
          </div>
        </ElCard>
      </ElCol>

      <ElCol :xs="24" :lg="16">
        <ElCard shadow="never" class="section-card">
          <template #header>
            <div class="section-header">
              <div>
                <div class="section-title">基本信息</div>
                <div class="section-subtitle"> 查看当前管理员资料与权限组信息。 </div>
              </div>

              <ElButton type="primary" plain @click="openEditProfile">编辑资料</ElButton>
            </div>
          </template>

          <ElDescriptions :column="2" border>
            <ElDescriptionsItem label="用户名">{{ profile.username || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="角色">{{ roleLabel }}</ElDescriptionsItem>
            <ElDescriptionsItem label="邮箱地址">{{ profile.email || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="QQ 号码">{{ profile.qq || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="权限组">
              <ElTag :type="permissionTagType">{{ permissionGroupLabel }}</ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="注册时间">
              {{ formatDateTime(profile.created_at) }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </ElCard>

        <ElCard shadow="never" class="section-card">
          <template #header>
            <div class="section-header">
              <div>
                <div class="section-title">安全设置</div>
                <div class="section-subtitle"> 定期修改密码可以保护管理员账号安全。 </div>
              </div>

              <ElButton type="primary" plain @click="openChangePassword">修改密码</ElButton>
            </div>
          </template>

          <div class="security-panel">
            <div class="security-icon">
              <ElIcon><Lock /></ElIcon>
            </div>
            <div class="security-copy">
              <div class="security-title">登录密码</div>
              <p> 当前密码出于安全原因不会显示。修改后，下次登录请使用新密码。 </p>
            </div>
          </div>
        </ElCard>

        <ElCard shadow="never" class="section-card">
          <template #header>
            <div class="section-header">
              <div>
                <div class="section-title">权限列表</div>
                <div class="section-subtitle"> 当前管理员账号的有效权限。 </div>
              </div>

              <ElTag type="info">{{ permissionCount }} 个权限</ElTag>
            </div>
          </template>

          <div v-if="grantedPermissions.length" class="permission-list">
            <ElTag
              v-for="permission in grantedPermissions"
              :key="permission"
              type="primary"
              effect="plain"
            >
              {{ permissionLabel(permission) }}
            </ElTag>
          </div>
          <ElEmpty v-else description="暂无权限信息" />
        </ElCard>
      </ElCol>
    </ElRow>

    <ElDialog
      v-model="profileDialogVisible"
      title="编辑资料"
      width="520px"
      destroy-on-close
      align-center
    >
      <ElForm ref="profileFormRef" :model="profileForm" :rules="profileRules" label-position="top">
        <ElFormItem label="邮箱地址" prop="email">
          <ElInput
            v-model.trim="profileForm.email"
            :maxlength="INPUT_LIMITS.EMAIL"
            placeholder="请输入邮箱地址"
          />
        </ElFormItem>

        <ElFormItem label="QQ 号码" prop="qq">
          <ElInput
            v-model.trim="profileForm.qq"
            :maxlength="INPUT_LIMITS.QQ"
            placeholder="请输入QQ号码"
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="profileDialogVisible = false">取消</ElButton>
          <ElButton type="primary" :loading="profileSubmitting" @click="handleUpdateProfile">
            保存
          </ElButton>
        </div>
      </template>
    </ElDialog>

    <ElDialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="520px"
      destroy-on-close
      align-center
    >
      <ElForm
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-position="top"
      >
        <ElFormItem label="当前密码" prop="old_password">
          <ElInput
            v-model="passwordForm.old_password"
            type="password"
            show-password
            :maxlength="INPUT_LIMITS.PASSWORD"
            placeholder="请输入当前密码"
          />
        </ElFormItem>

        <ElFormItem label="新密码" prop="new_password">
          <ElInput
            v-model="passwordForm.new_password"
            type="password"
            show-password
            :maxlength="INPUT_LIMITS.PASSWORD"
            placeholder="请输入新密码（至少6位）"
          />
        </ElFormItem>

        <ElFormItem label="确认新密码" prop="confirm_password">
          <ElInput
            v-model="passwordForm.confirm_password"
            type="password"
            show-password
            :maxlength="INPUT_LIMITS.PASSWORD"
            placeholder="请再次输入新密码"
          />
        </ElFormItem>
      </ElForm>

      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="passwordDialogVisible = false">取消</ElButton>
          <ElButton type="primary" :loading="passwordSubmitting" @click="handleChangePassword">
            保存
          </ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import type {
    AdminProfileRecord as AdminProfile,
    PermissionGroupRecord,
    PermissionRecord
  } from '@/services/admin'
  import {
    changeAdminPassword,
    fetchAdminPermissions,
    fetchAdminProfile,
    fetchPermissionGroups,
    mapAdminProfileToUserInfo,
    updateAdminProfile
  } from '@/services/admin'
  import { useUserStore } from '@/store/modules/user'
  import { useAdminAuthStore } from '@/stores/adminAuth'
  import { INPUT_LIMITS } from '@/constants/inputLimits'
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
  import { Lock } from '@element-plus/icons-vue'

  defineOptions({ name: 'UserCenter' })

  interface ProfileFormState {
    email: string
    qq: string
  }

  interface PasswordFormState {
    old_password: string
    new_password: string
    confirm_password: string
  }

  const adminAuthStore = useAdminAuthStore()
  const userStore = useUserStore()
  const { profile: info } = storeToRefs(adminAuthStore)

  const pageLoading = ref(false)
  const profileSubmitting = ref(false)
  const passwordSubmitting = ref(false)

  const profile = ref<AdminProfile>({})
  const permissionGroups = ref<PermissionGroupRecord[]>([])
  const allPermissions = ref<PermissionRecord[]>([])

  const profileDialogVisible = ref(false)
  const passwordDialogVisible = ref(false)

  const profileFormRef = ref<FormInstance>()
  const passwordFormRef = ref<FormInstance>()

  const profileForm = reactive<ProfileFormState>({
    email: '',
    qq: ''
  })

  const passwordForm = reactive<PasswordFormState>({
    old_password: '',
    new_password: '',
    confirm_password: ''
  })

  const grantedPermissions = computed(() => {
    if (Array.isArray(profile.value.permissions) && profile.value.permissions.length) {
      return profile.value.permissions.filter(Boolean)
    }

    if (Array.isArray(info.value?.permissions) && info.value.permissions.length) {
      return info.value.permissions.filter(Boolean)
    }

    return []
  })

  const permissionCount = computed(() => grantedPermissions.value.length)

  const permissionGroupMap = computed(() => {
    const map = new Map<number, string>()

    permissionGroups.value.forEach((group) => {
      const id = normalizeNullableNumber(group.id ?? group.ID)
      if (id === null) {
        return
      }

      map.set(id, String(group.name ?? group.Name ?? '-'))
    })

    return map
  })

  const permissionLabelMap = computed(() => {
    const map = new Map<string, string>()

    allPermissions.value.forEach((permission) => {
      const code = String(permission.code ?? permission.Code ?? '').trim()
      if (!code) {
        return
      }

      map.set(
        code,
        String(
          permission.friendly_name ??
            permission.FriendlyName ??
            permission.name ??
            permission.Name ??
            code
        )
      )
    })

    return map
  })

  const profileName = computed(() =>
    String(profile.value.username || info.value?.username || 'Admin')
  )

  const profileInitial = computed(() => profileName.value.slice(0, 1).toUpperCase() || 'A')

  const avatarUrl = computed(() => {
    const avatar = String(
      profile.value.avatar || profile.value.avatar_url || info.value?.avatar || ''
    ).trim()
    if (avatar) {
      return avatar
    }

    const qq = String(profile.value.qq || '').trim()
    return qq ? `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=100` : ''
  })

  const roleLabel = computed(() => {
    const role = String(profile.value.role || '').trim()
    if (role === 'admin') {
      return '管理员'
    }
    return role || '未知'
  })

  const permissionGroupLabel = computed(() => {
    const directLabel = String(profile.value.permission_group_name || '').trim()
    if (directLabel) {
      return directLabel
    }

    const id = normalizeNullableNumber(profile.value.permission_group_id)
    if (id !== null && permissionGroupMap.value.has(id)) {
      return permissionGroupMap.value.get(id) || '-'
    }

    return roleLabel.value
  })

  const permissionTagType = computed(() => {
    if (permissionCount.value > 20) {
      return 'danger' as const
    }
    if (permissionCount.value > 10) {
      return 'warning' as const
    }
    return 'success' as const
  })

  const profileRules = computed<FormRules>(() => ({
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      {
        type: 'email',
        message: '请输入有效的邮箱格式',
        trigger: ['blur', 'change']
      },
      {
        max: INPUT_LIMITS.EMAIL,
        message: `邮箱长度不能超过 ${INPUT_LIMITS.EMAIL} 个字符`,
        trigger: 'blur'
      }
    ],
    qq: [
      {
        validator: (_rule, value, callback) => {
          const text = String(value || '').trim()
          const qq = Number(text)
          if (text && (!Number.isInteger(qq) || qq <= 0)) {
            callback(new Error('QQ号必须是正整数'))
            return
          }
          callback()
        },
        trigger: 'blur'
      },
      {
        max: INPUT_LIMITS.QQ,
        message: `QQ 长度不能超过 ${INPUT_LIMITS.QQ} 个字符`,
        trigger: 'blur'
      }
    ]
  }))

  const passwordRules = computed<FormRules>(() => ({
    old_password: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
    new_password: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, message: '密码至少需要6个字符', trigger: 'blur' },
      {
        max: INPUT_LIMITS.PASSWORD,
        message: `密码长度不能超过 ${INPUT_LIMITS.PASSWORD} 个字符`,
        trigger: 'blur'
      }
    ],
    confirm_password: [
      { required: true, message: '请确认新密码', trigger: 'blur' },
      {
        validator: (_rule, value, callback) => {
          if (String(value || '') !== String(passwordForm.new_password || '')) {
            callback(new Error('两次输入的密码不一致'))
            return
          }
          callback()
        },
        trigger: 'blur'
      }
    ]
  }))

  onMounted(() => {
    initializePage()
  })

  function normalizeNullableNumber(value: unknown): number | null {
    if (value === '' || value === null || value === undefined) {
      return null
    }

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  function permissionLabel(code: string) {
    return permissionLabelMap.value.get(code) || code || '-'
  }

  function formatDate(value?: string | null) {
    if (!value) {
      return '-'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleDateString('zh-CN')
  }

  function formatDateTime(value?: string | null) {
    if (!value) {
      return '-'
    }

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
  }

  async function initializePage() {
    pageLoading.value = true

    try {
      await Promise.allSettled([
        fetchProfileData(),
        fetchPermissionGroupsData(),
        fetchAllPermissionsData()
      ])
    } finally {
      pageLoading.value = false
    }
  }

  async function fetchProfileData() {
    try {
      const payload = await fetchAdminProfile()
      profile.value = payload || {}
      profileForm.email = String(profile.value.email || '')
      profileForm.qq = String(profile.value.qq || '')
      userStore.setUserInfo(mapAdminProfileToUserInfo(profile.value))
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || '获取个人资料失败')
    }
  }

  async function fetchPermissionGroupsData() {
    try {
      const payload = await fetchPermissionGroups()
      permissionGroups.value = payload.items || []
    } catch {
      permissionGroups.value = []
    }
  }

  async function fetchAllPermissionsData() {
    try {
      const payload = await fetchAdminPermissions()
      allPermissions.value = payload.items || []
    } catch {
      allPermissions.value = []
    }
  }

  function openEditProfile() {
    profileForm.email = String(profile.value.email || '')
    profileForm.qq = String(profile.value.qq || '')
    profileDialogVisible.value = true
    nextTick(() => profileFormRef.value?.clearValidate())
  }

  function openChangePassword() {
    passwordForm.old_password = ''
    passwordForm.new_password = ''
    passwordForm.confirm_password = ''
    passwordDialogVisible.value = true
    nextTick(() => passwordFormRef.value?.clearValidate())
  }

  async function handleUpdateProfile() {
    if (!profileFormRef.value) {
      return
    }

    const valid = await profileFormRef.value.validate().catch(() => false)
    if (!valid) {
      return
    }

    profileSubmitting.value = true

    try {
      await updateAdminProfile({
        email: String(profileForm.email || '').trim(),
        qq: String(profileForm.qq || '').trim()
      })
      ElMessage.success('资料已更新')
      profileDialogVisible.value = false
      await fetchProfileData()
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || '更新失败')
    } finally {
      profileSubmitting.value = false
    }
  }

  async function handleChangePassword() {
    if (!passwordFormRef.value) {
      return
    }

    const valid = await passwordFormRef.value.validate().catch(() => false)
    if (!valid) {
      return
    }

    passwordSubmitting.value = true

    try {
      await changeAdminPassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      })
      ElMessage.success('密码已修改，请重新登录')
      passwordDialogVisible.value = false
      passwordForm.old_password = ''
      passwordForm.new_password = ''
      passwordForm.confirm_password = ''
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || '密码修改失败')
    } finally {
      passwordSubmitting.value = false
    }
  }
</script>

<style scoped lang="scss">
  .profile-page {
    padding-top: 2px;
  }

  .hero-card,
  .section-card {
    margin-bottom: 16px;
  }

  .hero-card {
    text-align: center;
  }

  .hero-avatar-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
  }

  .hero-name {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .hero-role {
    margin: 8px 0 18px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  .hero-stats {
    display: grid;
    gap: 12px;
    margin-top: 20px;
    text-align: left;
  }

  .stat-item {
    padding: 12px 14px;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }

  .stat-label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .section-header {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }

  .section-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .section-subtitle {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }

  .security-panel {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .security-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    font-size: 18px;
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 12%, white);
    border-radius: 8px;
  }

  .security-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .security-copy p {
    margin: 8px 0 0;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
  }

  .permission-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  @media (width <= 768px) {
    .section-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
