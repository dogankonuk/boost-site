'use client'
import ApplicationForm from '@/components/ApplicationForm'

const EXTRA_FIELDS = [
  { key: 'platforms', label: 'Are you active on any platforms? (optional)', type: 'text', placeholder: 'YouTube, Twitch, Twitter, your own blog...' },
  { key: 'portfolioLinks', label: 'Links to writing samples or past work (optional)', type: 'textarea', placeholder: 'One link per line' },
]

export default function ContentCreatorApplyPage() {
  return (
    <ApplicationForm
      type="content_creator"
      title="Become a Content Creator"
      intro="Write guides, updates, and playthroughs for our blog. Fill out the form below to apply."
      extraFields={EXTRA_FIELDS}
      roleLabel="content creator"
    />
  )
}
