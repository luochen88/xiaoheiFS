<template>
  <section class="install-step">
    <header class="step-header">
      <div>
        <h2>数据库设置</h2>
        <p>选择数据库类型并配置连接信息</p>
      </div>
      <ElTag effect="plain">1 / 4</ElTag>
    </header>

    <div class="field-label">数据库类型</div>
    <ElSegmented
      v-model="wiz.dbType"
      :options="databaseOptions"
      class="database-types"
      @change="wiz.touchDB"
    />

    <div class="form-section">
      <ArtForm
        v-if="wiz.dbType === 'sqlite'"
        v-model="sqliteForm"
        :items="sqliteItems"
        :span="24"
        label-position="top"
        :show-reset="false"
        :show-submit="false"
      />
      <ArtForm
        v-else
        v-model="mysqlForm"
        :items="mysqlItems"
        :span="12"
        label-position="top"
        :show-reset="false"
        :show-submit="false"
      />
    </div>

    <div v-if="wiz.dbType === 'mysql'" class="dsn-preview">
      <div class="dsn-header">
        <span>DSN（自动生成）</span>
        <ElTooltip content="复制 DSN" placement="top">
          <ElButton :icon="CopyDocument" circle text aria-label="复制 DSN" @click="copyDSN" />
        </ElTooltip>
      </div>
      <code>{{ wiz.mysqlDSN }}</code>
    </div>

    <ElAlert
      v-if="wiz.dbCheckError"
      type="error"
      title="连接失败"
      :description="wiz.dbCheckError"
      :closable="false"
      show-icon
      class="connection-status"
    />
    <ElAlert
      v-else-if="wiz.dbChecked"
      type="success"
      title="连接测试通过"
      description="数据库连接正常"
      :closable="false"
      show-icon
      class="connection-status"
    />

    <footer class="step-actions">
      <ElButton :loading="checking" @click="onCheck">
        <ElIcon><Connection /></ElIcon>
        测试连接
      </ElButton>
      <ElButton type="primary" :disabled="!wiz.dbChecked" @click="emit('next')" v-ripple>
        下一步
        <ElIcon><ArrowRight /></ElIcon>
      </ElButton>
    </footer>
  </section>
</template>

<script setup lang="ts">
  import { ArrowRight, Connection, CopyDocument } from '@element-plus/icons-vue'
  import type { FormItem } from '@/components/core/forms/art-form/index.vue'
  import { checkInstallDB } from '@/services/user'
  import { useInstallWizardStore } from '@/stores/installWizard'

  defineOptions({ name: 'InstallDatabaseStep' })

  const emit = defineEmits<{ next: [] }>()
  const wiz = useInstallWizardStore()
  const checking = ref(false)

  const databaseOptions = [
    { label: 'SQLite', value: 'sqlite' },
    { label: 'MySQL', value: 'mysql' }
  ]

  const sqliteForm = computed<Record<string, any>>({
    get: () => ({ path: wiz.sqlitePath }),
    set: (value) => {
      wiz.sqlitePath = String(value.path || '')
    }
  })

  const mysqlForm = computed<Record<string, any>>({
    get: () => wiz.mysql,
    set: (value) => {
      wiz.mysql = {
        host: String(value.host || ''),
        port: Number(value.port || 3306),
        user: String(value.user || ''),
        pass: String(value.pass || ''),
        dbName: String(value.dbName || ''),
        params: String(value.params || '')
      }
    }
  })

  const sqliteItems: FormItem[] = [
    {
      key: 'path',
      label: '数据库文件路径',
      type: 'input',
      span: 24,
      props: { placeholder: './data/app.db', clearable: true }
    }
  ]

  const mysqlItems: FormItem[] = [
    {
      key: 'host',
      label: '主机',
      type: 'input',
      props: { placeholder: '127.0.0.1', clearable: true }
    },
    {
      key: 'port',
      label: '端口',
      type: 'number',
      props: { min: 1, max: 65535, controlsPosition: 'right', style: { width: '100%' } }
    },
    {
      key: 'user',
      label: '用户名',
      type: 'input',
      props: { placeholder: 'root', clearable: true }
    },
    { key: 'pass', label: '密码', type: 'input', props: { type: 'password', showPassword: true } },
    {
      key: 'dbName',
      label: '数据库名',
      type: 'input',
      span: 24,
      props: { placeholder: 'xiaohei', clearable: true }
    },
    {
      key: 'params',
      label: '连接参数（可选）',
      type: 'input',
      span: 24,
      props: { placeholder: 'charset=utf8mb4&parseTime=True&loc=Local', clearable: true }
    }
  ]

  watch(
    () => [
      wiz.sqlitePath,
      wiz.mysql.host,
      wiz.mysql.port,
      wiz.mysql.user,
      wiz.mysql.pass,
      wiz.mysql.dbName,
      wiz.mysql.params
    ],
    () => wiz.touchDB()
  )

  const copyDSN = async () => {
    await navigator.clipboard.writeText(wiz.mysqlDSN)
    ElMessage.success('DSN 已复制到剪贴板')
  }

  const onCheck = async () => {
    wiz.persist()
    checking.value = true
    try {
      const payload =
        wiz.dbType === 'sqlite'
          ? { db: { type: 'sqlite', path: wiz.sqlitePath } }
          : { db: { type: 'mysql', dsn: wiz.mysqlDSN } }
      const response = await checkInstallDB(payload)
      if (response.data?.ok) {
        wiz.markDBChecked(true)
        ElMessage.success('数据库连接正常')
      } else {
        wiz.markDBChecked(false, response.data?.error || 'unknown error')
      }
    } catch (error: any) {
      wiz.markDBChecked(false, error?.response?.data?.error || error?.message || 'unknown error')
    } finally {
      checking.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .install-step {
    padding: 4px;
  }

  .step-header {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .step-header h2 {
    margin: 0 0 6px;
    font-size: 22px;
    font-weight: 700;
    color: var(--art-gray-900);
  }

  .step-header p {
    margin: 0;
    font-size: 14px;
    color: var(--art-gray-600);
  }

  .field-label {
    margin-bottom: 10px;
    font-size: 14px;
    font-weight: 600;
    color: var(--art-gray-800);
  }

  .database-types {
    width: 100%;
  }

  .form-section {
    margin-top: 18px;
    overflow: hidden;
    background: var(--default-bg-color);
    border: 1px solid var(--default-border);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .dsn-preview {
    padding: 14px 16px;
    margin-top: 14px;
    background: var(--art-gray-100);
    border: 1px dashed var(--default-border-dashed);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .dsn-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--art-gray-700);
  }

  .dsn-preview code {
    display: block;
    font-size: 12px;
    color: var(--art-gray-800);
    overflow-wrap: anywhere;
  }

  .connection-status {
    margin-top: 16px;
  }

  .step-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding-top: 24px;
  }

  @media (width <= 640px) {
    .step-actions {
      display: grid;
      grid-template-columns: 1fr;
    }
  }
</style>
