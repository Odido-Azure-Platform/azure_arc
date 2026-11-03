targetScope = 'resourceGroup'

param name string
param location string
param tags object = {}

resource scope 'Microsoft.HybridCompute/privateLinkScopes@2022-12-27' = {
  name: name
  location: location
  tags: tags
  properties: {
    publicNetworkAccess: 'Disabled'
  }
}

output resourceId string = scope.id