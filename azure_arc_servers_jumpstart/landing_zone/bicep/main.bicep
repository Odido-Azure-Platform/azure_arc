targetScope = 'subscription'

@description('Friendly landing-zone name used for the resource group and shared naming.')
param landingZoneName string

@allowed([
  'RVIT'
  'NonRVIT'
])
@description('Governance tier for the landing zone. RVIT is the stricter boundary.')
param governanceTier string = 'RVIT'

@description('Azure region for the landing-zone resource group and managed resources.')
param location string = deployment().location

@description('Log Analytics workspace name for this landing zone.')
param logAnalyticsWorkspaceName string

@description('Log Analytics SKU.')
@allowed([
  'PerGB2018'
  'CapacityReservation'
  'LACluster'
])
param logAnalyticsSku string = 'PerGB2018'

@description('Additional tags applied to the landing-zone resources.')
param resourceTags object = {}

var landingZoneResourceGroupName = '${landingZoneName}-rg'
var effectiveResourceTags = union(resourceTags, {
  'landing-zone': landingZoneName
  'governance-tier': governanceTier
})

resource landingZoneResourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: landingZoneResourceGroupName
  location: location
  tags: effectiveResourceTags
}

resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsWorkspaceName
  scope: landingZoneResourceGroup
  location: location
  tags: effectiveResourceTags
  properties: {
    sku: {
      name: logAnalyticsSku
    }
  }
}

module policyDeployment '../../../azure_jumpstart_arcbox/bicep/mgmt/policyAzureArc.bicep' = {
  name: '${landingZoneName}-policy'
  scope: landingZoneResourceGroup
  params: {
    azureLocation: location
    logAnalyticsWorkspaceId: workspace.id
    flavor: 'ITPro'
    governanceTier: governanceTier
    resourceTags: effectiveResourceTags
  }
}

output landingZoneResourceGroupName string = landingZoneResourceGroup.name
output governanceTierApplied string = governanceTier
output logAnalyticsWorkspace string = logAnalyticsWorkspaceName
output logAnalyticsWorkspaceId string = workspace.id