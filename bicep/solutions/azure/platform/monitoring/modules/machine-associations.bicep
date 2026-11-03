targetScope = 'resourceGroup'

param machineName string
@allowed(['Windows', 'Linux'])
param osType string
param location string
param ruleResourceId string
param endpointResourceId string

resource machine 'Microsoft.HybridCompute/machines@2024-07-10' existing = {
  name: machineName
}

module agent 'br/public:avm/res/hybrid-compute/machine/extension:0.2.0' = {
  params: {
    arcMachineName: machine.name
    name: 'AzureMonitor${osType}Agent'
    location: location
    publisher: 'Microsoft.Azure.Monitor'
    type: 'AzureMonitor${osType}Agent'
    typeHandlerVersion: '1.0'
    autoUpgradeMinorVersion: true
    enableAutomaticUpgrade: true
  }
}

resource ruleAssociation 'Microsoft.Insights/dataCollectionRuleAssociations@2023-03-11' = {
  name: 'arc-monitoring-rule'
  scope: machine
  properties: { dataCollectionRuleId: ruleResourceId }
}

resource endpointAssociation 'Microsoft.Insights/dataCollectionRuleAssociations@2023-03-11' = {
  name: 'configurationAccessEndpoint'
  scope: machine
  properties: { dataCollectionEndpointId: endpointResourceId }
}

output agentResourceId string = agent.outputs.resourceId
