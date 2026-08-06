<template>
  <div class="coupon-page art-full-height">
    <ArtSearchBar
      v-if="canView && activeTab === 'groups'"
      v-model="groupSearchForm"
      :items="groupSearchItems"
      :span="8"
      :show-expand="false"
      @search="handleGroupSearch"
      @reset="handleGroupReset"
    />
    <ArtSearchBar
      v-if="canView && activeTab === 'coupons'"
      v-model="couponSearchForm"
      :items="couponSearchItems"
      :span="8"
      :show-expand="false"
      @search="handleCouponSearch"
      @reset="handleCouponReset"
    />

    <ElCard shadow="never">
      <div class="page-header">
        <div>
          <div class="page-title">Coupons</div>
          <div class="page-subtitle">Manage coupon groups, coupon codes, and batch generation.</div>
        </div>

        <ElButton :loading="loading" @click="fetchAll">Refresh</ElButton>
      </div>

      <ElEmpty
        v-if="!canView"
        description="You do not have permission to view coupon management."
      />

      <ElTabs v-else v-model="activeTab">
        <ElTabPane label="Product Groups" name="groups">
          <ArtTableHeader
            v-model:columns="groupColumnChecks"
            :show-search-bar="false"
            :loading="groupLoading"
            @refresh="refreshGroups"
          >
            <template #left>
              <ElButton v-if="canManageGroups" type="primary" @click="openGroupDialog()">
                New Group
              </ElButton>
            </template>
          </ArtTableHeader>

          <ArtTable
            :loading="groupLoading"
            :data="groups"
            :columns="groupColumns"
            :pagination="groupPagination"
            row-key="id"
            @pagination:size-change="handleGroupSizeChange"
            @pagination:current-change="handleGroupCurrentChange"
          >
            <template #rules="{ row }">
              {{ row.rules.length }}
            </template>
            <template #preview="{ row }">
              {{ renderRulePreview(row.rules) }}
            </template>
            <template #operation="{ row }">
              <div class="table-actions">
                <ElButton
                  v-if="canManageGroups"
                  link
                  type="primary"
                  @click="openGroupDialog(row as CouponGroupRow)"
                >
                  Edit
                </ElButton>
                <ElButton
                  v-if="canManageGroups"
                  link
                  type="danger"
                  @click="removeGroup(row as CouponGroupRow)"
                >
                  Delete
                </ElButton>
              </div>
            </template>
          </ArtTable>
        </ElTabPane>

        <ElTabPane label="Coupons" name="coupons">
          <ArtTableHeader
            v-model:columns="couponColumnChecks"
            :show-search-bar="false"
            :loading="couponLoading"
            @refresh="refreshCoupons"
          >
            <template #left>
              <ElButton v-if="canManageCoupons" type="primary" @click="openCouponDialog()">
                New Coupon
              </ElButton>
              <ElButton v-if="canBatchGenerate" @click="openBatchDialog">Batch Generate</ElButton>
            </template>
          </ArtTableHeader>

          <ArtTable
            :loading="couponLoading"
            :data="coupons"
            :columns="couponColumns"
            :pagination="couponPagination"
            row-key="id"
            @pagination:size-change="handleCouponSizeChange"
            @pagination:current-change="handleCouponCurrentChange"
          >
            <template #discount="{ row }">
              {{ formatDiscount(row.discount_permille) }}
            </template>
            <template #group="{ row }">
              {{ resolveGroupName(row.product_group_id) }}
            </template>
            <template #policy="{ row }">
              {{ formatPolicy(row as CouponRow) }}
            </template>
            <template #new_user_only="{ row }">
              <ElTag :type="row.new_user_only ? 'warning' : 'info'">
                {{ row.new_user_only ? 'Yes' : 'No' }}
              </ElTag>
            </template>
            <template #active="{ row }">
              <ElTag :type="row.active ? 'success' : 'info'">
                {{ row.active ? 'Active' : 'Inactive' }}
              </ElTag>
            </template>
            <template #created_at="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
            <template #operation="{ row }">
              <div class="table-actions">
                <ElButton
                  v-if="canManageCoupons"
                  link
                  type="primary"
                  @click="openCouponDialog(row as CouponRow)"
                >
                  Edit
                </ElButton>
                <ElButton
                  v-if="canManageCoupons"
                  link
                  type="danger"
                  @click="removeCoupon(row as CouponRow)"
                >
                  Delete
                </ElButton>
              </div>
            </template>
          </ArtTable>
        </ElTabPane>
      </ElTabs>
    </ElCard>

    <CouponGroupDialog
      v-model:visible="groupDialogVisible"
      :form-data="groupForm"
      :goods-types="goodsTypes"
      :regions="regions"
      :plan-groups="planGroups"
      :packages="packages"
      :submitting="groupSubmitting"
      @submit="submitGroup"
    />

    <CouponDialog
      v-model:visible="couponDialogVisible"
      :form-data="couponForm"
      :group-options="groupOptions"
      :submitting="couponSubmitting"
      @submit="submitCoupon"
    />

    <CouponBatchDialog
      v-model:visible="batchDialogVisible"
      :form-data="batchForm"
      :group-options="groupOptions"
      :submitting="batchSubmitting"
      @submit="submitBatch"
    />
  </div>
