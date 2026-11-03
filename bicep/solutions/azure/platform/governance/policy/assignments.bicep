targetScope = 'managementGroup'

param location string
@maxLength(24)
param assignmentName string
param policySetDefinitionId string
@allowed(['RVIT', 'Non-RVIT'])
param classification string
@minLength(1)
param privateLinkScopeResourceId string
@minLength(1)
param allowedExtensions string[]
@allowed(['Audit', 'Deny', 'Disabled'])
param effect string = 'Audit'

module baseline 'br/public:avm/res/authorization/policy-assignment/mg-scope:0.1.0' = {
  params: {
    name: assignmentName
    location: location
    displayName: 'Arc ${classification} server baseline'
    policyDefinitionId: policySetDefinitionId
    parameters: {
      expectedClass: { value: classification }
      effect: { value: effect }
      privateLinkScopeResourceId: { value: privateLinkScopeResourceId }
      allowedExtensions: { value: allowedExtensions }
    }
    enforcementMode: 'Default'
    managedIdentities: {}
    enableTelemetry: false
  }
}

output assignmentResourceId string = baseline.outputs.resourceId