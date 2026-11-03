using '../../../../../../../../bicep/solutions/azure/infrastructure/connectivity/connectivity.bicep'

param location = 'westeurope'
param arcScopeName = 'alpls-arc-nrvit-we'
param monitorScopeName = 'ampls-arc-nrvit-we'
param subnetResourceId = readEnvironmentVariable('ARC_SUBNET_ID')
param arcDnsZoneResourceIds = json(readEnvironmentVariable('ARC_DNS_ZONE_IDS'))
param monitorDnsZoneResourceIds = json(readEnvironmentVariable('ARC_MONITOR_DNS_ZONE_IDS'))
param workspaceResourceId = readEnvironmentVariable('ARC_WORKSPACE_ID')
param endpointResourceIds = json(readEnvironmentVariable('ARC_DCE_IDS'))
param tags = { 'cmdb.Security.Class': 'Non-RVIT', ManagedBy: 'Bicep' }