export interface Item {
    id: number | string
    name: string
    stage: string
    notes?: string
    created_at: string
    updated_at?: string
    last_event_preview?: string | null
    last_comment_preview?: string | null
}

export interface InfoItem {
    id: number | string
    item_id: number | string
    tag?: string | null
    content?: string | null
    event_type?: 'transition' | 'comment' | null
    event_date?: string | null
    from_stage?: string | null
    to_stage?: string | null
    created_at: string
}

export interface ItemWithInfoItems extends Item {
    info_items: InfoItem[]
}

export interface Stage {
    id: number | string
    key: string
    label: string
    color: string
    order: number
}

export interface Settings {
    itemLabel: string
    primaryFieldLabel: string
}

export type ItemCreate = Omit<Item, 'id' | 'created_at' | 'updated_at' | 'last_event_preview'>
export type ItemUpdate = Partial<ItemCreate>
export type InfoItemCreate = Omit<InfoItem, 'id' | 'item_id' | 'created_at'>
export type InfoItemUpdate = Partial<InfoItemCreate>
