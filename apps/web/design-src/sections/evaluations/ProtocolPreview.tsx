/* eslint-disable no-console */
import '../../preview-theme.css'
import { ProtocolView } from './components'
import type { ProtocolData } from '../../../design/sections/evaluations/types'
import sampleData from '../../../design/sections/evaluations/data.json'

export default function ProtocolPreview() {
  return (
    <ProtocolView
      protocol={sampleData.sampleProtocol as ProtocolData}
      onRecalculate={() => console.log('recalculate')}
      onDownloadPDF={() => console.log('download pdf')}
      onNewCase={() => console.log('new case')}
    />
  )
}
