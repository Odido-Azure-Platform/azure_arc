targetScope = 'resourceGroup'

param location string
param name string
@allowed(['RVIT', 'Non-RVIT'])
param classification string
@minLength(1)
param patchRing string
@description('Approved local start time in yyyy-MM-dd HH:mm format; never default to a live schedule.')
param startDateTime string
@description('Windows time zone ID supported by Maintenance Configurations, for example W. Europe Standard Time.')
param timeZone string
param recurEvery string
param duration string = '03:00'
@allowed(['Never', 'IfRequired'])
param rebootSetting string = 'IfRequired'
@description('Create a window without targeting hosts until the pilot is approved.')
param enableAssignment bool = false
param tags object = {}

module window 'br/public:avm/res/maintenance/maintenance-configuration:0.4.0' = {
  params: {
    name: name
    location: location
    maintenanceScope: 'InGuestPatch'
    extensionProperties: { InGuestPatchMode: 'User' }
    maintenanceWindow: {
      startDateTime: startDateTime
      timeZone: timeZone
      recurEvery: recurEvery
      duration: duration
    }
    installPatches: {
      rebootSetting: rebootSetting
      windowsParameters: { classificationsToInclude: ['Critical', 'Security'] }
      linuxParameters: { classificationsToInclude: ['Critical', 'Security'] }
    }
    tags: union(tags, { 'cmdb.Security.Class': classification })
    enableTelemetry: false
  }
}

module assignment 'br/public:avm/res/maintenance/configuration-assignment:0.2.1' = if (enableAssignment) {
  params: {
    name: '${name}-ring'
    location: location
    maintenanceConfigurationResourceId: window.outputs.resourceId
    filter: {
      resourceGroups: [resourceGroup().name]
      resourceTypes: ['Microsoft.HybridCompute/machines']
      locations: [location]
      osTypes: ['Windows', 'Linux']
      tagSettings: {
        filterOperator: 'All'
        tags: {
          'cmdb.Security.Class': [classification]
          PatchRing: [patchRing]
        }
      }
    }
    enableTelemetry: false
  }
}

output maintenanceConfigurationResourceId string = window.outputs.resourceId