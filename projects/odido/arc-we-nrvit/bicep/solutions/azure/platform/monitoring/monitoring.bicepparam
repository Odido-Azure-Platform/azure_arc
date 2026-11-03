using '../../../../../../../../bicep/solutions/azure/platform/monitoring/monitoring.bicep'

param location = 'westeurope'
param workspaceName = 'law-arc-nrvit-we'
param collectionNamePrefix = 'arc-nrvit-we'
param retentionDays = 90
param windowsEventQueries = ['Application!*[System[(Level=1 or Level=2 or Level=3)]]']
param linuxFacilities = ['auth', 'authpriv']
param tags = { 'cmdb.Security.Class': 'Non-RVIT', ManagedBy: 'Bicep' }
