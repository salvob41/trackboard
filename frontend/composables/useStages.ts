import type { Stage } from '~/types'
import { storage } from '~/adapters/localStorage'

export const useStages = () => {
    const stages = useState<Stage[]>('stages', () => [])

    const loadStages = async () => {
        try {
            stages.value = await storage.getStages()
        } catch (error) {
            console.error('Failed to load stages:', error)
        }
    }

    const addStage = async (stage: Omit<Stage, 'id'>) => {
        const newStage = await storage.addStage(stage)
        stages.value = [...stages.value, newStage]
    }

    const updateStage = async (id: number | string, stage: Partial<Stage>) => {
        const updated = await storage.updateStage(id, stage)
        stages.value = stages.value.map(s => String(s.id) === String(id) ? updated : s)
    }

    const deleteStage = async (id: number | string) => {
        await storage.deleteStage(id)
        stages.value = stages.value.filter(s => String(s.id) !== String(id))
    }

    return {
        stages: readonly(stages),
        loadStages,
        addStage,
        updateStage,
        deleteStage,
    }
}
