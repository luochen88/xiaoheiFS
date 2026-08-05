<template>
  <div class="vps-detail-page art-full-height">
    <div class="page-heading">
      <div class="heading-copy">
        <ElButton link :icon="ArrowLeft" @click="router.push('/console/vps')">返回列表</ElButton>
        <div class="title-row">
          <h1>{{ detail?.name || `VPS-${id}` }}</h1>
          <VpsStatusTag :status="resolvedStatus" />
        </div>
        <div class="instance-meta">
          <span>ID {{ id }}</span>
          <span>{{ spec.cpu }} 核</span>
          <span>{{ spec.memory_gb }} GB</span>
          <span>{{ spec.disk_gb }} GB</span>
          <span>{{ spec.bandwidth_mbps || '-' }} Mbps</span>
        </div>
      </div>
      <div class="heading-actions">
        <ElButton type="primary" :icon="Link" @click="openPanel">控制面板</ElButton>
        <ElButton :icon="VideoCamera" @click="openVnc">VNC</ElButton>
        <ElButton :icon="Refresh" :loading="loading" aria-label="刷新" @click="refresh" />
        <ElDropdown @command="handleHeaderCommand">
          <ElButton :icon="MoreFilled">更多</ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem command="renew">续费</ElDropdownItem>
              <ElDropdownItem v-if="emergencyRenewEligible" command="emergency-renew"
                >紧急续费</ElDropdownItem
              >
              <ElDropdownItem command="reset-password">重置系统密码</ElDropdownItem>
              <ElDropdownItem command="reinstall">重装系统</ElDropdownItem>
              <ElDropdownItem v-if="resizeEnabled" divided command="resize">升降配</ElDropdownItem>
              <ElDropdownItem v-if="refundEnabled" command="refund">申请退款</ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </div>
    </div>

    <ElAlert
      v-if="unsupportedFeatureHints.length"
      title="部分功能按实例能力已自动隐藏"
      type="info"
      show-icon
      :closable="false"
    >
      <div class="capability-tags">
        <ElTag v-for="item in unsupportedFeatureHints" :key="item.key" effect="plain">
          {{ item.label }}：{{ item.reason }}
        </ElTag>
      </div>
    </ElAlert>

    <ElSkeleton v-if="loading && !detail" :rows="8" animated />
    <ElTabs v-else v-model="activeTab" class="detail-tabs">
      <ElTabPane label="概览" name="overview">
        <div class="overview-grid">
          <ElCard class="content-card" shadow="never">
            <template #header
              ><SectionHeading title="实例信息" subtitle="资源规格与访问凭据"
            /></template>
            <ElDescriptions :column="2" border>
              <ElDescriptionsItem label="状态"
                ><VpsStatusTag :status="resolvedStatus"
              /></ElDescriptionsItem>
              <ElDescriptionsItem label="区域">{{ detail?.region || '-' }}</ElDescriptionsItem>
              <ElDescriptionsItem label="操作系统">{{ systemLabel }}</ElDescriptionsItem>
              <ElDescriptionsItem label="远程地址">
                <span class="inline-copy">
                  {{ access.remote_ip || '-' }}
                  <ElButton
                    v-if="access.remote_ip"
                    link
                    type="primary"
                    :icon="CopyDocument"
                    @click="copyText(access.remote_ip, '远程地址')"
                  />
                </span>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="系统用户">{{
                isWindowsOS ? 'Administrator' : 'root'
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="远程端口">{{
                access.remote_port || (isWindowsOS ? '3389' : '22')
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="系统密码">
                <span class="inline-copy">
                  <span class="secret">{{
                    showOsPassword ? access.os_password || '-' : '••••••••'
                  }}</span>
                  <ElButton
                    link
                    type="primary"
                    :icon="showOsPassword ? Hide : View"
                    @click="showOsPassword = !showOsPassword"
                  />
                  <ElButton link type="primary" @click="openResetPassword">修改</ElButton>
                </span>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="面板密码">
                <span class="inline-copy">
                  <span class="secret">{{
                    showPanelPassword ? access.panel_password || '-' : '••••••••'
                  }}</span>
                  <ElButton
                    link
                    type="primary"
                    :icon="showPanelPassword ? Hide : View"
                    @click="showPanelPassword = !showPanelPassword"
                  />
                </span>
              </ElDescriptionsItem>
              <ElDescriptionsItem label="连接命令" :span="2">
                <span class="inline-copy command-copy">
                  <code>{{ connectCommand }}</code>
                  <ElButton
                    link
                    type="primary"
                    :icon="CopyDocument"
                    @click="copyText(connectCommand, '连接命令')"
                  />
                </span>
              </ElDescriptionsItem>
            </ElDescriptions>
          </ElCard>

          <ElCard class="content-card" shadow="never">
            <template #header
              ><SectionHeading title="监控快照" subtitle="最近一次实时采样"
            /></template>
            <div class="monitor-summary">
              <div class="monitor-item">
                <div
                  ><span>CPU</span
                  ><strong :class="metricClass(currentCpu)">{{ currentCpu }}%</strong></div
                >
                <ElProgress :percentage="currentCpu" :show-text="false" />
              </div>
              <div class="monitor-item">
                <div
                  ><span>内存</span
                  ><strong :class="metricClass(currentMemory)">{{ currentMemory }}%</strong></div
                >
                <ElProgress :percentage="currentMemory" :show-text="false" />
              </div>
              <div class="network-summary">
                <div
                  ><span>入站</span><strong>{{ currentTrafficIn }} KB/s</strong></div
                >
                <div
                  ><span>出站</span><strong>{{ currentTrafficOut }} KB/s</strong></div
                >
              </div>
            </div>
          </ElCard>

          <ElCard class="content-card" shadow="never">
            <template #header
              ><SectionHeading title="时间与价格" subtitle="实例生命周期"
            /></template>
            <div class="lifecycle-grid">
              <div
                ><span>创建时间</span><strong>{{ formatDateTime(detail?.created_at) }}</strong></div
              >
              <div
                ><span>到期时间</span
                ><strong :class="{ danger: isExpiringSoon }">{{
                  formatDateTime(detail?.expire_at)
                }}</strong></div
              >
              <div
                ><span>剩余天数</span><strong>{{ remainingDays }}</strong></div
              >
              <div
                ><span>当前价格</span
                ><strong>¥{{ Number(detail?.monthly_price || 0).toFixed(2) }}/月</strong></div
              >
            </div>
            <div class="lifecycle-actions">
              <ElButton type="primary" @click="openRenew">续费</ElButton>
              <ElButton
                v-if="emergencyRenewEligible"
                type="danger"
                plain
                @click="submitEmergencyRenew"
                >紧急续费</ElButton
              >
              <ElButton v-if="resizeEnabled" :disabled="isExpired" @click="openResize"
                >升降配</ElButton
              >
              <ElButton v-if="refundEnabled" type="danger" text @click="openRefund"
                >申请退款</ElButton
              >
            </div>
          </ElCard>

          <ElCard class="content-card" shadow="never">
            <template #header
              ><SectionHeading title="电源操作" subtitle="实例生命周期命令"
            /></template>
            <div class="power-actions">
              <ElButton
                :icon="VideoPlay"
                :disabled="!canStart"
                @click="runPowerAction('开机', startVps)"
                >开机</ElButton
              >
              <ElButton
                :icon="SwitchButton"
                :disabled="!canShutdown"
                @click="runPowerAction('关机', shutdownVps)"
                >关机</ElButton
              >
              <ElButton
                :icon="RefreshRight"
                :disabled="!canReboot"
                @click="runPowerAction('重启', rebootVps)"
                >重启</ElButton
              >
              <ElButton :icon="RefreshLeft" @click="openReinstall">重装系统</ElButton>
            </div>
          </ElCard>
        </div>
      </ElTabPane>

      <ElTabPane label="监控" name="monitor">
        <div class="charts-grid">
          <ElCard
            v-for="chart in monitorCharts"
            :key="chart.key"
            class="content-card"
            shadow="never"
          >
            <template #header
              ><SectionHeading :title="chart.title" :subtitle="chart.subtitle"
            /></template>
            <ArtLineChart
              :data="chart.series.values"
              :x-axis-data="chart.series.labels"
              :loading="monitorLoading"
              height="220px"
              show-area-color
            />
          </ElCard>
        </div>
      </ElTabPane>

      <ElTabPane v-if="showFirewallTab" label="防火墙" name="firewall">
        <ElCard class="content-card tab-card" shadow="never">
          <div class="tab-toolbar">
            <SectionHeading title="防火墙规则" subtitle="控制实例入站与出站访问" />
            <ElButton type="primary" :icon="Plus" @click="openFirewall">添加规则</ElButton>
          </div>
          <ElTable
            v-loading="firewallLoading"
            :data="firewallRules"
            row-key="id"
            empty-text="暂无规则"
          >
            <ElTableColumn prop="direction" label="方向" width="90" />
            <ElTableColumn prop="protocol" label="协议" width="90" />
            <ElTableColumn prop="port" label="端口" min-width="120" />
            <ElTableColumn prop="ip" label="IP" min-width="150" />
            <ElTableColumn prop="method" label="动作" width="100" />
            <ElTableColumn label="操作" width="90" align="right">
              <template #default="{ row }"
                ><ElButton link type="danger" @click="removeFirewall(row)">删除</ElButton></template
              >
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </ElTabPane>

      <ElTabPane v-if="showPortTab" label="端口映射" name="port">
        <ElCard class="content-card tab-card" shadow="never">
          <div class="tab-toolbar">
            <SectionHeading title="端口映射" subtitle="管理公网端口与实例端口映射" />
            <ElButton type="primary" :icon="Plus" @click="openPort">添加映射</ElButton>
          </div>
          <ElTable
            v-loading="portLoading"
            :data="portMappings"
            row-key="id"
            empty-text="暂无端口映射"
          >
            <ElTableColumn prop="name" label="名称" min-width="160" />
            <ElTableColumn label="外部地址" min-width="180"
              ><template #default="{ row }">{{ formatPortExternal(row) }}</template></ElTableColumn
            >
            <ElTableColumn prop="dport" label="目标端口" width="120" />
            <ElTableColumn label="操作" width="100" align="right">
              <template #default="{ row }">
                <ElTag v-if="Number(row.sys) === 2" type="info">系统</ElTag>
                <ElButton
                  v-else
                  link
                  type="danger"
                  :disabled="isProtectedPort(row)"
                  @click="removePort(row)"
                  >删除</ElButton
                >
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </ElTabPane>

      <ElTabPane v-if="showSnapshotTab" label="快照" name="snapshot">
        <ElCard class="content-card tab-card" shadow="never">
          <div class="tab-toolbar">
            <SectionHeading title="实例快照" subtitle="保存与恢复系统盘状态" />
            <ElButton type="primary" :icon="Plus" :loading="snapshotLoading" @click="createSnapshot"
              >创建快照</ElButton
            >
          </div>
          <ElTable v-loading="snapshotLoading" :data="snapshots" row-key="id" empty-text="暂无快照">
            <ElTableColumn prop="name" label="名称" min-width="180" />
            <ElTableColumn label="状态" width="120"
              ><template #default="{ row }"
                ><ElTag :type="row.state_type">{{ row.state_label }}</ElTag></template
              ></ElTableColumn
            >
            <ElTableColumn label="创建时间" min-width="180"
              ><template #default="{ row }">{{
                formatDateTime(row.created_at)
              }}</template></ElTableColumn
            >
            <ElTableColumn label="操作" width="150" align="right">
              <template #default="{ row }">
                <ElButton link type="primary" @click="restoreSnapshot(row)">恢复</ElButton>
                <ElButton link type="danger" @click="removeSnapshot(row)">删除</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </ElTabPane>

      <ElTabPane v-if="showBackupTab" label="备份" name="backup">
        <ElCard class="content-card tab-card" shadow="never">
          <div class="tab-toolbar">
            <SectionHeading title="实例备份" subtitle="创建与恢复完整备份" />
            <ElButton type="primary" :icon="Plus" :loading="backupLoading" @click="createBackup"
              >创建备份</ElButton
            >
          </div>
          <ElTable v-loading="backupLoading" :data="backups" row-key="id" empty-text="暂无备份">
            <ElTableColumn prop="name" label="名称" min-width="180" />
            <ElTableColumn label="状态" width="120"
              ><template #default="{ row }"
                ><ElTag :type="row.state_type">{{ row.state_label }}</ElTag></template
              ></ElTableColumn
            >
            <ElTableColumn label="创建时间" min-width="180"
              ><template #default="{ row }">{{
                formatDateTime(row.created_at)
              }}</template></ElTableColumn
            >
            <ElTableColumn label="操作" width="150" align="right">
              <template #default="{ row }">
                <ElButton link type="primary" @click="restoreBackup(row)">恢复</ElButton>
                <ElButton link type="danger" @click="removeBackup(row)">删除</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </ElTabPane>
    </ElTabs>

    <ElDialog v-model="renewOpen" title="续费实例" width="min(480px, calc(100vw - 32px))">
      <ElForm label-position="top">
        <ElFormItem label="续费周期">
          <ElSelect v-model="renewForm.cycleId" class="full-width">
            <ElOption
              v-for="cycle in billingCycles"
              :key="cycle.id"
              :label="`${cycle.name}（${cycle.months} 个月）`"
              :value="cycle.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="购买数量"
          ><ElInputNumber v-model="renewForm.cycleQty" :min="1" :max="24" class="full-width"
        /></ElFormItem>
        <ElAlert :title="`续费时长：${renewMonths} 个月`" type="info" show-icon :closable="false" />
      </ElForm>
      <template #footer
        ><ElButton @click="renewOpen = false">取消</ElButton
        ><ElButton type="primary" :loading="renewing" @click="submitRenew"
          >生成订单</ElButton
        ></template
      >
    </ElDialog>

    <ElDialog v-model="resizeOpen" title="升降配置" width="min(620px, calc(100vw - 32px))">
      <ElForm label-position="top">
        <ElFormItem label="目标套餐">
          <ElSelect v-model="resizeForm.target_package_id" class="full-width" filterable>
            <ElOption
              v-for="pkg in packageOptions"
              :key="pkg.id"
              :value="pkg.id"
              :label="`${pkg.name} · ￥${Number(pkg.monthly_price || 0).toFixed(2)}/月`"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem
          ><ElSwitch v-model="resizeForm.reset_addons" active-text="重置所有附加项"
        /></ElFormItem>
        <ElRow :gutter="12">
          <ElCol v-for="field in addonFields" :key="field.key" :span="12">
            <ElFormItem :label="field.label"
              ><ElInputNumber
                v-model="resizeForm[field.key]"
                :min="addonMin[field.key]"
                :max="addonMax[field.key]"
                :step="addonStep[field.key]"
                :disabled="resizeForm.reset_addons"
                class="full-width"
            /></ElFormItem>
          </ElCol>
        </ElRow>
        <ElFormItem label="执行方式">
          <ElRadioGroup v-model="resizeForm.schedule_mode"
            ><ElRadio value="now">立即执行</ElRadio
            ><ElRadio value="scheduled">定时执行</ElRadio></ElRadioGroup
          >
        </ElFormItem>
        <ElFormItem v-if="resizeForm.schedule_mode === 'scheduled'" label="执行时间"
          ><ElDatePicker
            v-model="resizeForm.scheduled_at"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="full-width"
        /></ElFormItem>
        <ElAlert
          v-if="resizeQuoteLoading"
          title="正在计算价格..."
          type="info"
          show-icon
          :closable="false"
        />
        <ElAlert
          v-else-if="resizeQuoteError"
          :title="resizeQuoteError"
          type="error"
          show-icon
          :closable="false"
        />
        <ElAlert
          v-else-if="resizeQuote"
          :title="`本周期需支付：￥${resizeQuoteAmount.toFixed(2)}`"
          type="success"
          show-icon
          :closable="false"
        />
      </ElForm>
      <template #footer
        ><ElButton @click="resizeOpen = false">取消</ElButton
        ><ElButton
          type="primary"
          :loading="resizing"
          :disabled="!resizeForm.target_package_id || isSameTargetSelection"
          @click="submitResize"
          >提交升降配</ElButton
        ></template
      >
    </ElDialog>

    <ElDialog v-model="reinstallOpen" title="重装系统" width="min(480px, calc(100vw - 32px))">
      <ElAlert
        title="重装将清空当前系统盘数据，请确认已备份。"
        type="warning"
        show-icon
        :closable="false"
      />
      <ElForm label-position="top" class="dialog-form">
        <ElFormItem label="系统镜像"
          ><ElSelect v-model="reinstallForm.template_id" class="full-width"
            ><ElOption
              v-for="image in reinstallImages"
              :key="image.id"
              :label="image.name"
              :value="image.id" /></ElSelect
        ></ElFormItem>
        <ElFormItem label="新系统密码"
          ><div class="input-action"
            ><ElInput
              v-model="reinstallForm.password"
              type="password"
              show-password
              :maxlength="INPUT_LIMITS.PASSWORD"
            /><ElButton @click="reinstallForm.password = generatePassword()">随机</ElButton></div
          ></ElFormItem
        >
      </ElForm>
      <template #footer
        ><ElButton @click="reinstallOpen = false">取消</ElButton
        ><ElButton type="danger" :loading="reinstalling" @click="submitReinstall"
          >确认重装</ElButton
        ></template
      >
    </ElDialog>

    <ElDialog
      v-model="resetPasswordOpen"
      title="重置系统密码"
      width="min(460px, calc(100vw - 32px))"
    >
      <ElForm label-position="top"
        ><ElFormItem label="新密码"
          ><div class="input-action"
            ><ElInput
              v-model="resetPasswordForm.password"
              type="password"
              show-password
              :maxlength="INPUT_LIMITS.PASSWORD"
            /><ElButton @click="resetPasswordForm.password = generatePassword()"
              >随机</ElButton
            ></div
          ></ElFormItem
        ></ElForm
      >
      <template #footer
        ><ElButton @click="resetPasswordOpen = false">取消</ElButton
        ><ElButton type="primary" :loading="submitting" @click="submitResetPassword"
          >提交</ElButton
        ></template
      >
    </ElDialog>

    <ElDialog v-model="firewallOpen" title="添加防火墙规则" width="min(480px, calc(100vw - 32px))">
      <ElForm label-position="top"
        ><ElRow :gutter="12"
          ><ElCol :span="12"
            ><ElFormItem label="方向"
              ><ElSelect v-model="firewallForm.direction" class="full-width"
                ><ElOption label="入站" value="In" /><ElOption
                  label="出站"
                  value="Out" /></ElSelect></ElFormItem></ElCol
          ><ElCol :span="12"
            ><ElFormItem label="协议"
              ><ElSelect v-model="firewallForm.protocol" class="full-width"
                ><ElOption label="TCP" value="tcp" /><ElOption label="UDP" value="udp" /><ElOption
                  label="全部"
                  value="all" /></ElSelect></ElFormItem></ElCol></ElRow
        ><ElFormItem label="动作"
          ><ElRadioGroup v-model="firewallForm.method"
            ><ElRadio value="allowed">允许</ElRadio
            ><ElRadio value="denied">拒绝</ElRadio></ElRadioGroup
          ></ElFormItem
        ><ElFormItem label="端口"
          ><ElInput v-model="firewallForm.port" placeholder="例如 22 或 80-90" /></ElFormItem
        ><ElFormItem label="IP 地址"
          ><ElInput v-model="firewallForm.ip" placeholder="0.0.0.0" /></ElFormItem
        ><ElFormItem label="优先级"
          ><ElInputNumber
            v-model="firewallForm.priority"
            :min="1"
            :max="65535"
            class="full-width" /></ElFormItem
      ></ElForm>
      <template #footer
        ><ElButton @click="firewallOpen = false">取消</ElButton
        ><ElButton type="primary" :loading="submitting" @click="submitFirewall"
          >添加</ElButton
        ></template
      >
    </ElDialog>

    <ElDialog v-model="portOpen" title="添加端口映射" width="min(480px, calc(100vw - 32px))">
      <ElForm label-position="top"
        ><ElFormItem label="名称"
          ><ElInput
            v-model="portForm.name"
            :maxlength="INPUT_LIMITS.PORT_MAPPING_NAME" /></ElFormItem
        ><ElFormItem label="外部端口"
          ><ElInput
            v-model="portForm.sport"
            placeholder="留空自动分配"
            @input="schedulePortCandidates"
          /><div v-if="portCandidates.length" class="candidate-list"
            ><ElTag
              v-for="candidate in portCandidates"
              :key="candidate"
              effect="plain"
              @click="portForm.sport = String(candidate)"
              >{{ candidate }}</ElTag
            ></div
          ></ElFormItem
        ><ElFormItem label="内部端口"
          ><ElInputNumber
            v-model="portForm.dport"
            :min="1"
            :max="65535"
            class="full-width" /></ElFormItem
      ></ElForm>
      <template #footer
        ><ElButton @click="portOpen = false">取消</ElButton
        ><ElButton type="primary" :loading="submitting" @click="submitPort"
          >保存</ElButton
        ></template
      >
    </ElDialog>

    <ElDialog v-model="refundOpen" title="申请退款" width="min(480px, calc(100vw - 32px))">
      <ElAlert
        title="审核通过后实例将被释放，数据无法恢复。"
        type="warning"
        show-icon
        :closable="false"
      />
      <ElForm label-position="top" class="dialog-form"
        ><ElFormItem label="退款原因"
          ><ElInput
            v-model="refundReason"
            type="textarea"
            :rows="4"
            :maxlength="INPUT_LIMITS.REFUND_REASON"
            show-word-limit /></ElFormItem
      ></ElForm>
      <template #footer
        ><ElButton @click="refundOpen = false">取消</ElButton
        ><ElButton type="danger" :loading="refunding" @click="submitRefund"
          >提交申请</ElButton
        ></template
      >
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import dayjs from 'dayjs'
  import SectionHeading from './modules/section-heading.vue'
  import {
    ArrowLeft,
    CopyDocument,
    Hide,
    Link,
    MoreFilled,
    Plus,
    Refresh,
    RefreshLeft,
    RefreshRight,
    SwitchButton,
    VideoCamera,
    VideoPlay,
    View
  } from '@element-plus/icons-vue'
  import { useAuthStore } from '@/stores/auth'
  import { useCatalogStore } from '@/stores/catalog'
  import { useSiteStore } from '@/stores/site'
  import { useVpsStore } from '@/stores/vps'
  import { INPUT_LIMITS } from '@/constants/inputLimits'
  import {
    addVpsFirewallRule,
    addVpsPortMapping,
    createVpsBackup,
    createVpsRenewOrder,
    createVpsResizeOrder,
    createVpsSnapshot,
    deleteVpsBackup,
    deleteVpsFirewallRule,
    deleteVpsPortMapping,
    deleteVpsSnapshot,
    emergencyRenewVps,
    getVpsBackups,
    getVpsFirewallRules,
    getVpsMonitor,
    getVpsPortCandidates,
    getVpsPortMappings,
    getVpsSnapshots,
    listSystemImages,
    quoteVpsResizeOrder,
    rebootVps,
    requestVpsRefund,
    resetVpsOS,
    resetVpsOsPassword,
    restoreVpsBackup,
    restoreVpsSnapshot,
    shutdownVps,
    startVps
  } from '@/services/user'

  defineOptions({ name: 'ConsoleVpsDetail' })

  type AnyRecord = Record<string, any>
  type Series = { labels: string[]; values: number[] }

  const route = useRoute()
  const router = useRouter()
  const store = useVpsStore()
  const catalog = useCatalogStore()
  const auth = useAuthStore()
  const site = useSiteStore()
  const id = computed(() => String(route.params.id || ''))
  const loading = ref(true)
  const submitting = ref(false)
  const activeTab = ref('overview')

  const detail = computed<AnyRecord | null>(() => {
    const row = store.current as AnyRecord | null
    if (!row) return null
    return {
      ...row,
      id: row.id ?? row.ID,
      name: row.name ?? row.Name,
      status: row.status ?? row.Status,
      automation_state: row.automation_state ?? row.AutomationState,
      region: row.region ?? row.Region,
      expire_at: row.expire_at ?? row.ExpireAt,
      created_at: row.created_at ?? row.CreatedAt,
      spec: row.spec ?? row.Spec ?? row.spec_json ?? row.SpecJSON,
      access_info: row.access_info ?? row.AccessInfo ?? row.access_info_json ?? row.AccessInfoJSON,
      monthly_price: row.monthly_price ?? row.MonthlyPrice ?? 0,
      capabilities: row.capabilities ?? row.Capabilities,
      last_emergency_renew_at: row.last_emergency_renew_at ?? row.LastEmergencyRenewAt,
      system_id: row.system_id ?? row.SystemID,
      package_id: row.package_id ?? row.PackageID,
      line_id: row.line_id ?? row.LineID,
      destroy_in_days: row.destroy_in_days ?? row.DestroyInDays
    }
  })

  const parseJson = (value: unknown): AnyRecord => {
    if (!value) return {}
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return {}
      }
    }
    return typeof value === 'object' ? (value as AnyRecord) : {}
  }
  const spec = computed(() => {
    const value = parseJson(detail.value?.spec)
    const fallback = detail.value || {}
    return {
      cpu:
        value.cpu ?? value.cores ?? value.CPU ?? value.Cores ?? fallback.cpu ?? fallback.CPU ?? 0,
      memory_gb:
        value.memory_gb ??
        value.mem_gb ??
        value.MemoryGB ??
        fallback.memory_gb ??
        fallback.MemoryGB ??
        0,
      disk_gb: value.disk_gb ?? value.DiskGB ?? fallback.disk_gb ?? fallback.DiskGB ?? 0,
      bandwidth_mbps:
        value.bandwidth_mbps ??
        value.BandwidthMB ??
        value.bandwidth ??
        fallback.bandwidth_mbps ??
        fallback.BandwidthMB
    }
  })
  const access = computed(() => {
    const info = parseJson(detail.value?.access_info)
    return {
      remote_ip: info.remote_ip || info.ip || info.public_ip || info.ipv4 || info.Ip || '',
      remote_port: info.remote_port || info.port || info.ssh_port || info.Port || '',
      os_password: info.os_password || info.password || info.pass || info.Password || '',
      panel_password: info.panel_password || info.panelPassword || ''
    }
  })

  const normalizeFeature = (value: unknown) => {
    const feature = String(value || '')
      .trim()
      .toLowerCase()
    if (['upgrade', 'downgrade'].includes(feature)) return 'resize'
    if (feature === 'refund_request') return 'refund'
    return feature
  }
  const featureSet = computed(() => {
    const features = detail.value?.capabilities?.automation?.features
    return Array.isArray(features) ? new Set(features.map(normalizeFeature).filter(Boolean)) : null
  })
  const supportsFeature = (...features: string[]) =>
    !featureSet.value ||
    features.some((feature) => featureSet.value?.has(normalizeFeature(feature)))
  const showFirewallTab = computed(() => supportsFeature('firewall'))
  const showPortTab = computed(() => supportsFeature('port_mapping'))
  const showSnapshotTab = computed(() => supportsFeature('snapshot'))
  const showBackupTab = computed(() => supportsFeature('backup'))
  const resizeEnabled = computed(
    () => site.settings?.resize_enabled !== false && supportsFeature('resize')
  )
  const refundEnabled = computed(() => supportsFeature('refund'))
  const unsupportedFeatureHints = computed(() => {
    if (!featureSet.value) return []
    const reasons = detail.value?.capabilities?.automation?.not_supported_reasons || {}
    return [
      ['firewall', '防火墙', showFirewallTab.value],
      ['port_mapping', '端口映射', showPortTab.value],
      ['snapshot', '快照', showSnapshotTab.value],
      ['backup', '备份', showBackupTab.value],
      ['resize', '升降配', resizeEnabled.value],
      ['refund', '退款', refundEnabled.value]
    ]
      .filter((item) => !item[2])
      .map((item) => ({
        key: String(item[0]),
        label: String(item[1]),
        reason: String(reasons[String(item[0])] || '当前实例不支持该能力')
      }))
  })
  const availableTabs = computed(() => [
    'overview',
    'monitor',
    ...(showFirewallTab.value ? ['firewall'] : []),
    ...(showPortTab.value ? ['port'] : []),
    ...(showSnapshotTab.value ? ['snapshot'] : []),
    ...(showBackupTab.value ? ['backup'] : [])
  ])

  const statusFromAutomation = (state: unknown) => {
    const statusMap: Record<number, string> = {
      1: 'provisioning',
      13: 'provisioning',
      2: 'running',
      3: 'stopped',
      4: 'reinstalling',
      5: 'reinstall_failed',
      10: 'locked',
      11: 'failed',
      12: 'deleting'
    }
    return statusMap[Number(state)] || ''
  }
  const isExpired = computed(() =>
    detail.value?.expire_at ? !dayjs(detail.value.expire_at).isAfter(dayjs()) : false
  )
  const resolvedStatus = computed(() => {
    const state = detail.value?.automation_state
    const status =
      state == null ? String(detail.value?.status || '').toLowerCase() : statusFromAutomation(state)
    return isExpired.value && ['locked', 'expired_locked'].includes(status)
      ? 'expired_locked'
      : status
  })
  const canStart = computed(() => ['stopped', 'error', 'failed'].includes(resolvedStatus.value))
  const canShutdown = computed(() => resolvedStatus.value === 'running')
  const canReboot = computed(() => resolvedStatus.value === 'running')
  const isWindowsOS = computed(() => systemLabel.value.toLowerCase().includes('windows'))
  const systemLabel = computed(() => {
    const value = parseJson(detail.value?.spec)
    const label = value.system_name || value.os_name || value.os || value.image_name
    if (label) return String(label)
    const image = catalog.systemImages.find(
      (item: AnyRecord) => String(item.id ?? item.image_id) === String(detail.value?.system_id)
    )
    return image?.name || (detail.value?.system_id ? `系统 ID ${detail.value.system_id}` : '-')
  })
  const connectCommand = computed(() => {
    const host = access.value.remote_ip || 'x.x.x.x'
    const port = String(access.value.remote_port || (isWindowsOS.value ? 3389 : 22))
    return isWindowsOS.value ? `mstsc.exe /v:${host}:${port}` : `ssh root@${host} -p ${port}`
  })
  const isExpiringSoon = computed(() =>
    detail.value?.expire_at ? dayjs(detail.value.expire_at).diff(dayjs(), 'day') <= 7 : false
  )
  const remainingDays = computed(() => {
    if (!detail.value?.expire_at) return '-'
    const days = dayjs(detail.value.expire_at).diff(dayjs(), 'day')
    return days < 0 ? '已过期' : days === 0 ? '今天到期' : `${days} 天`
  })
  const emergencyRenewEligible = computed(() => {
    if (
      !detail.value?.expire_at ||
      isExpired.value ||
      site.settings?.emergency_renew_enabled === false
    )
      return false
    const windowDays =
      Number.parseInt(String(site.settings?.emergency_renew_window_days ?? 7), 10) || 7
    const intervalHours =
      Number.parseInt(String(site.settings?.emergency_renew_interval_hours ?? 720), 10) || 720
    if (dayjs().isBefore(dayjs(detail.value.expire_at).subtract(windowDays, 'day'))) return false
    return (
      !detail.value.last_emergency_renew_at ||
      dayjs().diff(dayjs(detail.value.last_emergency_renew_at), 'hour', true) >= intervalHours
    )
  })

  const createSeries = (): Series => ({ labels: [], values: [] })
  const monitor = reactive({
    cpu: createSeries(),
    memory: createSeries(),
    trafficIn: createSeries(),
    trafficOut: createSeries()
  })
  const monitorLoading = ref(false)
  const pushPoint = (series: Series, value: unknown) => {
    series.labels.push(new Date().toLocaleTimeString('zh-CN', { hour12: false }))
    series.values.push(Number(value || 0))
    if (series.labels.length > 20) {
      series.labels.shift()
      series.values.shift()
    }
  }
  const currentCpu = computed(() => monitor.cpu.values.at(-1) || 0)
  const currentMemory = computed(() => monitor.memory.values.at(-1) || 0)
  const currentTrafficIn = computed(() => monitor.trafficIn.values.at(-1) || 0)
  const currentTrafficOut = computed(() => monitor.trafficOut.values.at(-1) || 0)
  const metricClass = (value: number) =>
    value >= 90 ? 'danger' : value >= 70 ? 'warning' : 'normal'
  const monitorCharts = computed(() => [
    { key: 'cpu', title: 'CPU', subtitle: '使用率 (%)', series: monitor.cpu },
    { key: 'memory', title: '内存', subtitle: '使用率 (%)', series: monitor.memory },
    { key: 'trafficIn', title: '网络入站', subtitle: '传输速度 (KB/s)', series: monitor.trafficIn },
    {
      key: 'trafficOut',
      title: '网络出站',
      subtitle: '传输速度 (KB/s)',
      series: monitor.trafficOut
    }
  ])
  const fetchMonitor = async () => {
    monitorLoading.value = true
    try {
      const response = await getVpsMonitor(id.value)
      const value: AnyRecord = response.data || {}
      pushPoint(monitor.cpu, value.cpu)
      pushPoint(monitor.memory, value.memory)
      pushPoint(
        monitor.trafficIn,
        Math.round(Number(value.bytes_in ?? value.in_bytes ?? value.rx_bytes ?? 0) / 1024)
      )
      pushPoint(
        monitor.trafficOut,
        Math.round(Number(value.bytes_out ?? value.out_bytes ?? value.tx_bytes ?? 0) / 1024)
      )
    } finally {
      monitorLoading.value = false
    }
  }

  const normalizeItems = (response: any) => {
    const value = response?.data?.data ?? response?.data?.items ?? response?.data ?? response ?? []
    return Array.isArray(value) ? value : []
  }
  type StateMeta = { label: string; type: 'success' | 'warning' | 'danger' | 'info' }
  const stateMeta = (state: unknown): StateMeta => {
    const stateMap: Record<number, StateMeta> = {
      1: { label: '创建中', type: 'warning' },
      2: { label: '创建成功', type: 'success' },
      3: { label: '创建失败', type: 'danger' },
      4: { label: '恢复中', type: 'warning' },
      5: { label: '删除中', type: 'warning' }
    }
    return stateMap[Number(state)] || { label: '未知', type: 'info' }
  }
  const normalizeStateItem = (item: AnyRecord, prefix: string) => {
    const itemId = item.id ?? item.ID ?? item[`${prefix}_id`] ?? item.virtuals_id
    const meta = stateMeta(item.state ?? item.State)
    return {
      id: itemId,
      name: item.name ?? item.Name ?? `${prefix}-${itemId || '-'}`,
      state_label: meta.label,
      state_type: meta.type,
      created_at: item.created_at ?? item.create_time ?? item.createdAt
    }
  }
  const firewallRules = ref<AnyRecord[]>([])
  const portMappings = ref<AnyRecord[]>([])
  const snapshots = ref<AnyRecord[]>([])
  const backups = ref<AnyRecord[]>([])
  const firewallLoading = ref(false)
  const portLoading = ref(false)
  const snapshotLoading = ref(false)
  const backupLoading = ref(false)
  const fetchFirewall = async () => {
    firewallLoading.value = true
    try {
      firewallRules.value = normalizeItems(await getVpsFirewallRules(id.value)).map((item) => ({
        id: item.id ?? item.ID ?? item.rule_id,
        direction: item.direction ?? item.Direction,
        protocol: item.protocol ?? item.Protocol,
        port: item.port ?? item.Port ?? item.start_port,
        ip: item.ip ?? item.IP ?? item.start_ip,
        method: item.method ?? item.Method
      }))
    } finally {
      firewallLoading.value = false
    }
  }
  const fetchPorts = async () => {
    portLoading.value = true
    try {
      portMappings.value = normalizeItems(await getVpsPortMappings(id.value)).map((item) => ({
        id: item.id ?? item.ID ?? item.port_id,
        name: item.name ?? item.Name ?? item.remark,
        sport: item.sport ?? item.Sport ?? item.source_port,
        dport: item.dport ?? item.Dport ?? item.target_port,
        api_url: item.api_url ?? item.apiUrl ?? item.ApiUrl,
        sys: item.sys ?? item.Sys
      }))
    } finally {
      portLoading.value = false
    }
  }
  const fetchSnapshots = async () => {
    snapshotLoading.value = true
    try {
      snapshots.value = normalizeItems(await getVpsSnapshots(id.value)).map((item) =>
        normalizeStateItem(item, 'snapshot')
      )
    } finally {
      snapshotLoading.value = false
    }
  }
  const fetchBackups = async () => {
    backupLoading.value = true
    try {
      backups.value = normalizeItems(await getVpsBackups(id.value)).map((item) =>
        normalizeStateItem(item, 'backup')
      )
    } finally {
      backupLoading.value = false
    }
  }

  const base = import.meta.env.VITE_API_BASE || ''
  const openExternal = (path: string) => {
    const query = auth.token ? `?token=${encodeURIComponent(auth.token)}` : ''
    window.open(`${base}/api/v1/vps/${id.value}/${path}${query}`, '_blank', 'noopener')
  }
  const openPanel = () => openExternal('panel')
  const openVnc = () => openExternal('vnc')
  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    ElMessage.success(`已复制${label}`)
  }
  const formatDateTime = (value: unknown) =>
    value ? dayjs(String(value)).format('YYYY-MM-DD HH:mm') : '-'
  const errorText = (error: any, fallback: string) =>
    error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback
  const withSubmit = async (action: () => Promise<unknown>) => {
    submitting.value = true
    try {
      await action()
    } finally {
      submitting.value = false
    }
  }
  const confirmAction = async (title: string, action: () => Promise<void>) => {
    try {
      await ElMessageBox.confirm(`确认执行“${title}”？`, title, { type: 'warning' })
      await action()
    } catch (error) {
      if (error !== 'cancel' && error !== 'close') ElMessage.error(errorText(error, `${title}失败`))
    }
  }
  const runPowerAction = (title: string, action: (value: string) => Promise<unknown>) =>
    confirmAction(title, async () => {
      await action(id.value)
      ElMessage.success('操作已提交')
      await refresh()
    })

  const firewallOpen = ref(false)
  const portOpen = ref(false)
  const resetPasswordOpen = ref(false)
  const reinstallOpen = ref(false)
  const renewOpen = ref(false)
  const resizeOpen = ref(false)
  const refundOpen = ref(false)
  const reinstalling = ref(false)
  const renewing = ref(false)
  const resizing = ref(false)
  const refunding = ref(false)
  const showOsPassword = ref(false)
  const showPanelPassword = ref(false)
  const firewallForm = reactive({
    direction: 'In',
    protocol: 'tcp',
    method: 'allowed',
    port: '',
    ip: '0.0.0.0',
    priority: 100
  })
  const portForm = reactive({ name: '', sport: '', dport: 22 })
  const resetPasswordForm = reactive({ password: '' })
  const reinstallForm = reactive({ template_id: null as number | string | null, password: '' })
  const reinstallImages = ref<AnyRecord[]>([])
  const renewForm = reactive({ cycleId: null as number | null, cycleQty: 1 })
  const resizeForm = reactive<AnyRecord>({
    add_cores: 0,
    add_mem_gb: 0,
    add_disk_gb: 0,
    add_bw_mbps: 0,
    target_package_id: null,
    reset_addons: false,
    schedule_mode: 'now',
    scheduled_at: null
  })
  const refundReason = ref('')
  const portCandidates = ref<Array<string | number>>([])

  const openFirewall = () => {
    Object.assign(firewallForm, {
      direction: 'In',
      protocol: 'tcp',
      method: 'allowed',
      port: '',
      ip: '0.0.0.0',
      priority: 100
    })
    firewallOpen.value = true
  }
  const submitFirewall = () =>
    withSubmit(async () => {
      if (!firewallForm.port || !firewallForm.ip) return ElMessage.warning('请填写端口和 IP 地址')
      await addVpsFirewallRule(id.value, { ...firewallForm })
      firewallOpen.value = false
      await fetchFirewall()
      ElMessage.success('规则已添加')
    })
  const removeFirewall = (row: AnyRecord) =>
    confirmAction('删除防火墙规则', async () => {
      await deleteVpsFirewallRule(id.value, row.id)
      await fetchFirewall()
      ElMessage.success('规则已删除')
    })
  const openPort = () => {
    Object.assign(portForm, { name: '', sport: '', dport: 22 })
    portCandidates.value = []
    portOpen.value = true
    fetchPortCandidates('')
  }
  const fetchPortCandidates = async (keywords: string) => {
    try {
      portCandidates.value = normalizeItems(await getVpsPortCandidates(id.value, { keywords }))
    } catch {
      portCandidates.value = []
    }
  }
  let portCandidateTimer: ReturnType<typeof setTimeout> | null = null
  const schedulePortCandidates = (value: string) => {
    if (portCandidateTimer) clearTimeout(portCandidateTimer)
    portCandidateTimer = setTimeout(() => fetchPortCandidates(value), 300)
  }
  const submitPort = () =>
    withSubmit(async () => {
      if (!portForm.dport) return ElMessage.warning('请输入内部端口')
      await addVpsPortMapping(id.value, {
        name: portForm.name,
        sport: String(portForm.sport).trim(),
        dport: Number(portForm.dport)
      })
      portOpen.value = false
      await fetchPorts()
      ElMessage.success('映射已添加')
    })
  const isProtectedPort = (row: AnyRecord) =>
    ['ssh', '远程桌面'].includes(String(row.name || '').toLowerCase())
  const formatPortExternal = (row: AnyRecord) =>
    row.api_url && row.sport ? `${row.api_url}:${row.sport}` : row.api_url || row.sport || '-'
  const removePort = (row: AnyRecord) =>
    confirmAction('删除端口映射', async () => {
      await deleteVpsPortMapping(id.value, row.id)
      await fetchPorts()
      ElMessage.success('映射已删除')
    })
  const createSnapshot = async () => {
    snapshotLoading.value = true
    try {
      await createVpsSnapshot(id.value)
      await fetchSnapshots()
      ElMessage.success('快照任务已提交')
    } finally {
      snapshotLoading.value = false
    }
  }
  const restoreSnapshot = (row: AnyRecord) =>
    confirmAction('恢复快照', async () => {
      await restoreVpsSnapshot(id.value, row.id)
      ElMessage.success('恢复任务已提交')
    })
  const removeSnapshot = (row: AnyRecord) =>
    confirmAction('删除快照', async () => {
      await deleteVpsSnapshot(id.value, row.id)
      await fetchSnapshots()
      ElMessage.success('快照已删除')
    })
  const createBackup = async () => {
    backupLoading.value = true
    try {
      await createVpsBackup(id.value)
      await fetchBackups()
      ElMessage.success('备份任务已提交')
    } finally {
      backupLoading.value = false
    }
  }
  const restoreBackup = (row: AnyRecord) =>
    confirmAction('恢复备份', async () => {
      await restoreVpsBackup(id.value, row.id)
      ElMessage.success('恢复任务已提交')
    })
  const removeBackup = (row: AnyRecord) =>
    confirmAction('删除备份', async () => {
      await deleteVpsBackup(id.value, row.id)
      await fetchBackups()
      ElMessage.success('备份已删除')
    })

  const generatePassword = () => {
    const groups = ['abcdefghjkmnpqrstuvwxyz', 'ABCDEFGHJKMNPQRSTUVWXYZ', '23456789', '!@$%^&*']
    const pick = (value: string) => value[Math.floor(Math.random() * value.length)]
    const result = groups.map(pick)
    const all = groups.join('')
    while (result.length < 12) result.push(pick(all))
    return result.sort(() => Math.random() - 0.5).join('')
  }
  const openResetPassword = () => {
    resetPasswordForm.password = access.value.os_password
    resetPasswordOpen.value = true
  }
  const submitResetPassword = () =>
    withSubmit(async () => {
      if (!resetPasswordForm.password) return ElMessage.warning('请输入新密码')
      await resetVpsOsPassword(id.value, { password: resetPasswordForm.password })
      resetPasswordOpen.value = false
      ElMessage.success('密码重置任务已提交')
    })
  const openReinstall = async () => {
    try {
      const response = await listSystemImages(
        detail.value?.line_id ? { line_id: Number(detail.value.line_id) } : undefined
      )
      reinstallImages.value = (response.data?.items || []).map((item: AnyRecord) => ({
        id: item.image_id ?? item.ImageID ?? item.id,
        name: item.name ?? item.Name ?? '未命名镜像'
      }))
      if (!reinstallImages.value.length) return ElMessage.warning('当前线路暂无可用镜像')
      Object.assign(reinstallForm, {
        template_id: reinstallImages.value[0].id,
        password: access.value.os_password || generatePassword()
      })
      reinstallOpen.value = true
    } catch (error) {
      ElMessage.error(errorText(error, '获取镜像失败'))
    }
  }
  const submitReinstall = async () => {
    if (!reinstallForm.template_id || !reinstallForm.password)
      return ElMessage.warning('请选择镜像并填写密码')
    reinstalling.value = true
    try {
      await resetVpsOS(id.value, {
        template_id: reinstallForm.template_id,
        password: reinstallForm.password
      })
      reinstallOpen.value = false
      ElMessage.success('已放入重装队列')
    } catch (error) {
      ElMessage.error(errorText(error, '重装失败'))
    } finally {
      reinstalling.value = false
    }
  }

  const billingCycles = computed(() =>
    catalog.billingCycles.length
      ? catalog.billingCycles.filter((item: AnyRecord) => item.active !== false)
      : [{ id: 1, name: '按月', months: 1 }]
  )
  const renewMonths = computed(
    () =>
      Number(
        billingCycles.value.find((item: AnyRecord) => item.id === renewForm.cycleId)?.months || 1
      ) * renewForm.cycleQty
  )
  const openRenew = () => {
    renewForm.cycleId = billingCycles.value[0]?.id ?? null
    renewForm.cycleQty = 1
    renewOpen.value = true
  }
  const submitRenew = async () => {
    renewing.value = true
    try {
      await createVpsRenewOrder(id.value, { duration_months: renewMonths.value })
      renewOpen.value = false
      ElMessage.success('续费订单已创建')
    } catch (error) {
      ElMessage.error(errorText(error, '续费失败'))
    } finally {
      renewing.value = false
    }
  }
  const submitEmergencyRenew = () =>
    confirmAction('紧急续费', async () => {
      await emergencyRenewVps(id.value)
      ElMessage.success('紧急续费已提交')
      await refresh()
    })

  const currentAddons = computed(() => {
    const value = parseJson(detail.value?.spec)
    return {
      add_cores: Number(value.add_cores ?? value.AddCores ?? 0),
      add_mem_gb: Number(value.add_mem_gb ?? value.AddMemGB ?? 0),
      add_disk_gb: Number(value.add_disk_gb ?? value.AddDiskGB ?? 0),
      add_bw_mbps: Number(value.add_bw_mbps ?? value.AddBWMbps ?? 0)
    }
  })
  const currentPackage = computed(
    () =>
      catalog.packages.find(
        (item: AnyRecord) => String(item.id) === String(detail.value?.package_id)
      ) || null
  )
  const currentPlanGroup = computed(
    () =>
      catalog.planGroups.find(
        (item: AnyRecord) => String(item.id) === String(currentPackage.value?.plan_group_id)
      ) || null
  )
  const packageOptions = computed(() =>
    catalog.packages.filter(
      (item: AnyRecord) =>
        String(item.plan_group_id) === String(currentPlanGroup.value?.id) &&
        item.active !== false &&
        item.visible !== false
    )
  )
  const addonFields = [
    { key: 'add_cores', label: 'CPU 附加' },
    { key: 'add_mem_gb', label: '内存附加 GB' },
    { key: 'add_disk_gb', label: '磁盘附加 GB' },
    { key: 'add_bw_mbps', label: '带宽附加 Mbps' }
  ] as const
  const addonMin = computed(() => ({ add_cores: 0, add_mem_gb: 0, add_disk_gb: 0, add_bw_mbps: 0 }))
  const addonMax = computed(() => ({
    add_cores: currentPlanGroup.value?.add_core_max ?? 64,
    add_mem_gb: currentPlanGroup.value?.add_mem_max ?? 256,
    add_disk_gb: currentPlanGroup.value?.add_disk_max ?? 2000,
    add_bw_mbps: currentPlanGroup.value?.add_bw_max ?? 1000
  }))
  const addonStep = computed(() => ({
    add_cores: currentPlanGroup.value?.add_core_step ?? 1,
    add_mem_gb: currentPlanGroup.value?.add_mem_step ?? 1,
    add_disk_gb: currentPlanGroup.value?.add_disk_step ?? 10,
    add_bw_mbps: currentPlanGroup.value?.add_bw_step ?? 10
  }))
  const isSameTargetSelection = computed(
    () =>
      String(resizeForm.target_package_id) === String(currentPackage.value?.id) &&
      addonFields.every(({ key }) => Number(resizeForm[key]) === Number(currentAddons.value[key]))
  )
  const resizeQuote = ref<AnyRecord | null>(null)
  const resizeQuoteLoading = ref(false)
  const resizeQuoteError = ref('')
  const resizeQuoteAmount = computed(() =>
    Number(resizeQuote.value?.charge_amount ?? resizeQuote.value?.chargeAmount ?? 0)
  )
  const buildResizePayload = () => ({
    target_package_id: resizeForm.target_package_id,
    reset_addons: resizeForm.reset_addons,
    spec: resizeForm.reset_addons
      ? { add_cores: 0, add_mem_gb: 0, add_disk_gb: 0, add_bw_mbps: 0 }
      : Object.fromEntries(addonFields.map(({ key }) => [key, resizeForm[key]])),
    ...(resizeForm.schedule_mode === 'scheduled' && resizeForm.scheduled_at
      ? { scheduled_at: dayjs(resizeForm.scheduled_at).format('YYYY-MM-DD HH:mm:ss') }
      : {})
  })
  const openResize = () => {
    if (isExpired.value) return ElMessage.warning('已到期实例不支持升降配')
    Object.assign(resizeForm, currentAddons.value, {
      target_package_id: currentPackage.value?.id ?? null,
      reset_addons: false,
      schedule_mode: 'now',
      scheduled_at: null
    })
    resizeQuote.value = null
    resizeQuoteError.value = ''
    resizeOpen.value = true
  }
  const fetchResizeQuote = async () => {
    if (!resizeOpen.value || !resizeForm.target_package_id || isSameTargetSelection.value) {
      resizeQuote.value = null
      return
    }
    resizeQuoteLoading.value = true
    try {
      const response = await quoteVpsResizeOrder(id.value, buildResizePayload())
      resizeQuote.value = response.data?.quote ?? response.data
      resizeQuoteError.value = ''
    } catch (error) {
      resizeQuote.value = null
      resizeQuoteError.value = errorText(error, '报价失败')
    } finally {
      resizeQuoteLoading.value = false
    }
  }
  let resizeQuoteTimer: ReturnType<typeof setTimeout> | null = null
  const scheduleResizeQuote = () => {
    if (resizeQuoteTimer) clearTimeout(resizeQuoteTimer)
    resizeQuoteTimer = setTimeout(fetchResizeQuote, 300)
  }
  const submitResize = async () => {
    if (!resizeForm.target_package_id || isSameTargetSelection.value)
      return ElMessage.warning('请选择不同的目标配置')
    if (
      resizeForm.schedule_mode === 'scheduled' &&
      (!resizeForm.scheduled_at || dayjs(resizeForm.scheduled_at).isBefore(dayjs()))
    )
      return ElMessage.warning('请选择晚于当前时间的执行时间')
    resizing.value = true
    try {
      const response = await createVpsResizeOrder(id.value, buildResizePayload())
      resizeOpen.value = false
      ElMessage.success('升降配订单已创建')
      const orderId = response.data?.order?.id ?? response.data?.id
      if (orderId) router.push(`/console/orders/${orderId}`)
    } catch (error) {
      ElMessage.error(errorText(error, '升降配失败'))
    } finally {
      resizing.value = false
    }
  }
  const openRefund = () => {
    refundReason.value = ''
    refundOpen.value = true
  }
  const submitRefund = async () => {
    if (!refundReason.value.trim()) return ElMessage.warning('请填写退款原因')
    refunding.value = true
    try {
      await requestVpsRefund(id.value, { reason: refundReason.value.trim() })
      refundOpen.value = false
      ElMessage.success('退款申请已提交')
    } catch (error) {
      ElMessage.error(errorText(error, '退款申请失败'))
    } finally {
      refunding.value = false
    }
  }
  const handleHeaderCommand = (command: string) => {
    const commands: Record<string, () => unknown> = {
      renew: openRenew,
      'emergency-renew': submitEmergencyRenew,
      'reset-password': openResetPassword,
      reinstall: openReinstall,
      resize: openResize,
      refund: openRefund
    }
    commands[command]?.()
  }

  const refresh = async () => {
    loading.value = true
    try {
      await store.refresh(id.value)
      await fetchMonitor()
      ElMessage.success('已刷新')
    } catch (error) {
      ElMessage.error(errorText(error, '刷新失败'))
    } finally {
      loading.value = false
    }
  }
  watch(
    availableTabs,
    (tabs) => {
      if (!tabs.includes(activeTab.value)) activeTab.value = 'overview'
    },
    { immediate: true }
  )
  watch(activeTab, (tab) => {
    if (tab === 'firewall') fetchFirewall()
    if (tab === 'port') fetchPorts()
    if (tab === 'snapshot') fetchSnapshots()
    if (tab === 'backup') fetchBackups()
  })
  watch(
    () => [
      resizeForm.target_package_id,
      ...addonFields.map(({ key }) => resizeForm[key]),
      resizeForm.reset_addons
    ],
    () => {
      if (resizeOpen.value) scheduleResizeQuote()
    }
  )

  let monitorTimer: ReturnType<typeof setInterval> | null = null
  onMounted(async () => {
    loading.value = true
    try {
      await Promise.all([catalog.fetchCatalog(), site.fetchSettings(), store.fetchDetail(id.value)])
      await fetchMonitor()
      monitorTimer = setInterval(fetchMonitor, 10000)
    } finally {
      loading.value = false
    }
  })
  onBeforeUnmount(() => {
    if (monitorTimer) clearInterval(monitorTimer)
    if (resizeQuoteTimer) clearTimeout(resizeQuoteTimer)
    if (portCandidateTimer) clearTimeout(portCandidateTimer)
  })
