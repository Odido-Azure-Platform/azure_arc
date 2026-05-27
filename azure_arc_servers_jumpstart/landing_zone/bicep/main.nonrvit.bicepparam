using './main.bicep'

param landingZoneName = 'odido-arc-we-nrvit'

param governanceTier = 'NonRVIT'

param location = 'westeurope'

param logAnalyticsWorkspaceName = 'odido-nrvit-law'

param resourceTags = {
  'subscription-name': 'odido-arc-we-nrvit'
  'subscription-id': 'd9ccab7c-c37c-433f-83de-b850224221b1'
  'server-boundary': 'NonRVIT'
  'governance-tier': 'NonRVIT'
  'owner-team': 'cloud-infra'
}