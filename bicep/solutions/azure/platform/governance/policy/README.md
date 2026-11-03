# Arc Governance

`definitions.bicep`: management-group scope at the common approved parent.
Creates one shared initiative with three custom direct-property policies:
expected CMDB class, publisher/type extension pairs and exact ALPLS ID. It also
references Microsoft's built-in policy disabling ALPLS public access. Native
definitions are used because no equivalent AVM definition module was found.

`assignments.bicep`: class management-group scope, using pinned AVM. Assigns the
shared initiative independently with RVIT or Non-RVIT parameters. Defaults to
`Audit`, creates no remediation identity and runs no remediation.

The initial solution supports the single approved resource region per class.
If the class MG later contains multiple resource regions/scopes, redesign the
exact-scope policy with explicit regional selectors before expanding assignments.

Effects are `Audit`, `Deny`, or `Disabled`; no invalid universal AINE/DINE toggle.
Child extension checks use `All` mode. Policy comparisons are case-insensitive
where Azure Policy treats strings that way; onboarding must still emit canonical
CMDB tag values. The test harness checks local condition semantics, not Azure's
live aliases, policy engine, exemptions or compliance evaluation latency.

Before enabling Deny: validate aliases and inherited assignments in Azure, verify
onboarding plus extension upgrades, and approve publisher/type pairs. Prefer
expiring scoped exemptions for exceptional hosts. No exemption automation or
automatic broad weakening is included in this initial implementation.