</template>

<script setup lang="ts">
  import type {
    CatalogGoodsType,
    CatalogPackage,
    CatalogPlanGroup,
    CatalogRegion,
    CouponProductGroupRecord,
    CouponRecord
  } from '@/services/admin'
  import { useTable } from '@/hooks/core/useTable'
  import {
    batchGenerateAdminCoupons,
    createAdminCoupon,
    createAdminCouponGroup,
    deleteAdminCoupon,
    deleteAdminCouponGroup,
    fetchAdminCouponGroups,
    fetchAdminCoupons,
    fetchAdminGoodsTypes,
    fetchAdminPackages,
    fetchAdminPlanGroups,
    fetchAdminRegions,
    hasAdminPermission,
    updateAdminCoupon,
    updateAdminCouponGroup
  } from '@/services/admin'
  import { useAdminAuthStore } from '@/stores/adminAuth'
  import { INPUT_LIMITS } from '@/constants/inputLimits'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import CouponBatchDialog from './modules/coupon-batch-dialog.vue'
  import CouponDialog from './modules/coupon-dialog.vue'
  import CouponGroupDialog from './modules/coupon-group-dialog.vue'

  defineOptions({ name: 'MarketingCoupons' })

  interface GoodsTypeOptionRow {
    id: number | null
    name: string
  }

  interface RegionOptionRow {
    id: number | null
    name: string
    goods_type_id: number | null
  }

  interface PlanGroupOptionRow {
    id: number | null
    name: string
    goods_type_id: number | null
    region_id: number | null
  }

  interface PackageOptionRow {
    id: number | null
    name: string
    plan_group_id: number | null
  }

  interface CouponRuleFormValue {
    scope: string
    goods_type_id: number | null
    region_id: number | null
    plan_group_id: number | null
    package_id: number | null
    addon_core_enabled: boolean
    addon_mem_enabled: boolean
    addon_disk_enabled: boolean
    addon_bw_enabled: boolean
  }

  interface CouponGroupRow {
    id: number | null
    name: string
    rules: CouponRuleFormValue[]
  }

  interface CouponRow {
    id: number | null
    code: string
    discount_permille: number
    product_group_id: number | null
    total_limit: number
    per_user_limit: number
    new_user_only: boolean
    active: boolean
    note: string
    created_at: string
    updated_at: string
  }

  interface GroupTableParams extends Api.Common.CommonSearchParams {
    keyword: string
  }

  interface CouponTableParams extends Api.Common.CommonSearchParams {
    keyword: string
    product_group_id: number | null
    active: 'active' | 'inactive' | null
  }

  interface CouponGroupFormValue {
    id: number | null
    name: string
    rules: CouponRuleFormValue[]
  }

  interface CouponFormValue {
    id: number | null
    code: string
    discount_permille: number
    product_group_id: number | null
    total_limit: number
    per_user_limit: number
    new_user_only: boolean
    active: boolean
    note: string
  }

  interface CouponBatchFormValue {
    prefix: string
    count: number
    length: number
    discount_permille: number
    product_group_id: number | null
    total_limit: number
    per_user_limit: number
    new_user_only: boolean
    active: boolean
    note: string
  }

  interface SelectOption {
    label: string
    value: number
  }

  const scopeOptions = [
    { label: 'All Products', value: 'all' },
    { label: 'All Addons', value: 'all_addons' },
    { label: 'Goods Type', value: 'goods_type' },
    { label: 'Goods Type + Region', value: 'goods_type_region' },
    { label: 'Plan Group', value: 'plan_group' },
    { label: 'Package', value: 'package' },
    { label: 'Addon Config', value: 'addon_config' }
  ]

  const adminAuthStore = useAdminAuthStore()
  const { profile: info } = storeToRefs(adminAuthStore)

  const activeTab = ref('groups')
  const groupSubmitting = ref(false)
  const couponSubmitting = ref(false)
  const batchSubmitting = ref(false)

  const groupDialogVisible = ref(false)
  const couponDialogVisible = ref(false)
  const batchDialogVisible = ref(false)

  const allGroups = ref<CouponGroupRow[]>([])
  const goodsTypes = ref<GoodsTypeOptionRow[]>([])
  const regions = ref<RegionOptionRow[]>([])
  const planGroups = ref<PlanGroupOptionRow[]>([])
  const packages = ref<PackageOptionRow[]>([])

  const groupSearchForm = ref({ keyword: '' })
  const couponSearchForm = ref<CouponTableParams>({
    current: 1,
    size: 20,
    keyword: '',
    product_group_id: null,
    active: null
  })

  const groupForm = ref<CouponGroupFormValue>(createDefaultGroupForm())
  const couponForm = ref<CouponFormValue>(createDefaultCouponForm())
  const batchForm = ref<CouponBatchFormValue>(createDefaultBatchForm())

  const canView = computed(() =>
    hasAdminPermission(info.value?.permissions, ['coupon_group.list', 'coupon.list'])
  )
  const canManageGroups = computed(() =>
    hasAdminPermission(info.value?.permissions, [
      'coupon_group.create',
      'coupon_group.update',
      'coupon_group.delete'
    ])
  )
  const canManageCoupons = computed(() =>
    hasAdminPermission(info.value?.permissions, ['coupon.create', 'coupon.update', 'coupon.delete'])
  )
  const canBatchGenerate = computed(() =>
    hasAdminPermission(info.value?.permissions, ['coupon.batch_generate'])
  )

  const groupSearchItems = [
    {
      key: 'keyword',
      label: 'Keyword',
      type: 'input',
      props: { clearable: true, placeholder: 'Search group name' }
    }
  ]

  const couponSearchItems = computed(() => [
    {
      key: 'keyword',
      label: 'Code',
      type: 'input',
      props: { clearable: true, placeholder: 'Search coupon code' }
    },
    {
      key: 'product_group_id',
      label: 'Group',
      type: 'select',
      props: { clearable: true, filterable: true, options: groupOptions.value }
    },
    {
      key: 'active',
      label: 'Status',
      type: 'select',
      props: {
        clearable: true,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' }
        ]
      }
    }
  ])

  const {
    columnChecks: groupColumnChecks,
    columns: groupColumns,
    data: groups,
    loading: groupLoading,
    pagination: groupPagination,
    searchParams: groupSearchParams,
    getData: refreshGroups,
    resetSearchParams: resetGroupSearchParams,
    handleSizeChange: handleGroupSizeChange,
    handleCurrentChange: handleGroupCurrentChange
  } = useTable({
    core: {
      apiFn: fetchGroupTable,
      apiParams: { current: 1, size: 20, keyword: '' },
      immediate: false,
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 90 },
        { prop: 'name', label: 'Name', minWidth: 220 },
        { prop: 'rules', label: 'Rules', width: 100, useSlot: true },
        { prop: 'preview', label: 'Rule Preview', minWidth: 280, useSlot: true },
        { prop: 'operation', label: 'Actions', width: 170, fixed: 'right', useSlot: true }
      ]
    }
  })

  const {
    columnChecks: couponColumnChecks,
    columns: couponColumns,
    data: coupons,
    loading: couponLoading,
    pagination: couponPagination,
    searchParams: couponSearchParams,
    getData: refreshCoupons,
    resetSearchParams: resetCouponSearchParams,
    handleSizeChange: handleCouponSizeChange,
    handleCurrentChange: handleCouponCurrentChange
  } = useTable({
    core: {
      apiFn: fetchCouponTable,
      apiParams: { current: 1, size: 20, keyword: '', product_group_id: null, active: null },
      immediate: false,
      columnsFactory: () => [
        { prop: 'id', label: 'ID', width: 90 },
        { prop: 'code', label: 'Coupon Code', minWidth: 180 },
        { prop: 'discount', label: 'Discount', width: 120, useSlot: true },
        { prop: 'group', label: 'Group', minWidth: 200, useSlot: true },
        { prop: 'policy', label: 'Policy', minWidth: 180, useSlot: true },
        { prop: 'new_user_only', label: 'New Users', width: 100, useSlot: true },
        { prop: 'active', label: 'Status', width: 100, useSlot: true },
        { prop: 'created_at', label: 'Created At', minWidth: 180, useSlot: true },
        { prop: 'operation', label: 'Actions', width: 170, fixed: 'right', useSlot: true }
      ]
    }
  })

  const loading = computed(() => groupLoading.value || couponLoading.value)

  const groupOptions = computed<SelectOption[]>(() =>
    allGroups.value
      .filter((item) => item.id !== null)
      .map((item) => ({
        label: `${item.name || 'Group'} (#${item.id})`,
        value: Number(item.id)
      }))
  )

  onMounted(() => {
    fetchAll()
  })

  function createEmptyRule(): CouponRuleFormValue {
    return {
      scope: 'all',
      goods_type_id: null,
      region_id: null,
      plan_group_id: null,
      package_id: null,
      addon_core_enabled: false,
      addon_mem_enabled: false,
      addon_disk_enabled: false,
      addon_bw_enabled: false
    }
  }

  function createDefaultGroupForm(): CouponGroupFormValue {
    return {
      id: null,
      name: '',
      rules: [createEmptyRule()]
    }
  }

  function createDefaultCouponForm(): CouponFormValue {
    return {
      id: null,
      code: '',
      discount_permille: 900,
      product_group_id: null,
      total_limit: -1,
      per_user_limit: -1,
      new_user_only: false,
      active: true,
      note: ''
    }
  }

  function createDefaultBatchForm(): CouponBatchFormValue {
    return {
      prefix: 'CP',
      count: 20,
      length: 8,
      discount_permille: 900,
      product_group_id: null,
      total_limit: -1,
      per_user_limit: -1,
      new_user_only: false,
      active: true,
      note: ''
    }
  }

  function toNullableNumber(value: unknown) {
    if (value === null || value === undefined || value === '' || Number(value) <= 0) {
      return null
    }

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  function toNumber(value: unknown, fallback = 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  function toBoolean(value: unknown, fallback = false) {
    if (typeof value === 'boolean') {
      return value
    }

    if (value === 'true') {
      return true
    }

    if (value === 'false') {
      return false
    }

    return fallback
  }

  function normalizeGoodsType(
    item: Partial<CatalogGoodsType> & Record<string, unknown>
  ): GoodsTypeOptionRow {
    return {
      id: toNullableNumber(item.id ?? item.ID),
      name: String(item.name ?? item.Name ?? '')
    }
  }

  function normalizeRegion(
    item: Partial<CatalogRegion> & Record<string, unknown>
  ): RegionOptionRow {
    return {
      id: toNullableNumber(item.id ?? item.ID),
      name: String(item.name ?? item.Name ?? ''),
      goods_type_id: toNullableNumber(item.goods_type_id ?? item.GoodsTypeID)
    }
  }

  function normalizePlanGroup(
    item: Partial<CatalogPlanGroup> & Record<string, unknown>
  ): PlanGroupOptionRow {
    return {
      id: toNullableNumber(item.id ?? item.ID),
      name: String(item.name ?? item.Name ?? ''),
      goods_type_id: toNullableNumber(item.goods_type_id ?? item.GoodsTypeID),
      region_id: toNullableNumber(item.region_id ?? item.RegionID)
    }
  }

  function normalizePackage(
    item: Partial<CatalogPackage> & Record<string, unknown>
  ): PackageOptionRow {
    return {
      id: toNullableNumber(item.id ?? item.ID),
      name: String(item.name ?? item.Name ?? ''),
      plan_group_id: toNullableNumber(item.plan_group_id ?? item.PlanGroupID)
    }
  }

  function normalizeRule(rule?: unknown): CouponRuleFormValue {
    const raw = (rule || {}) as Record<string, unknown>
    const scope = String(raw.scope ?? 'all')

    const normalized: CouponRuleFormValue = {
      scope,
      goods_type_id: toNullableNumber(raw.goods_type_id ?? raw.GoodsTypeID),
      region_id: toNullableNumber(raw.region_id ?? raw.RegionID),
      plan_group_id: toNullableNumber(raw.plan_group_id ?? raw.PlanGroupID),
      package_id: toNullableNumber(raw.package_id ?? raw.PackageID),
      addon_core_enabled: toBoolean(raw.addon_core_enabled ?? raw.AddonCoreEnabled, false),
      addon_mem_enabled: toBoolean(raw.addon_mem_enabled ?? raw.AddonMemEnabled, false),
      addon_disk_enabled: toBoolean(raw.addon_disk_enabled ?? raw.AddonDiskEnabled, false),
      addon_bw_enabled: toBoolean(raw.addon_bw_enabled ?? raw.AddonBWEnabled, false)
    }

    if (!needGoodsType(normalized.scope)) normalized.goods_type_id = null
    if (!needRegion(normalized.scope)) normalized.region_id = null
    if (!needPlanGroup(normalized.scope)) normalized.plan_group_id = null
    if (!needPackage(normalized.scope)) normalized.package_id = null

    if (normalized.scope !== 'addon_config') {
      normalized.addon_core_enabled = false
      normalized.addon_mem_enabled = false
      normalized.addon_disk_enabled = false
      normalized.addon_bw_enabled = false
    }

    return normalized
  }

  function normalizeRules(rules?: unknown) {
    const items = Array.isArray(rules) ? rules.map((item) => normalizeRule(item)) : []
    return items.length ? items : [createEmptyRule()]
  }

  function normalizeGroup(
    item: Partial<CouponProductGroupRecord> & Record<string, unknown>
  ): CouponGroupRow {
    return {
      id: toNullableNumber(item.id ?? item.ID),
      name: String(item.name ?? item.Name ?? ''),
      rules: normalizeRules(item.rules ?? item.Rules)
    }
  }

  function normalizeCoupon(item: Partial<CouponRecord> & Record<string, unknown>): CouponRow {
    return {
      id: toNullableNumber(item.id ?? item.ID),
      code: String(item.code ?? item.Code ?? ''),
      discount_permille: toNumber(item.discount_permille ?? item.DiscountPermille, 900),
      product_group_id: toNullableNumber(item.product_group_id ?? item.ProductGroupID),
      total_limit: toNumber(item.total_limit ?? item.TotalLimit, -1),
      per_user_limit: toNumber(item.per_user_limit ?? item.PerUserLimit, -1),
      new_user_only: toBoolean(item.new_user_only ?? item.NewUserOnly, false),
      active: toBoolean(item.active ?? item.Active, true),
      note: String(item.note ?? item.Note ?? ''),
      created_at: String(item.created_at ?? item.CreatedAt ?? ''),
      updated_at: String(item.updated_at ?? item.UpdatedAt ?? '')
    }
  }

  function needGoodsType(scope?: string) {
    return ['goods_type', 'goods_type_region', 'plan_group', 'package', 'addon_config'].includes(
      String(scope || '')
    )
  }

  function needRegion(scope?: string) {
    return ['goods_type_region', 'plan_group'].includes(String(scope || ''))
  }

  function needPlanGroup(scope?: string) {
    return ['plan_group', 'package', 'addon_config'].includes(String(scope || ''))
  }

  function needPackage(scope?: string) {
    return String(scope || '') === 'package'
  }

  function validateRule(rule: CouponRuleFormValue) {
    if (needGoodsType(rule.scope) && !rule.goods_type_id) {
      return 'Please select a goods type'
    }

    if (needRegion(rule.scope) && !rule.region_id) {
      return 'Please select a region'
    }

    if (needPlanGroup(rule.scope) && !rule.plan_group_id) {
      return 'Please select a plan group'
    }

    if (needPackage(rule.scope) && !rule.package_id) {
      return 'Please select a package'
    }

    return ''
  }

  function serializeRule(rule: CouponRuleFormValue) {
    const normalized = normalizeRule(rule)
    return {
      scope: normalized.scope,
      goods_type_id: normalized.goods_type_id || undefined,
      region_id: normalized.region_id || undefined,
      plan_group_id: normalized.plan_group_id || undefined,
      package_id: normalized.package_id || undefined,
      addon_core_enabled:
        normalized.scope === 'addon_config' ? normalized.addon_core_enabled : false,
      addon_mem_enabled: normalized.scope === 'addon_config' ? normalized.addon_mem_enabled : false,
      addon_disk_enabled:
        normalized.scope === 'addon_config' ? normalized.addon_disk_enabled : false,
      addon_bw_enabled: normalized.scope === 'addon_config' ? normalized.addon_bw_enabled : false
    }
  }

  async function fetchAll() {
    try {
      await Promise.all([refreshGroups(), refreshCoupons(), fetchLookups()])
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || 'Failed to load coupons')
    }
  }

  async function fetchLookups() {
    const [goodsTypePayload, regionPayload, planGroupPayload, packagePayload] = await Promise.all([
      fetchAdminGoodsTypes(),
      fetchAdminRegions({ limit: 1000, offset: 0 }),
      fetchAdminPlanGroups({ limit: 2000, offset: 0 }),
      fetchAdminPackages({ limit: 3000, offset: 0 })
    ])

    goodsTypes.value = (goodsTypePayload.items || []).map((item) =>
      normalizeGoodsType(item as Record<string, unknown>)
    )
    regions.value = (regionPayload.items || []).map((item) =>
      normalizeRegion(item as Record<string, unknown>)
    )
    planGroups.value = (planGroupPayload.items || []).map((item) =>
      normalizePlanGroup(item as Record<string, unknown>)
    )
    packages.value = (packagePayload.items || []).map((item) =>
      normalizePackage(item as Record<string, unknown>)
    )
  }

  async function fetchGroupTable(
    params: GroupTableParams
  ): Promise<Api.Common.PaginatedResponse<CouponGroupRow>> {
    const payload = await fetchAdminCouponGroups()
    const keyword = params.keyword.trim().toLowerCase()
    allGroups.value = (payload.items || []).map((item) =>
      normalizeGroup(item as Record<string, unknown>)
    )
    const records = allGroups.value.filter(
      (item) => !keyword || item.name.toLowerCase().includes(keyword)
    )
    const start = (params.current - 1) * params.size

    return {
      records: records.slice(start, start + params.size),
      current: params.current,
      size: params.size,
      total: records.length
    }
  }

  async function fetchCouponTable(
    params: CouponTableParams
  ): Promise<Api.Common.PaginatedResponse<CouponRow>> {
    const payload = await fetchAdminCoupons({
      limit: params.size,
      offset: (params.current - 1) * params.size,
      q: params.keyword || undefined,
      product_group_id: params.product_group_id || undefined,
      active: params.active === null ? undefined : params.active === 'active'
    })
    const records = (payload.items || []).map((item) =>
      normalizeCoupon(item as Record<string, unknown>)
    )

    return {
      records,
      current: params.current,
      size: params.size,
      total: Number(payload.total || records.length)
    }
  }

  async function handleGroupSearch(params: { keyword: string }) {
    Object.assign(groupSearchParams, params)
    await refreshGroups()
  }

  async function handleGroupReset() {
    groupSearchForm.value = { keyword: '' }
    await resetGroupSearchParams()
  }

  async function handleCouponSearch(params: CouponTableParams) {
    Object.assign(couponSearchParams, params)
    await refreshCoupons()
  }

  async function handleCouponReset() {
    couponSearchForm.value = {
      current: 1,
      size: 20,
      keyword: '',
      product_group_id: null,
      active: null
    }
    await resetCouponSearchParams()
  }

  function scopeLabel(scope?: string) {
    return scopeOptions.find((item) => item.value === scope)?.label || scope || '-'
  }

  function renderRulePreview(rules: CouponRuleFormValue[]) {
    if (!rules.length) {
      return '-'
    }

    const first = rules[0]
    const text = scopeLabel(first.scope)
    return rules.length === 1 ? text : `${text} +${rules.length - 1}`
  }

  function resolveGroupName(groupId?: number | null) {
    const matched = allGroups.value.find((item) => Number(item.id) === Number(groupId))
    return matched?.name || (groupId ? `#${groupId}` : '-')
  }

  function formatDiscount(discountPermille?: number) {
    return `${(Number(discountPermille || 0) / 10).toFixed(1)}%`
  }

  function formatPolicy(row: CouponRow) {
    const totalText = row.total_limit < 0 ? 'unlimited' : String(row.total_limit)
    const perUserText = row.per_user_limit < 0 ? 'unlimited' : String(row.per_user_limit)
    return `total ${totalText} / user ${perUserText}`
  }

  function formatDateTime(value?: string) {
    if (!value) {
      return '-'
    }

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
  }

  function openGroupDialog(row?: CouponGroupRow) {
    groupForm.value = row
      ? {
          id: row.id,
          name: row.name,
          rules: normalizeRules(row.rules)
        }
      : createDefaultGroupForm()

    groupDialogVisible.value = true
  }

  async function submitGroup(form: CouponGroupFormValue) {
    const name = String(form.name || '').trim()
    if (!name) {
      return ElMessage.error('Please enter a coupon group name')
    }

    if (name.length > INPUT_LIMITS.COUPON_GROUP_NAME) {
      return ElMessage.error(
        `Coupon group name cannot exceed ${INPUT_LIMITS.COUPON_GROUP_NAME} characters`
      )
    }

    const rules = normalizeRules(form.rules)
    for (const rule of rules) {
      const errorText = validateRule(rule)
      if (errorText) {
        return ElMessage.error(errorText)
      }
    }

    groupSubmitting.value = true

    try {
      const payload = {
        name,
        rules: rules.map((item) => serializeRule(item))
      }

      if (form.id) {
        await updateAdminCouponGroup(form.id, payload)
      } else {
        await createAdminCouponGroup(payload)
      }

      groupDialogVisible.value = false
      ElMessage.success('Coupon group saved')
      await fetchAll()
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || 'Failed to save coupon group')
    } finally {
      groupSubmitting.value = false
    }
  }

  async function removeGroup(row: CouponGroupRow) {
    if (!row.id) {
      return
    }

    try {
      await ElMessageBox.confirm(`Delete coupon group "${row.name || row.id}"?`, 'Confirm', {
        type: 'warning'
      })
      await deleteAdminCouponGroup(row.id)
      ElMessage.success('Coupon group deleted')
      await fetchAll()
    } catch (error: any) {
      if (error !== 'cancel' && error !== 'close') {
        ElMessage.error(error?.response?.data?.error || 'Failed to delete coupon group')
      }
    }
  }

  function openCouponDialog(row?: CouponRow) {
    couponForm.value = row
      ? { ...row }
      : {
          ...createDefaultCouponForm(),
          product_group_id: couponSearchForm.value.product_group_id
        }

    couponDialogVisible.value = true
  }

  async function submitCoupon(form: CouponFormValue) {
    const code = String(form.code || '').trim()
    if (!code) {
      return ElMessage.error('Please enter a coupon code')
    }

    if (code.length > INPUT_LIMITS.COUPON_CODE) {
      return ElMessage.error(`Coupon code cannot exceed ${INPUT_LIMITS.COUPON_CODE} characters`)
    }

    if (!form.product_group_id) {
      return ElMessage.error('Please select a coupon group')
    }

    if (String(form.note || '').length > INPUT_LIMITS.COUPON_NOTE) {
      return ElMessage.error(`Note cannot exceed ${INPUT_LIMITS.COUPON_NOTE} characters`)
    }

    couponSubmitting.value = true

    try {
      const payload = {
        code,
        discount_permille: toNumber(form.discount_permille, 900),
        product_group_id: Number(form.product_group_id),
        total_limit: toNumber(form.total_limit, -1),
        per_user_limit: toNumber(form.per_user_limit, -1),
        new_user_only: Boolean(form.new_user_only),
        active: Boolean(form.active),
        note: String(form.note || '').trim()
      }

      if (form.id) {
        await updateAdminCoupon(form.id, payload)
      } else {
        await createAdminCoupon(payload)
      }

      couponDialogVisible.value = false
      ElMessage.success('Coupon saved')
      await fetchAll()
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || 'Failed to save coupon')
    } finally {
      couponSubmitting.value = false
    }
  }

  async function removeCoupon(row: CouponRow) {
    if (!row.id) {
      return
    }

    try {
      await ElMessageBox.confirm(`Delete coupon "${row.code || row.id}"?`, 'Confirm', {
        type: 'warning'
      })
      await deleteAdminCoupon(row.id)
      ElMessage.success('Coupon deleted')
      await fetchAll()
    } catch (error: any) {
      if (error !== 'cancel' && error !== 'close') {
        ElMessage.error(error?.response?.data?.error || 'Failed to delete coupon')
      }
    }
  }

  function openBatchDialog() {
    batchForm.value = {
      ...batchForm.value,
      product_group_id: couponSearchForm.value.product_group_id || batchForm.value.product_group_id
    }
    batchDialogVisible.value = true
  }

  async function submitBatch(form: CouponBatchFormValue) {
    const prefix = String(form.prefix || '').trim()
    if (!prefix) {
      return ElMessage.error('Please enter a prefix')
    }

    if (prefix.length > INPUT_LIMITS.COUPON_BATCH_PREFIX) {
      return ElMessage.error(`Prefix cannot exceed ${INPUT_LIMITS.COUPON_BATCH_PREFIX} characters`)
    }

    if (!form.product_group_id) {
      return ElMessage.error('Please select a coupon group')
    }

    if (String(form.note || '').length > INPUT_LIMITS.COUPON_NOTE) {
      return ElMessage.error(`Note cannot exceed ${INPUT_LIMITS.COUPON_NOTE} characters`)
    }

    batchSubmitting.value = true

    try {
      await batchGenerateAdminCoupons({
        prefix,
        count: toNumber(form.count, 20),
        length: toNumber(form.length, 8),
        discount_permille: toNumber(form.discount_permille, 900),
        product_group_id: Number(form.product_group_id),
        total_limit: toNumber(form.total_limit, -1),
        per_user_limit: toNumber(form.per_user_limit, -1),
        new_user_only: Boolean(form.new_user_only),
        active: Boolean(form.active),
        note: String(form.note || '').trim()
      })

      batchForm.value = { ...form }
      batchDialogVisible.value = false
      ElMessage.success('Coupons generated')
      await fetchAll()
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.error || 'Failed to generate coupons')
    } finally {
      batchSubmitting.value = false
    }
  }
</script>

<style scoped lang="scss">
  .coupon-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .page-header,
  .toolbar,
  .toolbar-actions,
  .table-actions {
    display: flex;
    align-items: center;
  }

  .page-header,
  .toolbar {
    gap: 16px;
    justify-content: space-between;
  }

  .page-header {
    margin-bottom: 16px;
  }

  .page-title {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.1;
    color: var(--el-text-color-primary);
  }

  .page-subtitle {
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }

  .toolbar {
    margin-bottom: 14px;
  }

  .toolbar-filters,
  .toolbar-actions,
  .table-actions {
    flex-wrap: wrap;
    gap: 12px;
  }

  .inline-input,
  .inline-select {
    width: 220px;
  }

  @media (width <= 768px) {
    .page-header,
    .toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    .inline-input,
    .inline-select {
      width: 100%;
    }
  }
</style>
