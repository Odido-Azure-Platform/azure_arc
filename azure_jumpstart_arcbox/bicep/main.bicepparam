using 'main.bicep'

// param sshRSAPublicKey = '<your RSA public key>'

param tenantId = '63a8df83-063c-4312-a508-dc01b7508661'

param windowsAdminUsername = 'arcdemo'

param windowsAdminPassword = 'enclose research going stick 08 !!'

param logAnalyticsWorkspaceName = 'ArcBoxITPro-la'

param flavor = 'ITPro'

param deployBastion = true

param namingPrefix = 'nlazpoc'

param vmAutologon = true

param sqlServerEdition = 'Enterprise'

param resourceTags = {
  SolutionName : 'jumpstart_arcbox'
  'app-environment' : 'dev'
  'ops-owner-technical' : 'zoltan.horvath@odido.nl'
  'app-description' : 'Azure ArcBox PoC'
  'app-name' : 'arcbox'
  'app-type' : 'iaas'
  'ops-owner-requester' : 'marcel.mulder@odido.nl'
} // Add tags as needed

param autoShutdownEnabled = true

param autoShutdownTime = '1900'

param autoShutdownTimezone = 'UTC'

param autoShutdownEmailRecipient = 'cloudinfra-windows@odido.nl'

param enableAzureSpotPricing = false
