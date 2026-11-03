targetScope = 'subscription'

@description('Explicitly approved billable Defender for Servers plan.')
@allowed(['P1', 'P2'])
param subPlan string

@description('Must be approved separately; enabling a plan changes subscription-wide billing.')
param costApproved bool

resource servers 'Microsoft.Security/pricings@2024-01-01' = if (costApproved) {
  name: 'VirtualMachines'
  properties: {
    pricingTier: 'Standard'
    subPlan: subPlan
    enforce: 'False'
  }
}

output planResourceId string? = servers.?id