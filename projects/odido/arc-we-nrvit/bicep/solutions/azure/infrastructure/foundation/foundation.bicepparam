using '../../../../../../../../bicep/solutions/azure/infrastructure/foundation/foundation.bicep'

param location = 'westeurope'
param classification = 'Non-RVIT'
param resourceGroups = {
  ops: 'rg-arc-nrvit-we-ops'
  monitor: 'rg-arc-nrvit-we-monitor'
  pls: 'rg-arc-nrvit-we-pls'
}
param tags = { ManagedBy: 'Bicep', Project: 'AzureArc' }
