<template>
  <div>
    <ConsolePageHeader title="购买 VPS" description="选择地区、线路、套餐、系统镜像和计费周期。">
      <template #actions>
        <ElButton :icon="ShoppingCart" @click="router.push('/console/cart')">购物车</ElButton>
        <ElButton :icon="Refresh" :loading="catalog.loading" @click="catalog.fetchCatalog()"
          >刷新</ElButton
        >
      </template>
    </ConsolePageHeader>

    <ElRow :gutter="16">
      <ElCol :xs="24" :lg="16">
        <div class="console-card config-panel">
          <ElSteps :active="stepIndex" simple class="buy-steps">
            <ElStep title="类型" />
            <ElStep title="地区" />
            <ElStep title="套餐" />
            <ElStep title="确认" />
          </ElSteps>

          <ElForm label-position="top" class="buy-form">
            <ElFormItem label="商品类型">
              <ElSegmented
                v-if="goodsTypes.length"
                v-model="form.goodsTypeId"
                :options="goodsTypeOptions"
                block
              />
              <ElEmpty v-else description="暂无商品类型" />
            </ElFormItem>

            <ElFormItem label="地区">
              <ElSelect
                v-model="form.regionId"
                placeholder="请选择地区"
                filterable
                class="full-width"
              >
                <ElOption
                  v-for="region in regions"
                  :key="region.id"
                  :label="region.name || region.code || `地区 ${region.id}`"
                  :value="region.id || 0"
                />
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="线路">
              <ElSelect
                v-model="form.planGroupId"
                placeholder="请选择线路"
                filterable
                class="full-width"
                :loading="catalog.loading"
              >
                <ElOption
                  v-for="group in planGroups"
                  :key="group.id"
                  :label="group.name || `线路 ${group.id}`"
                  :value="group.id || 0"
                  :disabled="isCapacityEmpty(group.capacity_remaining)"
                >
                  <span>{{ group.name || `线路 ${group.id}` }}</span>
                  <span class="option-meta">{{ capacityText(group.capacity_remaining) }}</span>
                </ElOption>
              </ElSelect>
            </ElFormItem>

            <ElFormItem label="套餐">
              <div v-if="packages.length" class="package-grid">
                <button
                  v-for="item in packages"
                  :key="item.id"
                  type="button"
                  class="package-card"
                  :class="{
                    selected: form.packageId === item.id,
                    disabled: isCapacityEmpty(item.capacity_remaining)
                  }"
                  @click="selectPackage(item)"
                >
                  <div class="package-head">
                    <strong>{{ item.name || `套餐 ${item.id}` }}</strong>
                    <ElTag
                      v-if="item.name?.includes('推荐') || item.name?.includes('热门')"
                      type="danger"
                    >
                      推荐
                    </ElTag>
                  </div>
                  <div class="package-spec">
                    <span>{{ item.cores || 0 }} 核</span>
                    <span>{{ item.memory_gb || 0 }} GB</span>
                    <span>{{ item.disk_gb || 0 }} GB</span>
                    <span>{{ item.bandwidth_mbps || 0 }} Mbps</span>
                  </div>
                  <div class="package-foot">
                    <span>{{ formatMoney(item.monthly_price) }}/月</span>
                    <small>{{ capacityText(item.capacity_remaining) }}</small>
                  </div>
                </button>
              </div>
              <ElEmpty v-else description="暂无可用套餐" />
            </ElFormItem>

            <ElFormItem label="系统镜像">
              <ElSelect
                v-model="form.systemId"
                placeholder="请选择系统镜像"
                filterable
                class="full-width"
                :loading="loadingImages"
              >
                <ElOption
                  v-for="image in systemImages"
                  :key="image.id"
                  :label="
                    image.type ? `${image.name} (${image.type})` : image.name || `镜像 ${image.id}`
                  "
                  :value="image.id"
                />
              </ElSelect>
            </ElFormItem>

            <ElDivider content-position="left">附加配置</ElDivider>
            <div class="addon-grid">
              <div v-for="item in addonItems" :key="item.key" class="addon-item">
                <div class="addon-head">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}{{ item.unit }}</strong>
                </div>
                <ElSlider
                  v-model="form[item.key]"
                  :min="item.rule.min"
                  :max="item.rule.max"
                  :step="item.rule.step"
                  :disabled="item.rule.disabled"
                  :format-tooltip="(value: number) => `${value}${item.unit}`"
                />
              </div>
            </div>

            <ElDivider content-position="left">购买信息</ElDivider>
            <ElRow :gutter="16">
              <ElCol :xs="24" :sm="12">
                <ElFormItem label="计费周期">
                  <ElSelect v-model="form.billingCycleId" placeholder="选择周期" class="full-width">
                    <ElOption
                      v-for="cycle in billingCycles"
                      :key="cycle.id"
                      :label="cycleLabel(cycle)"
                      :value="cycle.id || 0"
                    />
                  </ElSelect>
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12">
                <ElFormItem label="购买数量">
                  <ElInputNumber v-model="form.qty" :min="1" :max="10" class="full-width-number" />
                </ElFormItem>
              </ElCol>
              <ElCol :xs="24" :sm="12">
                <ElFormItem label="周期数量">
                  <ElInputNumber
                    v-model="form.cycleQty"
                    :min="1"
                    :max="12"
                    class="full-width-number"
                  />
                </ElFormItem>
              </ElCol>
            </ElRow>
          </ElForm>
        </div>
      </ElCol>

      <ElCol :xs="24" :lg="8">
        <div class="console-card summary-panel">
          <div class="summary-title">配置摘要</div>
          <div class="summary-list">
            <div
              ><span>地区</span><strong>{{ selectedRegion?.name || '-' }}</strong></div
            >
            <div
              ><span>线路</span><strong>{{ selectedPlanGroup?.name || '-' }}</strong></div
            >
            <div
              ><span>套餐</span><strong>{{ selectedPackage?.name || '-' }}</strong></div
            >
            <div
              ><span>系统</span><strong>{{ selectedSystem?.name || '-' }}</strong></div
            >
            <div
              ><span>周期</span
              ><strong>{{ selectedCycle?.name || '-' }} × {{ form.cycleQty }}</strong></div
            >
            <div
              ><span>数量</span><strong>{{ form.qty }} 台</strong></div
            >
          </div>

          <div v-if="hasAddons" class="addon-tags">
            <ElTag v-if="form.add_cores">CPU +{{ form.add_cores }} 核</ElTag>
            <ElTag v-if="form.add_mem_gb">内存 +{{ form.add_mem_gb }} GB</ElTag>
            <ElTag v-if="form.add_disk_gb">磁盘 +{{ form.add_disk_gb }} GB</ElTag>
            <ElTag v-if="form.add_bw_mbps">带宽 +{{ form.add_bw_mbps }} Mbps</ElTag>
          </div>

          <ElDivider />
          <ElFormItem label="优惠码">
            <ElInput v-model.trim="form.couponCode" placeholder="可选">
              <template #append>
                <ElButton :loading="couponLoading" @click="applyCoupon">使用</ElButton>
              </template>
            </ElInput>
          </ElFormItem>

          <div class="price-box">
            <div
              ><span>基础月费</span><strong>{{ formatMoney(basePrice) }}</strong></div
            >
            <div
              ><span>附加月费</span><strong>{{ formatMoney(addonPrice) }}</strong></div
            >
            <div
              ><span>原价</span><strong>{{ formatMoney(originalTotal) }}</strong></div
            >
            <div v-if="couponPreview"
              ><span>优惠</span><strong>-{{ formatMoney(couponPreview.discount) }}</strong></div
            >
            <div class="final-price">
              <span>应付</span>
              <strong>{{ formatMoney(finalTotal) }}</strong>
            </div>
          </div>

          <div class="summary-actions">
            <ElButton :disabled="!canCheckout" :loading="cartLoading" @click="addToCart"
              >加入购物车</ElButton
            >
            <ElButton
              type="primary"
              :disabled="!canCheckout"
              :loading="ordering"
              @click="createOrderNow"
            >
              立即下单
            </ElButton>
          </div>
        </div>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import { Refresh, ShoppingCart } from '@element-plus/icons-vue'
  import {
    createOrder,
    listSystemImages,
    previewCoupon,
    type BillingCycle,
    type CatalogPackage,
    type CouponPreviewResponse
  } from '@/api/console-user'
  import { useConsoleCartStore } from '@/store/modules/console-cart'
  import { useConsoleCatalogStore } from '@/store/modules/console-catalog'
  import { formatMoney } from '@/utils/console-user'
  import ConsolePageHeader from '../shared/PageHeader.vue'
  import '../shared/styles.scss'

  defineOptions({ name: 'ConsoleUserBuy' })

  type AddonKey = 'add_cores' | 'add_mem_gb' | 'add_disk_gb' | 'add_bw_mbps'

  interface AddonRule {
    disabled: boolean
    min: number
    max: number
    step: number
  }

  const router = useRouter()
  const catalog = useConsoleCatalogStore()
  const cart = useConsoleCartStore()
  const loadingImages = ref(false)
  const cartLoading = ref(false)
  const ordering = ref(false)
  const couponLoading = ref(false)
  const systemImages = ref<any[]>([])
  const couponPreview = ref<CouponPreviewResponse | null>(null)

  const form = reactive<
    Record<AddonKey, number> & {
      goodsTypeId?: number
      regionId?: number
      planGroupId?: number
      packageId?: number
      systemId?: number
      billingCycleId?: number
      cycleQty: number
      qty: number
      couponCode: string
    }
  >({
    goodsTypeId: undefined,
    regionId: undefined,
    planGroupId: undefined,
    packageId: undefined,
    systemId: undefined,
    add_cores: 0,
    add_mem_gb: 0,
    add_disk_gb: 0,
    add_bw_mbps: 0,
    billingCycleId: undefined,
    cycleQty: 1,
    qty: 1,
    couponCode: ''
  })

  const goodsTypes = computed(() => catalog.goodsTypes.filter((item) => item.active !== false))
  const goodsTypeOptions = computed(() =>
    goodsTypes.value.map((item) => ({
      label: item.name || item.code || `类型 ${item.id}`,
      value: item.id
    }))
  )
  const regions = computed(() =>
    catalog.regions.filter(
      (item) =>
        item.active !== false &&
        item.visible !== false &&
        (!form.goodsTypeId || String(item.goods_type_id) === String(form.goodsTypeId))
    )
  )
  const planGroups = computed(() =>
    catalog.planGroups.filter(
      (item) =>
        item.active !== false &&
        item.visible !== false &&
        (!form.goodsTypeId || String(item.goods_type_id) === String(form.goodsTypeId)) &&
        (!form.regionId || String(item.region_id) === String(form.regionId))
    )
  )
  const packages = computed(() =>
    catalog.packages.filter(
      (item) =>
        item.active !== false &&
        item.visible !== false &&
        (!form.planGroupId || String(item.plan_group_id) === String(form.planGroupId))
    )
  )
  const billingCycles = computed(() =>
    catalog.billingCycles.filter((item) => item.active !== false)
  )
  const selectedRegion = computed(() => regions.value.find((item) => item.id === form.regionId))
  const selectedPlanGroup = computed(() =>
    planGroups.value.find((item) => item.id === form.planGroupId)
  )
  const selectedPackage = computed(() => packages.value.find((item) => item.id === form.packageId))
  const selectedSystem = computed(() =>
    systemImages.value.find((item) => item.id === form.systemId)
  )
  const selectedCycle = computed(() =>
    billingCycles.value.find((item) => item.id === form.billingCycleId)
  )

  const stepIndex = computed(() => {
    if (!form.goodsTypeId) return 0
    if (!form.regionId || !form.planGroupId) return 1
    if (!form.packageId || !form.systemId) return 2
    return 3
  })

  const addonRules = computed(() => {
    const group = selectedPlanGroup.value || {}
    return {
      add_cores: resolveAddonRule(group.add_core_min, group.add_core_max, group.add_core_step, 64),
      add_mem_gb: resolveAddonRule(group.add_mem_min, group.add_mem_max, group.add_mem_step, 256),
      add_disk_gb: resolveAddonRule(
        group.add_disk_min,
        group.add_disk_max,
        group.add_disk_step,
        2000
      ),
      add_bw_mbps: resolveAddonRule(group.add_bw_min, group.add_bw_max, group.add_bw_step, 1000)
    } satisfies Record<AddonKey, AddonRule>
  })

  const addonItems = computed(() => [
    {
      key: 'add_cores' as AddonKey,
      label: 'CPU 核心',
      unit: '核',
      value: form.add_cores,
      rule: addonRules.value.add_cores
    },
    {
      key: 'add_mem_gb' as AddonKey,
      label: '内存',
      unit: 'GB',
      value: form.add_mem_gb,
      rule: addonRules.value.add_mem_gb
    },
    {
      key: 'add_disk_gb' as AddonKey,
      label: '磁盘',
      unit: 'GB',
      value: form.add_disk_gb,
      rule: addonRules.value.add_disk_gb
    },
    {
      key: 'add_bw_mbps' as AddonKey,
      label: '带宽',
      unit: 'Mbps',
      value: form.add_bw_mbps,
      rule: addonRules.value.add_bw_mbps
    }
  ])

  const basePrice = computed(() => Number(selectedPackage.value?.monthly_price || 0))
  const addonPrice = computed(() => {
    const group = selectedPlanGroup.value || {}
    return (
      form.add_cores * Number(group.unit_core || 0) +
      form.add_mem_gb * Number(group.unit_mem || 0) +
      form.add_disk_gb * Number(group.unit_disk || 0) +
      form.add_bw_mbps * Number(group.unit_bw || 0)
    )
  })
  const cycleMultiplier = computed(() => {
    const cycle = selectedCycle.value
    return Number(cycle?.multiplier || cycle?.months || 1) * Number(form.cycleQty || 1)
  })
  const originalTotal = computed(
    () => (basePrice.value + addonPrice.value) * cycleMultiplier.value * form.qty
  )
  const finalTotal = computed(() => Number(couponPreview.value?.final_total ?? originalTotal.value))
  const hasAddons = computed(() => addonItems.value.some((item) => item.value > 0))
  const canCheckout = computed(() => Boolean(form.packageId && form.systemId))

  function resolveAddonRule(
    minRaw?: number,
    maxRaw?: number,
    stepRaw?: number,
    fallbackMax = 100
  ): AddonRule {
    const min = Number(minRaw ?? 0)
    const max = Number(maxRaw ?? 0)
    const step = Math.max(1, Number(stepRaw ?? 1))
    if (min === -1 || max === -1) {
      return { disabled: true, min: 0, max: 0, step: 1 }
    }
    const effectiveMin = min > 0 ? min : 0
    const effectiveMax = max > 0 ? max : fallbackMax
    return { disabled: false, min: effectiveMin, max: Math.max(effectiveMin, effectiveMax), step }
  }

  function clamp(value: number, rule: AddonRule) {
    if (rule.disabled) return 0
    const next = Math.max(rule.min, Math.min(rule.max, Number(value || 0)))
    return rule.min + Math.round((next - rule.min) / rule.step) * rule.step
  }

  function isCapacityEmpty(value?: number) {
    const remaining = Number(value)
    return Number.isFinite(remaining) && remaining === 0
  }

  function capacityText(value?: number) {
    const remaining = Number(value)
    if (!Number.isFinite(remaining)) return ''
    if (remaining < 0) return '不限量'
    if (remaining === 0) return '售罄'
    return `余量 ${remaining}`
  }

  function cycleLabel(cycle: BillingCycle) {
    const months = cycle.months ? ` · ${cycle.months} 个月` : ''
    return `${cycle.name || `周期 ${cycle.id}`}${months}`
  }

  function selectPackage(item: CatalogPackage) {
    if (isCapacityEmpty(item.capacity_remaining)) return
    form.packageId = item.id
  }

  function buildSpec() {
    const spec: Record<string, number | undefined> = {
      add_cores: form.add_cores,
      add_mem_gb: form.add_mem_gb,
      add_disk_gb: form.add_disk_gb,
      add_bw_mbps: form.add_bw_mbps,
      billing_cycle_id: form.billingCycleId,
      cycle_qty: form.cycleQty,
      duration_months: Number(selectedCycle.value?.months || 1) * Number(form.cycleQty || 1)
    }
    return spec
  }

  function buildItems() {
    return [
      {
        package_id: form.packageId,
        system_id: form.systemId,
        spec: buildSpec(),
        qty: form.qty
      }
    ]
  }

  async function fetchImages(planGroupId?: number) {
    form.systemId = undefined
    systemImages.value = []
    if (!planGroupId) return
    const group = planGroups.value.find((item) => item.id === planGroupId)
    loadingImages.value = true
    try {
      const response = await listSystemImages({
        plan_group_id: planGroupId,
        line_id: group?.line_id
      })
      systemImages.value = (response.items || []).filter((item) => item.enabled !== false)
      form.systemId = systemImages.value[0]?.id
    } finally {
      loadingImages.value = false
    }
  }

  async function addToCart() {
    if (!canCheckout.value) {
      ElMessage.warning('请先选择套餐和系统镜像')
      return
    }
    cartLoading.value = true
    try {
      await cart.addItem(buildItems()[0])
      ElMessage.success('已加入购物车')
    } finally {
      cartLoading.value = false
    }
  }

  async function applyCoupon() {
    if (!canCheckout.value) {
      ElMessage.warning('请先完成配置选择')
      return
    }
    const code = form.couponCode.trim()
    if (!code) {
      ElMessage.warning('请输入优惠码')
      return
    }
    couponLoading.value = true
    try {
      couponPreview.value = await previewCoupon({ coupon_code: code, items: buildItems() })
      ElMessage.success('优惠码已应用')
    } finally {
      couponLoading.value = false
    }
  }

  async function createOrderNow() {
    if (!canCheckout.value) {
      ElMessage.warning('请先选择套餐和系统镜像')
      return
    }
    ordering.value = true
    try {
      const response = await createOrder(
        {
          coupon_code: form.couponCode.trim() || undefined,
          items: buildItems()
        },
        `console-order-${Date.now()}`
      )
      ElMessage.success('订单已创建')
      const orderId = response.order?.id
      if (orderId) {
        router.push(`/console/orders/${orderId}`)
      } else {
        router.push('/console/orders')
      }
    } finally {
      ordering.value = false
    }
  }

  watch(
    () => form.goodsTypeId,
    () => {
      form.regionId = undefined
      form.planGroupId = undefined
      form.packageId = undefined
      form.systemId = undefined
    }
  )

  watch(
    () => form.regionId,
    () => {
      form.planGroupId = undefined
      form.packageId = undefined
      form.systemId = undefined
    }
  )

  watch(
    () => form.planGroupId,
    (value) => {
      form.packageId = undefined
      void fetchImages(value)
    }
  )

  watch(
    () => form.packageId,
    () => {
      couponPreview.value = null
    }
  )

  watch(goodsTypes, (list) => {
    if (!form.goodsTypeId && list.length) form.goodsTypeId = list[0].id
  })

  watch(regions, (list) => {
    if (!form.regionId && list.length) form.regionId = list[0].id
  })

  watch(planGroups, (list) => {
    if (!form.planGroupId && list.length) {
      form.planGroupId = list.find((item) => !isCapacityEmpty(item.capacity_remaining))?.id
    }
  })

  watch(packages, (list) => {
    if (!form.packageId && list.length) {
      form.packageId = list.find((item) => !isCapacityEmpty(item.capacity_remaining))?.id
    }
  })

  watch(billingCycles, (list) => {
    if (!form.billingCycleId && list.length) form.billingCycleId = list[0].id
  })

  watch(
    addonRules,
    (rules) => {
      ;(['add_cores', 'add_mem_gb', 'add_disk_gb', 'add_bw_mbps'] as AddonKey[]).forEach((key) => {
        form[key] = clamp(form[key], rules[key])
      })
    },
    { deep: true }
  )

  watch(
    () => [
      form.systemId,
      form.add_cores,
      form.add_mem_gb,
      form.add_disk_gb,
      form.add_bw_mbps,
      form.billingCycleId,
      form.cycleQty,
      form.qty,
      form.couponCode
    ],
    () => {
      couponPreview.value = null
    }
  )

  onMounted(async () => {
    if (!catalog.goodsTypes.length) {
      await catalog.fetchCatalog()
    }
    if (goodsTypes.value.length && !form.goodsTypeId) form.goodsTypeId = goodsTypes.value[0].id
    if (billingCycles.value.length && !form.billingCycleId)
      form.billingCycleId = billingCycles.value[0].id
  })
