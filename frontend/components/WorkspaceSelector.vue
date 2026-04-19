<template>
  <div class="flex items-center gap-1.5 flex-wrap">
    <button
      v-for="ws in workspaces"
      :key="ws.id"
      class="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
      :class="ws.id === activeWorkspace?.id
        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'"
      @click="handleClick(ws.id)"
    >
      {{ ws.name }}
    </button>
    <button
      class="px-2 py-1 rounded-md text-xs font-medium text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary transition-colors"
      title="New Board"
      @click="showCreate = true"
    >
      +
    </button>
    <WorkspaceCreateModal v-model="showCreate" />
  </div>
</template>

<script setup lang="ts">
const { workspaces, activeWorkspace, switchWorkspace } = useWorkspaces()
const showCreate = ref(false)

const handleClick = (id: string) => {
  if (id !== activeWorkspace.value?.id) {
    switchWorkspace(id)
  }
}
</script>
