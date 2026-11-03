targetScope = 'managementGroup'

@description('Stable prefix for policy names. Definitions are shared by both class assignments.')
@maxLength(40)
param namePrefix string = 'arc'

var effectParameter = {
  type: 'String'
  allowedValues: ['Audit', 'Deny', 'Disabled']
  defaultValue: 'Audit'
  metadata: { displayName: 'Effect', description: 'Direct-property enforcement mode.' }
}

var controls = [
  {
    name: '${namePrefix}-classification'
    displayName: 'Arc machines must match their subscription classification'
    parameters: {
      expectedClass: {
        type: 'String'
        allowedValues: ['RVIT', 'Non-RVIT']
        metadata: { displayName: 'Expected class', description: 'Authoritative CMDB class for this boundary.' }
      }
    }
    assignmentParameters: {
      expectedClass: { value: '[parameters(\'expectedClass\')]' }
    }
    condition: {
      allOf: [
        { field: 'type', equals: 'Microsoft.HybridCompute/machines' }
        { field: 'tags[\'cmdb.Security.Class\']', notEquals: '[parameters(\'expectedClass\')]' }
      ]
    }
  }
  {
    name: '${namePrefix}-extensions'
    displayName: 'Arc extensions must match an approved publisher and type pair'
    parameters: {
      allowedExtensions: {
        type: 'Array'
        metadata: { displayName: 'Allowed extensions', description: 'Publisher/type pairs approved by security.' }
      }
    }
    assignmentParameters: {
      allowedExtensions: { value: '[parameters(\'allowedExtensions\')]' }
    }
    condition: {
      allOf: [
        { field: 'type', equals: 'Microsoft.HybridCompute/machines/extensions' }
        {
          value: '[concat(field(\'Microsoft.HybridCompute/machines/extensions/publisher\'), \'/\', field(\'Microsoft.HybridCompute/machines/extensions/type\'))]'
          notIn: '[parameters(\'allowedExtensions\')]'
        }
      ]
    }
  }
  {
    name: '${namePrefix}-private-scope'
    displayName: 'Arc machines must use the approved class private link scope'
    parameters: {
      privateLinkScopeResourceId: {
        type: 'String'
        metadata: { displayName: 'Arc scope ID', description: 'Expected regional and class-specific Arc scope.' }
      }
    }
    assignmentParameters: {
      privateLinkScopeResourceId: { value: '[parameters(\'privateLinkScopeResourceId\')]' }
    }
    condition: {
      allOf: [
        { field: 'type', equals: 'Microsoft.HybridCompute/machines' }
        {
          field: 'Microsoft.HybridCompute/machines/privateLinkScopeResourceId'
          notEquals: '[parameters(\'privateLinkScopeResourceId\')]'
        }
      ]
    }
  }
]

resource definitions 'Microsoft.Authorization/policyDefinitions@2023-04-01' = [for control in controls: {
  name: control.name
  properties: {
    policyType: 'Custom'
    mode: 'All'
    displayName: control.displayName
    description: control.displayName
    metadata: { category: 'Azure Arc', version: '1.0.0' }
    parameters: union(control.parameters, { effect: effectParameter })
    policyRule: {
      if: control.condition
      then: { effect: '[parameters(\'effect\')]' }
    }
  }
}]

var customPolicyReferences = [for (control, index) in controls: {
  policyDefinitionReferenceId: control.name
  policyDefinitionId: definitions[index].id
  parameters: union(control.assignmentParameters, { effect: { value: '[parameters(\'effect\')]' } })
}]

resource initiative 'Microsoft.Authorization/policySetDefinitions@2023-04-01' = {
  name: '${namePrefix}-servers-baseline'
  properties: {
    policyType: 'Custom'
    displayName: 'Arc-enabled servers class baseline'
    description: 'Shared definitions with independent class, scope and enforcement parameters.'
    metadata: { category: 'Azure Arc', version: '1.0.0' }
    parameters: {
      effect: effectParameter
      expectedClass: controls[0].parameters.expectedClass
      allowedExtensions: controls[1].parameters.allowedExtensions
      privateLinkScopeResourceId: controls[2].parameters.privateLinkScopeResourceId
    }
    policyDefinitions: concat(customPolicyReferences, [
      {
        policyDefinitionReferenceId: 'arc-scope-public-access'
        policyDefinitionId: '/providers/Microsoft.Authorization/policyDefinitions/898f2439-3333-4713-af25-f1d78bc50556'
        parameters: { effect: { value: '[parameters(\'effect\')]' } }
      }
    ])
  }
}

output policySetDefinitionId string = initiative.id