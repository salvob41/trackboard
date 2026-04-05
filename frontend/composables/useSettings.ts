import type { Settings } from '~/types'
import { storage } from '~/adapters/localStorage'

const DEFAULT_SETTINGS: Settings = {
  itemLabel: 'Application',
  primaryFieldLabel: 'Company',
  secondaryFieldLabel: 'Role',
  showSecondaryOnCard: true,
  enableImages: true,
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
  { label: 'Role', value: 'Role' },
  { label: 'Price', value: 'Price' },
  { label: 'Contact', value: 'Contact' },
  { label: 'Owner', value: 'Owner' },
  { label: 'Details', value: 'Details' },
  { label: 'Type', value: 'Type' },
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
    SECONDARY_FIELD_PRESETS,
    DEFAULT_SETTINGS,
  }
}
