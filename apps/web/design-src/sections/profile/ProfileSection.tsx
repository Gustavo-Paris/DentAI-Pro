import '../../preview-theme.css'

import { useState } from 'react'
import sampleData from '../../../design/sections/profile/data.json'
import type {
  ProfileTabId,
  UserProfile,
  SubscriptionInfo,
  CreditPack,
  PaymentRecord,
  ReferralInfo,
} from '../../../design/sections/profile/types'
import { ProfileView } from './components/ProfileView'

export default function ProfileSection() {
  const [activeTab, setActiveTab] = useState<ProfileTabId>('perfil')

  return (
    <ProfileView
      activeTab={activeTab}
      profile={sampleData.sampleProfile as UserProfile}
      subscription={sampleData.sampleSubscription as SubscriptionInfo}
      creditPacks={sampleData.sampleCreditPacks as CreditPack[]}
      payments={sampleData.samplePayments as PaymentRecord[]}
      referral={sampleData.sampleReferral as ReferralInfo}
      onTabChange={setActiveTab}
      onSaveProfile={(data) => console.log('[profile] save', data)}
      onUploadAvatar={() => console.log('[profile] upload avatar')}
      onUploadLogo={() => console.log('[profile] upload logo')}
      onBuyPack={(id) => console.log('[profile] buy pack', id)}
      onManageSubscription={() => console.log('[profile] manage subscription')}
      onDownloadInvoice={(id) => console.log('[profile] download invoice', id)}
      onExportPayments={() => console.log('[profile] export payments')}
      onExportData={() => console.log('[profile] export data')}
      onDeleteAccount={() => console.log('[profile] delete account')}
      onShareReferral={() => console.log('[profile] share referral')}
      onCopyReferralCode={() => console.log('[profile] copy referral code')}
    />
  )
}
