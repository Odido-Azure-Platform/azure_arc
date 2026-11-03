targetScope = 'resourceGroup'

@description('Existing class-specific service principal object ID, not application/client ID.')
@minLength(36)
@maxLength(36)
param onboardingPrincipalId string

@description('Existing operator groups and approved roles. PIM eligibility is managed separately.')
param operatorAssignments {
  principalId: string
  roleDefinitionId: string
}[] = []

module onboarding 'br/public:avm/res/authorization/role-assignment/rg-scope:0.1.1' = {
  params: {
    principalId: onboardingPrincipalId
    principalType: 'ServicePrincipal'
    roleDefinitionIdOrName: 'b64e21ea-ac4e-4cdf-9dc9-5b892992bee7'
    description: 'Arc onboarding only within this class operations resource group.'
    enableTelemetry: false
  }
}

module operators 'br/public:avm/res/authorization/role-assignment/rg-scope:0.1.1' = [for assignment in operatorAssignments: {
  params: {
    principalId: assignment.principalId
    principalType: 'Group'
    roleDefinitionIdOrName: assignment.roleDefinitionId
    enableTelemetry: false
  }
}]

output onboardingAssignmentResourceId string = onboarding.outputs.resourceId
