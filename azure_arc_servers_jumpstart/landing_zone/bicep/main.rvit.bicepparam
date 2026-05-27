using './main.bicep'

param landingZoneName = 'odido-arc-we-rvit'

param governanceTier = 'RVIT'

param location = 'westeurope'

param logAnalyticsWorkspaceName = 'odido-rvit-law'

param resourceTags = {
  'subscription-name': 'odido-arc-we-rvit'
  'subscription-id': '8aac99c9-a4e4-48dc-8f93-9ebebfb14750'
  'server-boundary': 'RVIT'
  'governance-tier': 'RVIT'
  'owner-team': 'cloud-infra'
}