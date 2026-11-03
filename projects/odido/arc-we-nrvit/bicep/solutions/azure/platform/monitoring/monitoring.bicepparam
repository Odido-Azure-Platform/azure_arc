using '../../../../../../../../bicep/solutions/azure/platform/monitoring/monitoring.bicep'

param location = 'westeurope'
param workspaceName = 'law-arc-nrvit-we'
param collectionNamePrefix = 'arc-nrvit-we'
param retentionDays = 90
param tags = { 'cmdb.Security.Class': 'Non-RVIT', ManagedBy: 'Bicep' }