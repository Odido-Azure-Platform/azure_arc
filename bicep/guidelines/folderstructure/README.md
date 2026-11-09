# Folder Structure

Follow the hub repository's separation of workflow, reusable solution and
project-specific Bicep parameters.

- `bicep/solutions/azure/infrastructure`: subscription foundation and RG connectivity.
- `bicep/solutions/azure/platform`: MG policy, RG onboarding RBAC, monitoring and maintenance.
- `bicep/solutions/azure/security`: explicitly opt-in subscription Defender pricing.
- `projects/odido/arc-we-rvit` and `arc-we-nrvit`: class-specific values only.
- `projects/odido/governance`: shared policy definitions, deployed once at their parent MG.
- `.github/workflows`: credential-free validation and protected, manual OIDC delivery.
- `scripts/validation`: repeatable build checks, scan preparation and delivery guards.
- `tests/policy`: compiled-policy semantics, security settings and delivery guards.
- `docs/decisions` and `docs/runbooks`: required design inputs and operational gates.

Each project parameter file uses its matching reusable entry point. Do not copy
Bicep into the project directories. Reusable solutions must not contain Odido
subscription IDs, principal IDs, secrets, or project-specific network names.

Workflows select `projectname`, `environment` and `stage`. The solution path
under `bicep/solutions` is mirrored below
`projects/<projectname>/<environment>/bicep/solutions`, changing only the
extension from `.bicep` to `.bicepparam`. The parameter file's `using` declaration
must point back to that exact solution; validation rejects mismatches.
Separate `deployment/context.bicepparam` files under each environment hold
runner scope/readiness, use `using none`, and are never sent as resource inputs.

Use pinned registry AVM references; do not vendor AVM or copy the Jumpstart tree.
Native modules are limited to confirmed gaps such as Arc ALPLS, custom policy
definitions and DCR/DCE associations. They are not Microsoft-verified modules.

Generated templates, parameter JSON and security scan representations belong in
temporary runner directories only. Functional JSON may be used for actual
solution data, but must not duplicate `.bicepparam` sources.

No tenant or MG hierarchy is created implicitly. Existing landing-zone scopes,
networks, DNS zones, connectivity, identities and PIM remain with their owners.