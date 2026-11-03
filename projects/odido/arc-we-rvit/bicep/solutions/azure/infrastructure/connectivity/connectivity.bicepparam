using '../../../../../../../../bicep/solutions/azure/infrastructure/connectivity/connectivity.bicep'

param location = 'westeurope'
param arcScopeName = 'alpls-arc-rvit-we'
param monitorScopeName = 'ampls-arc-rvit-we'
param subnetResourceId = 'REQUIRED_PRIVATE_ENDPOINT_SUBNET_RESOURCE_ID'
param arcDnsZoneResourceIds = ['REQUIRED_ARC_PRIVATE_DNS_ZONE_RESOURCE_ID']
param monitorDnsZoneResourceIds = ['REQUIRED_MONITOR_PRIVATE_DNS_ZONE_RESOURCE_ID']
param workspaceResourceId = 'REQUIRED_WORKSPACE_RESOURCE_ID'
param endpointResourceIds = [
	'REQUIRED_WINDOWS_DCE_RESOURCE_ID'
	'REQUIRED_LINUX_DCE_RESOURCE_ID'
]
param tags = { 'cmdb.Security.Class': 'RVIT', ManagedBy: 'Bicep' }
