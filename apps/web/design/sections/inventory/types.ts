/** Resin type classification */
export type ResinType = 'Esmalte' | 'Dentina' | 'Body' | 'Opaco' | 'Translúcido' | 'Universal'

/** Sort option for inventory list */
export type InventorySortOption = 'brand-asc' | 'shade-asc' | 'by-type'

/** A resin in the inventory */
export interface InventoryResinItem {
  id: string
  shade: string
  brand: string
  product_line: string
  type: ResinType
  opacity: string | null
  /** Hex color or CSS gradient for shade swatch */
  shadeColor: string
}