</script>

<style scoped lang="scss">
  .vps-detail-page {
    gap: 16px;
    overflow: auto;
  }

  .page-heading {
    display: flex;
    gap: 20px;
    align-items: flex-end;
    justify-content: space-between;
    padding-top: 4px;
  }

  .heading-copy {
    min-width: 0;
  }

  .title-row {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 4px;
  }

  .title-row h1 {
    margin: 0;
    overflow: hidden;
    font-size: 24px;
    font-weight: 700;
    color: var(--art-gray-900);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .instance-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 10px;
    font-size: 12px;
    color: var(--art-gray-600);
  }

  .heading-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }

  .capability-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .detail-tabs {
    flex: 1;
    min-height: 0;
  }

  .overview-grid,
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .content-card {
    background: var(--default-box-color);
    border: 1px solid var(--art-card-border);
  }

  .inline-copy {
    display: inline-flex;
    gap: 3px;
    align-items: center;
    max-width: 100%;
  }

  .secret {
    min-width: 80px;
    font-family: var(--el-font-family-monospace);
  }

  .command-copy code {
    padding: 4px 7px;
    overflow: hidden;
    color: var(--art-gray-800);
    text-overflow: ellipsis;
    white-space: nowrap;
    background: var(--art-gray-200);
    border-radius: 4px;
  }

  .monitor-summary {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .monitor-item > div,
  .network-summary {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  .monitor-item span,
  .network-summary span,
  .lifecycle-grid span {
    font-size: 12px;
    color: var(--art-gray-600);
  }

  .monitor-item strong,
  .network-summary strong,
  .lifecycle-grid strong {
    color: var(--art-gray-900);
  }

  .network-summary > div {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .lifecycle-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .lifecycle-grid > div {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .lifecycle-actions,
  .power-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 16px;
    margin-top: 22px;
    border-top: 1px solid var(--default-border);
  }

  .danger {
    color: var(--el-color-danger);
  }

  .warning {
    color: var(--el-color-warning);
  }

  .normal {
    color: var(--theme-color);
  }

  .tab-card {
    min-height: 360px;
  }

  .tab-toolbar {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .full-width {
    width: 100%;
  }

  .dialog-form {
    margin-top: 16px;
  }

  .input-action {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  .candidate-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .candidate-list .el-tag {
    cursor: pointer;
  }

  @media (width <= 980px) {
    .page-heading {
      flex-direction: column;
      align-items: flex-start;
    }

    .heading-actions {
      justify-content: flex-start;
    }

    .overview-grid,
    .charts-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (width <= 640px) {
    .vps-detail-page {
      height: auto;
      overflow: visible;
    }

    .heading-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      width: 100%;
    }

    .heading-actions .el-button {
      width: 100%;
    }

    .instance-meta {
      gap: 8px 12px;
    }

    .lifecycle-grid {
      grid-template-columns: 1fr;
    }

    .tab-toolbar {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
