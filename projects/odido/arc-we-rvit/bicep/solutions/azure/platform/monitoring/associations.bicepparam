using '../../../../../../../../bicep/solutions/azure/platform/monitoring/associations.bicep'

param location = 'westeurope'
param machines = json(readEnvironmentVariable('ARC_MACHINES'))
param windowsRuleResourceId = readEnvironmentVariable('ARC_WINDOWS_DCR_ID')
param linuxRuleResourceId = readEnvironmentVariable('ARC_LINUX_DCR_ID')
param windowsEndpointResourceId = readEnvironmentVariable('ARC_WINDOWS_DCE_ID')
param linuxEndpointResourceId = readEnvironmentVariable('ARC_LINUX_DCE_ID')