</script>

<style scoped lang="scss">
  .config-panel,
  .summary-panel {
    padding: 18px;
  }

  .buy-steps {
    margin-bottom: 18px;
  }

  .buy-form {
    margin-top: 10px;
  }

  .full-width,
  .full-width-number {
    width: 100%;
  }

  .option-meta {
    float: right;
    color: var(--art-gray-400);
    font-size: 12px;
  }

  .package-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    width: 100%;
  }

  .package-card {
    padding: 14px;
    text-align: left;
    border: 1px solid var(--art-card-border);
    border-radius: 8px;
    background: var(--default-box-color);
    cursor: pointer;
    transition: all 0.16s ease;

    &.selected {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
    }

    &.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    &:hover:not(.disabled) {
      border-color: var(--el-color-primary-light-5);
    }
  }

  .package-head,
  .package-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .package-spec {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
    margin: 14px 0;
    color: var(--art-gray-600);
    font-size: 13px;
  }

  .package-foot span {
    color: var(--el-color-danger);
    font-size: 18px;
    font-weight: 700;
  }

  .package-foot small {
    color: var(--art-gray-400);
  }

  .addon-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .addon-item {
    padding: 14px;
    border: 1px solid var(--art-card-border);
    border-radius: 8px;
    background: var(--el-fill-color-extra-light);
  }

  .addon-head,
  .summary-list > div,
  .price-box > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .summary-title {
    margin-bottom: 16px;
    color: var(--art-gray-900);
    font-size: 17px;
    font-weight: 700;
  }

  .summary-list,
  .price-box {
    display: flex;
    flex-direction: column;
    gap: 12px;
    color: var(--art-gray-500);
  }

  .summary-list strong,
  .price-box strong {
    color: var(--art-gray-900);
    text-align: right;
  }

  .addon-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 14px;
  }

  .final-price {
    padding-top: 12px;
    border-top: 1px solid var(--art-card-border);

    strong {
      color: var(--el-color-danger);
      font-size: 24px;
    }
  }

  .summary-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 18px;
  }

  @media (max-width: 900px) {
    .package-grid,
    .addon-grid {
      grid-template-columns: 1fr;
    }

    .summary-panel {
      margin-top: 16px;
    }
  }
</style>
