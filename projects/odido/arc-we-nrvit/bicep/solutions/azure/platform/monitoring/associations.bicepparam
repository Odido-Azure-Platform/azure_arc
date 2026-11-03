using '../../../../../../../../bicep/solutions/azure/platform/monitoring/associations.bicep'

param location = 'westeurope'
param machines = [
	{ name: 'REQUIRED_WINDOWS_MACHINE_NAME', osType: 'Windows' }
	{ name: 'REQUIRED_LINUX_MACHINE_NAME', osType: 'Linux' }
]
param windowsRuleResourceId = 'REQUIRED_WINDOWS_DCR_RESOURCE_ID'
param linuxRuleResourceId = 'REQUIRED_LINUX_DCR_RESOURCE_ID'
param windowsEndpointResourceId = 'REQUIRED_WINDOWS_DCE_RESOURCE_ID'
param linuxEndpointResourceId = 'REQUIRED_LINUX_DCE_RESOURCE_ID'
