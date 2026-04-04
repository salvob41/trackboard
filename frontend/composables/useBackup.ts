import { getActiveWorkspaceId } from '~/adapters/localStorage'

function backupKey() { return `app-tracker:${getActiveWorkspaceId()}:last-backup` }
function changesKey() { return `app-tracker:${getActiveWorkspaceId()}:changes-since-backup` }
function firstVisitKey() { return `app-tracker:${getActiveWorkspaceId()}:first-visit-acknowledged` }

const DAYS_THRESHOLD = 7
const CHANGES_THRESHOLD = 10

export function useBackup() {
  const lastBackupDate = ref<Date | null>(null)
  const changesSinceBackup = ref(0)
  const firstVisitAcknowledged = ref(true)

  const loadBackupState = () => {
    if (import.meta.server) return

    const stored = localStorage.getItem(backupKey())
    lastBackupDate.value = stored ? new Date(stored) : null

    const changes = localStorage.getItem(changesKey())
    changesSinceBackup.value = changes ? parseInt(changes, 10) : 0

    firstVisitAcknowledged.value = localStorage.getItem(firstVisitKey()) === 'true'
  }

  const recordBackup = () => {
    if (import.meta.server) return

    const now = new Date()
    localStorage.setItem(backupKey(), now.toISOString())
    localStorage.setItem(changesKey(), '0')
    lastBackupDate.value = now
    changesSinceBackup.value = 0
  }

  const recordChange = () => {
    if (import.meta.server) return

    const newCount = changesSinceBackup.value + 1
    localStorage.setItem(changesKey(), newCount.toString())
    changesSinceBackup.value = newCount
  }

  const acknowledgeFirstVisit = () => {
    if (import.meta.server) return

    localStorage.setItem(firstVisitKey(), 'true')
    firstVisitAcknowledged.value = true
  }

  const daysSinceBackup = computed(() => {
    if (!lastBackupDate.value) return null
    const now = new Date()
    const diff = now.getTime() - lastBackupDate.value.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  })

  const shouldShowReminder = computed(() => {
    if (!lastBackupDate.value && changesSinceBackup.value > 0) return true
    if (daysSinceBackup.value !== null && daysSinceBackup.value >= DAYS_THRESHOLD) return true
    if (changesSinceBackup.value >= CHANGES_THRESHOLD) return true
    return false
  })

  const shouldShowFirstVisitNotice = computed(() => {
    return !firstVisitAcknowledged.value
  })

  const lastBackupFormatted = computed(() => {
    if (!lastBackupDate.value) return 'Never'

    const days = daysSinceBackup.value
    if (days === null) return 'Never'
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
    return lastBackupDate.value.toLocaleDateString()
  })

  onMounted(() => {
    loadBackupState()
  })

  return {
    lastBackupDate,
    lastBackupFormatted,
    daysSinceBackup,
    changesSinceBackup,
    shouldShowReminder,
    shouldShowFirstVisitNotice,
    firstVisitAcknowledged,
    recordBackup,
    recordChange,
    acknowledgeFirstVisit,
    loadBackupState,
  }
}
