using '../../../../../../../../../bicep/solutions/azure/platform/governance/policy/assignments.bicep'

param location = 'westeurope'
param assignmentName = 'arc-rvit-baseline'
param policySetDefinitionId = readEnvironmentVariable('ARC_INITIATIVE_ID')
param classification = 'RVIT'
param privateLinkScopeResourceId = readEnvironmentVariable('ARC_SCOPE_ID')
param allowedExtensions = json(readEnvironmentVariable('ARC_ALLOWED_EXTENSIONS'))
param effect = 'Audit'