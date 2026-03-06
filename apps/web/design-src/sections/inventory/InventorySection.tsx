import '../../preview-theme.css'

import { useState } from 'react'
import sampleData from '../../../design/sections/inventory/data.json'
import type {
  InventorySortOption,
  ResinType,
} from '../../../design/sections/inventory/types'
import { InventoryListView } from './components/InventoryListView'

export default function InventorySection() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<InventorySortOption>('brand-asc')
  const [filterBrand, setFilterBrand] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<ResinType | null>(null)

  return (
    <InventoryListView
      resins={sampleData.sampleResins as import('../../../design/sections/inventory/types').InventoryResinItem[]}
      brands={sampleData.brands}
      types={sampleData.types as ResinType[]}
      search={search}
      sort={sort}
      filterBrand={filterBrand}
      filterType={filterType}
      onSearch={setSearch}
      onSortChange={setSort}
      onFilterBrand={setFilterBrand}
      onFilterType={setFilterType}
      onAddResin={() => console.log('[inventory] add resin')}
      onImportCSV={() => console.log('[inventory] import CSV')}
      onExportCSV={() => console.log('[inventory] export CSV')}
      onSelectResin={(id) => console.log('[inventory] select', id)}
      onDeleteResin={(id) => console.log('[inventory] delete', id)}
    />
  )
}
