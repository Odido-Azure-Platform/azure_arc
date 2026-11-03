using '../../../../../../../../bicep/solutions/azure/platform/maintenance/maintenance.bicep'

param location = 'westeurope'
param name = 'mc-arc-nrvit-we-pilot'
param classification = 'Non-RVIT'
param patchRing = 'pilot'
param startDateTime = readEnvironmentVariable('ARC_PATCH_START')
param timeZone = 'W. Europe Standard Time'
param recurEvery = readEnvironmentVariable('ARC_PATCH_RECURRENCE')
param enableAssignment = false
param tags = { ManagedBy: 'Bicep' }