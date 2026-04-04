import type { Settings } from '~/types'
import { storage } from '~/adapters/localStorage'

const DEFAULT_SETTINGS: Settings = {
  itemLabel: 'Application',
  primaryFieldLabel: 'Company',
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

export const useSettings = () => {
  const settings = useState<Settings>('settings', () => DEFAULT_SETTINGS)

  const loadSettings = () => {
    settings.value = storage.getSettings()
  }

  const updateSettings = (newSettings: Partial<Settings>) => {
    settings.value = { ...settings.value, ...newSettings }
    storage.saveSettings(settings.value)
  }

  return {
    settings: readonly(settings),
    loadSettings,
    updateSettings,
    ITEM_LABEL_PRESETS,
    PRIMARY_FIELD_PRESETS,
  }
}
