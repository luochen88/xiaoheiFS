import { listSettings, updateSetting } from '@/services/admin'
import { useAuth } from '@/hooks/core/useAuth'

export interface SettingUpdate {
  key: string
  value: string
}

export type SettingValueMap = Map<string, unknown>

export function useAdminPermissions() {
  const { hasAuth } = useAuth()
  const hasPermission = (...marks: string[]) => computed(() => marks.some((mark) => hasAuth(mark)))

  return { hasPermission }
}

export async function fetchSettingMap(): Promise<SettingValueMap> {
  const response = await listSettings()
  const items = response.data?.items ?? []
  const map: SettingValueMap = new Map()

  items.forEach((item) => {
    const record = item as typeof item & {
      Key?: string
      Value?: string
      ValueJSON?: string
    }
    const key = String(record.key ?? record.Key ?? '')
    if (!key) return
    map.set(key, record.value_json ?? record.ValueJSON ?? record.value ?? record.Value ?? '')
  })

  return map
}

export async function saveSettingItems(items: SettingUpdate[]): Promise<void> {
  await updateSetting({ items })
}

export function settingString(map: SettingValueMap, key: string, fallback = ''): string {
  const value = map.get(key)
  return value === undefined || value === null || value === '' ? fallback : String(value)
}

export function settingBoolean(map: SettingValueMap, key: string, fallback = false): boolean {
  const value = map.get(key)
  if (value === undefined || value === null || value === '') return fallback
  return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'
}

export function settingNumber(map: SettingValueMap, key: string, fallback = 0): number {
  const value = Number(map.get(key))
  return Number.isFinite(value) ? value : fallback
}

export function settingInteger(map: SettingValueMap, key: string, fallback = 0): number {
  return Math.trunc(settingNumber(map, key, fallback))
}

export function settingList(map: SettingValueMap, key: string, fallback: string[] = []): string[] {
  const value = map.get(key)
  if (Array.isArray(value)) return value.map(String)
  if (!value) return [...fallback]

  try {
    const parsed = JSON.parse(String(value))
    return Array.isArray(parsed) ? parsed.map(String) : [...fallback]
  } catch {
    return [...fallback]
  }
}

export function booleanSetting(key: string, value: boolean): SettingUpdate {
  return { key, value: String(value) }
}

export function stringSetting(key: string, value: unknown): SettingUpdate {
  return { key, value: String(value ?? '') }
}

export function sectionItem(key: string, label: string) {
  return { key, label: '', span: 24, render: () => h('div', { class: 'settings-section' }, label) }
}
