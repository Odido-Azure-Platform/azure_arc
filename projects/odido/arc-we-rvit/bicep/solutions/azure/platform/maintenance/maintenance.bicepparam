using '../../../../../../../../bicep/solutions/azure/platform/maintenance/maintenance.bicep'

param location = 'westeurope'
param name = 'mc-arc-rvit-we-pilot'
param classification = 'RVIT'
param patchRing = 'pilot'
param startDateTime = 'REQUIRED_PATCH_START_LOCAL_TIME'
param timeZone = 'W. Europe Standard Time'
param recurEvery = 'REQUIRED_PATCH_RECURRENCE'
param duration = '03:00'
param rebootSetting = 'IfRequired'
param enableAssignment = false
param tags = { ManagedBy: 'Bicep' }
