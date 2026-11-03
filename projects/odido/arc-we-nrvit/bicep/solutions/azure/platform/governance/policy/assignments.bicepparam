using '../../../../../../../../../bicep/solutions/azure/platform/governance/policy/assignments.bicep'

param location = 'westeurope'
param assignmentName = 'arc-nrvit-baseline'
param policySetDefinitionId = 'REQUIRED_SHARED_POLICY_SET_RESOURCE_ID'
param classification = 'Non-RVIT'
param privateLinkScopeResourceId = 'REQUIRED_NON_RVIT_ARC_SCOPE_RESOURCE_ID'
param allowedExtensions = [
	'Microsoft.Azure.Monitor/AzureMonitorWindowsAgent'
	'Microsoft.Azure.Monitor/AzureMonitorLinuxAgent'
	'REQUIRED_SECURITY_APPROVED_PUBLISHER_TYPE'
]
param effect = 'Audit'
