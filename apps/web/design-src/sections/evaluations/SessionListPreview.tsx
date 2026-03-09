/* eslint-disable no-console */
import '../../preview-theme.css'
import { SessionList } from './components'
import type { EvalSession } from '../../../design/sections/evaluations/types'
import sampleData from '../../../design/sections/evaluations/data.json'

export default function SessionListPreview() {
  return (
    <SessionList
      sessions={sampleData.sampleSessions as EvalSession[]}
      onNewCase={() => console.log('new case')}
      onSelectSession={(id) => console.log('select session', id)}
    />
  )
}
