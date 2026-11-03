targetScope = 'subscription'

@description('Azure region for the class resource groups.')
param location string

@allowed([
  'RVIT'
  'Non-RVIT'
])
@description('Authoritative CMDB classification for this subscription.')
param classification string

@description('Names of the resource groups owned by the Arc platform.')
param resourceGroups {
  ops: string
  monitor: string
  pls: string
}

@description('Additional organizational tags. Classification cannot be overridden.')
param tags object = {}

var groupDefinitions = [
  { name: resourceGroups.ops, purpose: 'operations' }
  { name: resourceGroups.monitor, purpose: 'monitoring' }
  { name: resourceGroups.pls, purpose: 'connectivity' }
]

module groups 'br/public:avm/res/resources/resource-group:0.4.4' = [for group in groupDefinitions: {
  params: {
    name: group.name
    location: location
    tags: union(tags, {
      'cmdb.Security.Class': classification
      Purpose: group.purpose
    })
    enableTelemetry: false
  }
}]

output resourceGroupIds array = [for (group, index) in groupDefinitions: groups[index].outputs.resourceId]
