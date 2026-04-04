import type { Settings } from '~/types'
import { getSettings, saveSettings } from '~/adapters/localStorage'

const DEFAULT_SETTINGS: Settings = {
  itemLabel: 'Application',
  primaryFieldLabel: 'Company',
  secondaryFieldLabel: 'Position',
}

const ITEM_LABEL_PRESETS = [
  { label: 'Application', value: 'Application' },
  { label: 'Item', value: 'Item' },
  { label: 'Property', value: 'Property' },
  { label: 'Candidate', value: 'Candidate' },
  { label: 'Lead', value: 'Lead' },
  { label: 'Project', value: 'Project' },
]

const PRIMARY_FIELD_PRESETS = [
  { label: 'Company', value: 'Company' },
  { label: 'Name', value: 'Name' },
  { label: 'Title', value: 'Title' },
  { label: 'Organization', value: 'Organization' },
  { label: 'Client', value: 'Client' },
  { label: 'Contact', value: 'Contact' },
]

const SECONDARY_FIELD_PRESETS = [
  { label: 'Position', value: 'Position' },
  { label: 'Role', value: 'Role' },
  { label: 'Description', value: 'Description' },
  { label: 'Type', value: 'Type' },
  { label: 'Category', value: 'Category' },
  { label: 'Department', value: 'Department' },
]

export const useSettings = () => {
  const settings = useState<Settings>('settings', () => DEFAULT_SETTINGS)

  const loadSettings = () => {
    settings.value = getSettings()
  }

  const updateSettings = (newSettings: Partial<Settings>) => {
    settings.value = { ...settings.value, ...newSettings }
    saveSettings(settings.value)
  }

  return {
    settings: readonly(settings),
    loadSettings,
    updateSettings,
    ITEM_LABEL_PRESETS,
    PRIMARY_FIELD_PRESETS,
    SECONDARY_FIELD_PRESETS,
  }
}
