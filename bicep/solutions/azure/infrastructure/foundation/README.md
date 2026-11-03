# Arc Foundation

Scope: subscription. Owns only the operations, monitoring and connectivity RGs.
Uses AVM resource-group `0.4.4`. Does not create subscriptions, MGs, networks or
identities and does not register Arc machines.

Inputs: location, authoritative class, three RG names and organizational tags.
The class tag is enforced after merging extra tags. Output: RG resource IDs.

Deploy with the `foundation` workflow stage after inventory confirms which RGs
are actually new. Shared/existing RGs must be explicitly adopted by agreement;
do not redeploy an existing platform owner's group merely to change its tags.
Next: monitoring resources and RG-scoped onboarding RBAC.