using '../../../../../../../../bicep/solutions/azure/platform/monitoring/monitoring.bicep'

param location = 'westeurope'
param workspaceName = 'law-arc-rvit-we'
param collectionNamePrefix = 'arc-rvit-we'
param retentionDays = 90
param tags = { 'cmdb.Security.Class': 'RVIT', ManagedBy: 'Bicep' }