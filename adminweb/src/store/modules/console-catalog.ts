import { defineStore } from 'pinia'
import {
  getCatalog,
  type BillingCycle,
  type CatalogGoodsType,
  type CatalogPackage,
  type CatalogPlanGroup,
  type CatalogRegion,
  type CatalogSystemImage
} from '@/api/console-user'

function pick<T>(row: Record<string, any>, key: string, legacyKey?: string): T | undefined {
  return row[key] ?? (legacyKey ? row[legacyKey] : undefined)
}

export const useConsoleCatalogStore = defineStore('consoleCatalogStore', {
  state: () => ({
    goodsTypes: [] as CatalogGoodsType[],
    regions: [] as CatalogRegion[],
    lines: [] as CatalogPlanGroup[],
    planGroups: [] as CatalogPlanGroup[],
    packages: [] as CatalogPackage[],
    systemImages: [] as CatalogSystemImage[],
    billingCycles: [] as BillingCycle[],
    loading: false
  }),
  actions: {
    async fetchCatalog() {
      this.loading = true
      try {
        const data = await getCatalog()
        const rawGoodsTypes = data.goods_types || []
        const rawRegions = data.regions || []
        const rawLines = data.lines || []
        const rawGroups = data.plan_groups || []
        const rawPackages = data.packages || []
        const rawImages = data.system_images || []
        const rawCycles = data.billing_cycles || []

        this.goodsTypes = rawGoodsTypes.map((item) => {
          const row = item as Record<string, any>
          return {
            id: pick(row, 'id', 'ID'),
            code: pick(row, 'code', 'Code'),
            name: pick(row, 'name', 'Name'),
            active: pick(row, 'active', 'Active'),
            sort_order: pick(row, 'sort_order', 'SortOrder')
          }
        })

        this.regions = rawRegions.map((item) => {
          const row = item as Record<string, any>
          return {
            id: pick(row, 'id', 'ID'),
            goods_type_id: pick(row, 'goods_type_id', 'GoodsTypeID'),
            code: pick(row, 'code', 'Code'),
            name: pick(row, 'name', 'Name'),
            active: pick(row, 'active', 'Active'),
            visible: pick(row, 'visible', 'Visible')
          }
        })

        const normalizePlanGroup = (item: CatalogPlanGroup) => {
          const row = item as Record<string, any>
          return {
            id: pick<number>(row, 'id', 'ID'),
            goods_type_id: pick<number>(row, 'goods_type_id', 'GoodsTypeID'),
            region_id: pick<number>(row, 'region_id', 'RegionID'),
            line_id: pick<number>(row, 'line_id', 'LineID'),
            name: row.name ?? row.Name ?? row.line_name ?? row.LineName,
            unit_core: pick<number>(row, 'unit_core', 'UnitCore'),
            unit_mem: pick<number>(row, 'unit_mem', 'UnitMem'),
            unit_disk: pick<number>(row, 'unit_disk', 'UnitDisk'),
            unit_bw: pick<number>(row, 'unit_bw', 'UnitBW'),
            add_core_min: pick<number>(row, 'add_core_min', 'AddCoreMin'),
            add_core_max: pick<number>(row, 'add_core_max', 'AddCoreMax'),
            add_core_step: pick<number>(row, 'add_core_step', 'AddCoreStep'),
            add_mem_min: pick<number>(row, 'add_mem_min', 'AddMemMin'),
            add_mem_max: pick<number>(row, 'add_mem_max', 'AddMemMax'),
            add_mem_step: pick<number>(row, 'add_mem_step', 'AddMemStep'),
            add_disk_min: pick<number>(row, 'add_disk_min', 'AddDiskMin'),
            add_disk_max: pick<number>(row, 'add_disk_max', 'AddDiskMax'),
            add_disk_step: pick<number>(row, 'add_disk_step', 'AddDiskStep'),
            add_bw_min: pick<number>(row, 'add_bw_min', 'AddBwMin'),
            add_bw_max: pick<number>(row, 'add_bw_max', 'AddBwMax'),
            add_bw_step: pick<number>(row, 'add_bw_step', 'AddBwStep'),
            active: pick<boolean>(row, 'active', 'Active'),
            visible: pick<boolean>(row, 'visible', 'Visible'),
            capacity_remaining: pick<number>(row, 'capacity_remaining', 'CapacityRemaining')
          }
        }

        this.lines = (rawLines.length ? rawLines : rawGroups).map(normalizePlanGroup)
        this.planGroups = rawGroups.map(normalizePlanGroup)

        this.packages = rawPackages.map((item) => {
          const row = item as Record<string, any>
          return {
            id: pick(row, 'id', 'ID'),
            goods_type_id: pick(row, 'goods_type_id', 'GoodsTypeID'),
            plan_group_id: pick(row, 'plan_group_id', 'PlanGroupID'),
            name: pick(row, 'name', 'Name'),
            cores: pick(row, 'cores', 'Cores'),
            memory_gb: pick(row, 'memory_gb', 'MemoryGB'),
            disk_gb: pick(row, 'disk_gb', 'DiskGB'),
            bandwidth_mbps: row.bandwidth_mbps ?? row.BandwidthMB ?? row.BandwidthMbps,
            cpu_model: pick(row, 'cpu_model', 'CPUModel'),
            monthly_price: row.monthly_price ?? row.Monthly ?? row.monthly,
            port_num: pick(row, 'port_num', 'PortNum'),
            active: pick(row, 'active', 'Active'),
            visible: pick(row, 'visible', 'Visible'),
            capacity_remaining: pick(row, 'capacity_remaining', 'CapacityRemaining')
          }
        })

        this.systemImages = rawImages.map((item) => {
          const row = item as Record<string, any>
          return {
            id: pick(row, 'id', 'ID'),
            line_id: pick(row, 'line_id', 'LineID'),
            plan_group_id: pick(row, 'plan_group_id', 'PlanGroupID'),
            image_id: pick(row, 'image_id', 'ImageID'),
            name: pick(row, 'name', 'Name'),
            type: pick(row, 'type', 'Type'),
            enabled: pick(row, 'enabled', 'Enabled')
          }
        })

        this.billingCycles = rawCycles.map((item) => {
          const row = item as Record<string, any>
          return {
            id: pick(row, 'id', 'ID'),
            name: pick(row, 'name', 'Name'),
            months: pick(row, 'months', 'Months'),
            multiplier: pick(row, 'multiplier', 'Multiplier'),
            min_qty: pick(row, 'min_qty', 'MinQty'),
            max_qty: pick(row, 'max_qty', 'MaxQty'),
            active: pick(row, 'active', 'Active'),
            sort_order: pick(row, 'sort_order', 'SortOrder')
          }
        })
      } finally {
        this.loading = false
      }
    }
  }
})
