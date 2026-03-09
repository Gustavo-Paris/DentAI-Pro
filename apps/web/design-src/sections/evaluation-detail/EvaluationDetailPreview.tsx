/* eslint-disable no-console */
import '../../preview-theme.css'
import { EvaluationDetail } from './components'
import type {
  SessionHeader,
  TreatmentGroup,
} from '../../../design/sections/evaluation-detail/types'
import sampleData from '../../../design/sections/evaluation-detail/data.json'

export default function EvaluationDetailPreview() {
  return (
    <EvaluationDetail
      session={sampleData.sessionHeader as SessionHeader}
      groups={sampleData.treatmentGroups as TreatmentGroup[]}
      onBack={() => console.log('back')}
      onNewEvaluation={() => console.log('new evaluation')}
      onShare={() => console.log('share')}
      onAddTeeth={() => console.log('add teeth')}
      onMarkAllCompleted={() => console.log('mark all completed')}
      onDeleteSession={() => console.log('delete session')}
      onSelectEvaluation={(id) => console.log('select evaluation', id)}
      onBulkComplete={(ids) => console.log('bulk complete', ids)}
    />
  )
}
