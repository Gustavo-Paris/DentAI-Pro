/* eslint-disable no-console */
import '../../preview-theme.css'
import { SessionDetail } from './components'
import type { SessionHeader, EvalItem } from '../../../design/sections/evaluations/types'
import sampleData from '../../../design/sections/evaluations/data.json'

export default function SessionDetailPreview() {
  return (
    <SessionDetail
      header={sampleData.sampleSessionHeader as SessionHeader}
      evaluations={sampleData.sampleEvaluations as EvalItem[]}
      onBack={() => console.log('back')}
      onShare={() => console.log('share')}
      onWhatsApp={() => console.log('whatsapp')}
      onCompleteAll={() => console.log('complete all')}
      onDelete={() => console.log('delete')}
      onViewProtocol={(id) => console.log('view protocol', id)}
      onAddTeeth={() => console.log('add teeth')}
      onBulkComplete={(ids) => console.log('bulk complete', ids)}
    />
  )
}
