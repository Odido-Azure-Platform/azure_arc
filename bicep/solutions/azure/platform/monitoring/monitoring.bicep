targetScope = 'resourceGroup'

param location string
param workspaceName string
param collectionNamePrefix string
param tags object = {}

@minValue(30)
@maxValue(730)
param retentionDays int = 30

@description('Windows event queries approved for collection. Security logs require a separate review.')
@minLength(1)
param windowsEventQueries string[] = [
  'Application!*[System[(Level=1 or Level=2 or Level=3)]]'
]

@description('Linux facilities approved for collection at warning severity or higher.')
@minLength(1)
param linuxFacilities string[] = [
  'auth'
  'authpriv'
]

module workspace 'br/public:avm/res/operational-insights/workspace:0.16.1' = {
  params: {
    name: workspaceName
    location: location
    skuName: 'PerGB2018'
    dataRetention: retentionDays
    publicNetworkAccessForIngestion: 'Disabled'
    publicNetworkAccessForQuery: 'Disabled'
    features: {
      disableLocalAuth: true
      enableLogAccessUsingOnlyResourcePermissions: false
    }
    tags: tags
    enableTelemetry: false
  }
}

var operatingSystems = ['Windows', 'Linux']

module endpoints 'br/public:avm/res/insights/data-collection-endpoint:0.5.1' = [for operatingSystem in operatingSystems: {
  params: {
    name: '${collectionNamePrefix}-${toLower(operatingSystem)}-dce'
    location: location
    kind: operatingSystem
    publicNetworkAccess: 'Disabled'
    tags: tags
    enableTelemetry: false
  }
}]

module windowsRule 'br/public:avm/res/insights/data-collection-rule:0.11.0' = {
  params: {
    name: '${collectionNamePrefix}-windows-dcr'
    location: location
    dataCollectionRuleProperties: {
      kind: 'Windows'
      dataCollectionEndpointResourceId: endpoints[0].outputs.resourceId
      dataSources: {
        windowsEventLogs: [
          {
            name: 'approvedWindowsEvents'
            streams: ['Microsoft-Event']
            xPathQueries: windowsEventQueries
          }
        ]
      }
      destinations: {
        logAnalytics: [{ name: 'classWorkspace', workspaceResourceId: workspace.outputs.resourceId }]
      }
      dataFlows: [{ streams: ['Microsoft-Event'], destinations: ['classWorkspace'] }]
    }
    tags: tags
    enableTelemetry: false
  }
}

module linuxRule 'br/public:avm/res/insights/data-collection-rule:0.11.0' = {
  params: {
    name: '${collectionNamePrefix}-linux-dcr'
    location: location
    dataCollectionRuleProperties: {
      kind: 'Linux'
      dataCollectionEndpointResourceId: endpoints[1].outputs.resourceId
      dataSources: {
        syslog: [
          {
            name: 'approvedLinuxSyslog'
            streams: ['Microsoft-Syslog']
            facilityNames: linuxFacilities
            logLevels: ['Warning', 'Error', 'Critical', 'Alert', 'Emergency']
          }
        ]
      }
      destinations: {
        logAnalytics: [{ name: 'classWorkspace', workspaceResourceId: workspace.outputs.resourceId }]
      }
      dataFlows: [{ streams: ['Microsoft-Syslog'], destinations: ['classWorkspace'] }]
    }
    tags: tags
    enableTelemetry: false
  }
}

output workspaceResourceId string = workspace.outputs.resourceId
output windowsEndpointResourceId string = endpoints[0].outputs.resourceId
output linuxEndpointResourceId string = endpoints[1].outputs.resourceId
output windowsRuleResourceId string = windowsRule.outputs.resourceId
output linuxRuleResourceId string = linuxRule.outputs.resourceId