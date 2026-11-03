targetScope = 'resourceGroup'

param location string
@description('Approved pilot inventory. Each machine must already exist in this operations RG.')
@minLength(1)
param machines {
  name: string
  osType: 'Windows' | 'Linux'
}[]
param windowsRuleResourceId string
param linuxRuleResourceId string
param windowsEndpointResourceId string
param linuxEndpointResourceId string

module associations 'modules/machine-associations.bicep' = [for machine in machines: {
  params: {
    machineName: machine.name
    osType: machine.osType
    location: location
    ruleResourceId: machine.osType == 'Windows' ? windowsRuleResourceId : linuxRuleResourceId
    endpointResourceId: machine.osType == 'Windows' ? windowsEndpointResourceId : linuxEndpointResourceId
  }
}]