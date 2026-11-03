using '../../../../../../../../bicep/solutions/azure/infrastructure/foundation/foundation.bicep'

param location = 'westeurope'
param classification = 'RVIT'
param resourceGroups = {
  ops: 'rg-arc-rvit-we-ops'
  monitor: 'rg-arc-rvit-we-monitor'
  pls: 'rg-arc-rvit-we-pls'
}
param tags = { ManagedBy: 'Bicep', Project: 'AzureArc' }
