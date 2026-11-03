using 'main.bicep'

// param sshRSAPublicKey = '<your RSA public key>'

param tenantId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' // Replace with your actual tenant ID

param windowsAdminUsername = 'arcdemo'

param windowsAdminPassword = 'password' // Replace with a secure password

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
