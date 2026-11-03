targetScope = 'resourceGroup'

param location string
param arcScopeName string
param monitorScopeName string

@description('Existing class-specific subnet. Its VNet must not already use another Arc scope.')
@minLength(1)
param subnetResourceId string

@description('Existing DNS zones approved for Arc; no zones or shared VNet links are recreated.')
@minLength(1)
param arcDnsZoneResourceIds string[]

@description('Existing Azure Monitor private DNS zones approved for this DNS boundary.')
@minLength(1)
param monitorDnsZoneResourceIds string[]

@minLength(1)
param workspaceResourceId string

@minLength(1)
param endpointResourceIds string[]
param tags object = {}

var endpointLinks = [for (endpointId, index) in endpointResourceIds: {
  name: 'dce-${index}'
  linkedResourceId: endpointId
}]

module arcScope 'modules/arc-private-link-scope.bicep' = {
  params: {
    name: arcScopeName
    location: location
    tags: tags
  }
}

module arcEndpoint 'br/public:avm/res/network/private-endpoint:0.12.1' = {
  params: {
    name: 'pe-${arcScopeName}'
    location: location
    subnetResourceId: subnetResourceId
    privateLinkServiceConnections: [
      {
        name: arcScopeName
        properties: {
          privateLinkServiceId: arcScope.outputs.resourceId
          groupIds: ['hybridcompute']
        }
      }
    ]
    privateDnsZoneGroup: {
      name: 'default'
      privateDnsZoneGroupConfigs: [for zoneId in arcDnsZoneResourceIds: { privateDnsZoneResourceId: zoneId }]
    }
    tags: tags
    enableTelemetry: false
  }
}

module monitorScope 'br/public:avm/res/insights/private-link-scope:0.7.3' = {
  params: {
    name: monitorScopeName
    location: 'global'
    accessModeSettings: {
      ingestionAccessMode: 'PrivateOnly'
      queryAccessMode: 'PrivateOnly'
    }
    scopedResources: concat([
      { name: 'workspace', linkedResourceId: workspaceResourceId }
    ], endpointLinks)
    privateEndpoints: [
      {
        name: 'pe-${monitorScopeName}'
        location: location
        subnetResourceId: subnetResourceId
        privateDnsZoneGroup: {
          name: 'default'
          privateDnsZoneGroupConfigs: [for zoneId in monitorDnsZoneResourceIds: { privateDnsZoneResourceId: zoneId }]
        }
        enableTelemetry: false
      }
    ]
    tags: tags
    enableTelemetry: false
  }
}

output arcScopeResourceId string = arcScope.outputs.resourceId
output arcEndpointResourceId string = arcEndpoint.outputs.resourceId
output monitorScopeResourceId string = monitorScope.outputs.resourceId