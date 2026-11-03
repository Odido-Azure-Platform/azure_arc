using '../../../../../../../../bicep/solutions/azure/security/defender-for-servers/defender-for-servers.bicep'

param subPlan = readEnvironmentVariable('ARC_DEFENDER_PLAN')
param costApproved = false