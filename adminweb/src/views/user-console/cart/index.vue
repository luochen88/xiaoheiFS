<template>
  <div>
    <ConsolePageHeader title="购物车" description="确认已选配置后统一生成订单。">
      <template #actions>
        <ElButton @click="router.push('/console/buy')">继续购买</ElButton>
        <ElButton :icon="Refresh" :loading="cart.loading" @click="cart.fetchCart()">刷新</ElButton>
      </template>
    </ConsolePageHeader>

    <ElRow :gutter="16">
      <ElCol :xs="24" :lg="17">
        <div class="console-card table-card">
          <div class="table-toolbar">
            <div>
              <div class="toolbar-title">商品明细</div>
              <div class="muted">共 {{ cart.count }} 件商品</div>
            </div>
            <ElPopconfirm title="确认清空购物车？" @confirm="clearCart">
              <template #reference>
                <ElButton :disabled="!cart.count" type="danger" plain>清空</ElButton>
              </template>
            </ElPopconfirm>
          </div>

          <ElTable :data="rows" row-key="id" :loading="cart.loading" empty-text="购物车为空">
            <ElTableColumn label="商品" min-width="200">
              <template #default="{ row }">
                <div class="primary-text">{{ row.packageName }}</div>
                <div class="muted mono"
                  >套餐 ID: {{ row.package_id || '-' }} / 镜像 ID: {{ row.system_id || '-' }}</div
                >
              </template>
            </ElTableColumn>
            <ElTableColumn label="配置" min-width="210">
              <template #default="{ row }">
                <ElTag effect="plain">{{ row.specLabel }}</ElTag>
                <div v-if="row.addonLabel" class="muted addon-line">{{ row.addonLabel }}</div>
              </template>
            </ElTableColumn>
            <ElTableColumn label="数量" width="150">
              <template #default="{ row }">
                <ElInputNumber
                  v-model="row.qty"
                  :min="1"
                  :max="10"
                  size="small"
                  @change="updateQty(row)"
                />
              </template>
            </ElTableColumn>
            <ElTableColumn label="金额" width="140">
              <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="90" align="right">
              <template #default="{ row }">
                <ElButton link type="danger" @click="cart.removeItem(row.id)">移除</ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </ElCol>

      <ElCol :xs="24" :lg="7">
        <div class="console-card checkout-card">
          <div class="summary-title">结算</div>
          <div class="summary-row"
            ><span>商品数量</span><strong>{{ cart.count }} 件</strong></div
          >
          <div class="summary-row"
            ><span>预估金额</span><strong>{{ formatMoney(cart.totalAmount) }}</strong></div
          >
          <ElDivider />
          <ElFormItem label="优惠码">
            <ElInput v-model.trim="couponCode" placeholder="可选" />
          </ElFormItem>
          <ElButton
            type="primary"
            class="checkout-button"
            :disabled="!cart.count"
            :loading="submitting"
            @click="createOrder"
          >
            生成订单
          </ElButton>
        </div>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import { Refresh } from '@element-plus/icons-vue'
  import { createOrderFromCart } from '@/api/console-user'
  import { useConsoleCartStore, type NormalizedCartItem } from '@/store/modules/console-cart'
  import { useConsoleCatalogStore } from '@/store/modules/console-catalog'
  import { formatMoney, specText } from '@/utils/console-user'
  import ConsolePageHeader from '../shared/PageHeader.vue'
  import '../shared/styles.scss'

  defineOptions({ name: 'ConsoleUserCart' })

  const router = useRouter()
  const cart = useConsoleCartStore()
  const catalog = useConsoleCatalogStore()
  const couponCode = ref('')
  const submitting = ref(false)

  const rows = computed(() =>
    cart.items.map((item) => {
      const pkg = catalog.packages.find((row) => row.id === item.package_id)
      const spec = item.spec || {}
      const addon = [
        spec.add_cores ? `CPU +${spec.add_cores}核` : '',
        spec.add_mem_gb ? `内存 +${spec.add_mem_gb}GB` : '',
        spec.add_disk_gb ? `磁盘 +${spec.add_disk_gb}GB` : '',
        spec.add_bw_mbps ? `带宽 +${spec.add_bw_mbps}Mbps` : ''
      ]
        .filter(Boolean)
        .join(' / ')
      return {
        ...item,
        qty: item.qty || 1,
        packageName: pkg?.name || `套餐 ${item.package_id || '-'}`,
        specLabel: specText({
          cores: pkg?.cores,
          memory_gb: pkg?.memory_gb,
          disk_gb: pkg?.disk_gb,
          bandwidth_mbps: pkg?.bandwidth_mbps
        }),
        addonLabel: addon
      }
    })
  )

  async function updateQty(row: NormalizedCartItem) {
    if (!row.id) return
    await cart.updateItem(row.id, {
      package_id: row.package_id,
      system_id: row.system_id,
      spec: row.spec,
      qty: row.qty
    })
  }

  async function clearCart() {
    await cart.clearAll()
    ElMessage.success('购物车已清空')
  }

  async function createOrder() {
    submitting.value = true
    try {
      const response = await createOrderFromCart(
        { coupon_code: couponCode.value.trim() || undefined },
        `cart-order-${Date.now()}`
      )
      ElMessage.success('订单已创建')
      await cart.fetchCart().catch(() => undefined)
      const orderId = response.order?.id
      if (orderId) {
        router.push(`/console/orders/${orderId}`)
      } else {
        router.push('/console/orders')
      }
    } finally {
      submitting.value = false
    }
  }

  onMounted(async () => {
    await cart.fetchCart()
    if (!catalog.packages.length) {
      catalog.fetchCatalog().catch(() => undefined)
    }
  })
</script>

<style scoped lang="scss">
  .primary-text {
    color: var(--art-gray-900);
    font-weight: 600;
  }

  .addon-line {
    margin-top: 6px;
  }

  .checkout-card {
    padding: 18px;
  }

  .summary-title {
    margin-bottom: 16px;
    color: var(--art-gray-900);
    font-size: 17px;
    font-weight: 700;
  }

  .summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    color: var(--art-gray-500);

    strong {
      color: var(--art-gray-900);
    }
  }

  .checkout-button {
    width: 100%;
  }

  @media (max-width: 992px) {
    .checkout-card {
      margin-top: 16px;
    }
  }
</style>
