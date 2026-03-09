/* eslint-disable no-console */
import '../../preview-theme.css'

import { useState } from 'react'
import sampleData from '../../../design/sections/patients/data.json'
import type { PatientSortOption } from '../../../design/sections/patients/types'
import { PatientListView } from './components/PatientListView'
import { PatientProfileView } from './components/PatientProfileView'

type View = 'list' | 'profile'

export default function PatientsSection() {
  const [view, setView] = useState<View>('list')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<PatientSortOption>('recent')

  if (view === 'profile') {
    return (
      <PatientProfileView
        profile={sampleData.sampleProfile}
        metrics={sampleData.sampleMetrics}
        sessions={sampleData.sampleSessions}
        onBack={() => setView('list')}
        onEdit={() => console.log('[patients] edit profile')}
        onNewSession={() => console.log('[patients] new session')}
        onSelectSession={(id) => console.log('[patients] select session', id)}
      />
    )
  }

  return (
    <PatientListView
      patients={sampleData.samplePatients}
      search={search}
      sort={sort}
      currentPage={1}
      totalPages={1}
      onSearch={setSearch}
      onSortChange={setSort}
      onPageChange={(p) => console.log('[patients] page', p)}
      onNewPatient={() => console.log('[patients] new patient')}
      onSelectPatient={() => setView('profile')}
    />
  )
}
