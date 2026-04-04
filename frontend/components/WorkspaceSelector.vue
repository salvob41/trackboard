<template>
  <div class="flex items-center gap-2">
    <USelectMenu
      :model-value="activeWorkspace?.id"
      :options="workspaceOptions"
      value-attribute="value"
      option-attribute="label"
      size="sm"
      class="w-48"
      @update:model-value="handleSelect"
    >
      <template #label>
        <span class="truncate">{{ activeWorkspace?.name || 'Workspace' }}</span>
      </template>
    </USelectMenu>
    <UButton
      icon="i-heroicons-plus"
      size="xs"
      color="gray"
      variant="ghost"
      @click="$emit('create')"
    />
  </div>
</template>

<script setup lang="ts">
const { workspaces, activeWorkspace, switchWorkspace } = useWorkspaces()

const workspaceOptions = computed(() =>
  workspaces.value.map(ws => ({
    label: ws.name,
    value: ws.id,
  }))
)

const handleSelect = (id: string) => {
  if (id !== activeWorkspace.value?.id) {
    switchWorkspace(id)
  }
}

defineEmits<{
  create: []
}>()
</script>
