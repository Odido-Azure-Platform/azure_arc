using '../../../../../../../../bicep/solutions/azure/platform/monitoring/monitoring.bicep'

param location = 'westeurope'
param workspaceName = 'law-arc-rvit-we'
param collectionNamePrefix = 'arc-rvit-we'
param retentionDays = 90
param windowsEventQueries = ['Application!*[System[(Level=1 or Level=2 or Level=3)]]']
param linuxFacilities = ['auth', 'authpriv']
param tags = { 'cmdb.Security.Class': 'RVIT', ManagedBy: 'Bicep' }
