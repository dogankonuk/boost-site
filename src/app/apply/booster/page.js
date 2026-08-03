'use client'
import ApplicationForm from '@/components/ApplicationForm'

const EXTRA_FIELDS = [
  { key: 'hoursPerDay', label: 'How many hours a day do you plan to work on orders?', type: 'radio', options: ['Less than 4 hours', 'Less than 8 hours', 'More than 8 hours'] },
  { key: 'canStream', label: 'Can you stream orders if needed?', type: 'radio', options: ['Yes', 'No'] },
  { key: 'remoteTools', label: 'Do you have TeamViewer and/or Parsec installed?', type: 'radio', options: ['Yes, both', 'Just TeamViewer', 'Just Parsec', 'Neither'] },
  { key: 'vpn', label: 'What VPN do you use?', type: 'text', placeholder: 'e.g. NordVPN, ExpressVPN...' },
  { key: 'country', label: 'Where are you from?', type: 'text', placeholder: 'Country' },
]

export default function BoosterApplyPage() {
  return (
    <ApplicationForm
      type="booster"
      title="Become a Booster"
      intro="Fill out the form below to apply. Incomplete or inaccurate applications may be declined."
      extraFields={EXTRA_FIELDS}
      roleLabel="booster"
    />
  )
}
