<h1 align="center">
  <br>
  <img src="https://github.com/Azure/ALZ-Bicep/wiki/media/bicep-logo.png" width="64" alt="Bicep" />
  <br>
  Odido Azure Arc - CAF Deployment Catalogue
  <br>
</h1>

Reusable Azure platform building blocks for the RVIT and Non-RVIT server estates:
foundation, private connectivity, monitoring, governance, onboarding permissions,
maintenance and explicitly approved Defender for Servers pricing.

[Workflows](#workflows) | [Solutions](#solutions) |
[Repo layout](#repo-layout) | [Project parameters](#project-parameters) |
[Local validation](#local-validation) | [Deployment](#deployment) |
[Documentation](#documentation)

## Azure Arc Overview

[![Azure Arc management control plane overview](https://learn.microsoft.com/en-us/azure/azure-arc/media/overview/azure-arc-control-plane.png)](https://learn.microsoft.com/en-us/azure/azure-arc/overview)

Source: [Microsoft Learn - Azure Arc overview](https://learn.microsoft.com/en-us/azure/azure-arc/overview).
This is Microsoft's conceptual Azure Arc overview, not the deployed Odido
topology. This repository focuses on Arc-enabled servers; the diagram also
shows capabilities outside its implementation scope.

## Status and Readiness

**Repository implementation is not production deployment approval.** Delivery
remains blocked pending the [readiness decisions](docs/decisions/DEPLOYMENT-READINESS.md)
and the security-scanner compatibility issue recorded in the
[implementation status](docs/IMPLEMENTATION-STATUS.md). Keep
`implementationReady = false` until those gates are satisfied.

The local validator compiles 11 templates and 20 parameter sets and runs 17
regression tests. Successful compilation does not prove live policy aliases,
network routing, DNS, permissions, agent health or effective security scanning.
No live deployment or host configuration is implied by these checks.

If you are new here:

1. Read the [readiness record](docs/decisions/DEPLOYMENT-READINESS.md).
2. Review the [project inputs](projects/odido/README.md) and environment boundaries.
3. Run [local validation](#local-validation).
4. Follow the [rollout runbook](docs/runbooks/OPERATIONS.md) before any deployment.

## Workflows

| Workflow | Purpose | Status |
| --- | --- | --- |
| [Arc Validate](.github/workflows/arc-validate.yml) | Compile solutions/parameters, run regression tests and scan source/compiled ARM. Runs on pull requests, pushes to `main`, manual dispatch and reusable calls. | [![Arc Validate](https://github.com/Odido-Azure-Platform/azure_arc/actions/workflows/arc-validate.yml/badge.svg?branch=main)](https://github.com/Odido-Azure-Platform/azure_arc/actions/workflows/arc-validate.yml) |
| [Arc Preview and Deploy](.github/workflows/arc-deploy.yml) | Manually select project, environment and stage; validate, preview and optionally request separately approved apply. | [![Arc Preview and Deploy](https://github.com/Odido-Azure-Platform/azure_arc/actions/workflows/arc-deploy.yml/badge.svg?branch=main)](https://github.com/Odido-Azure-Platform/azure_arc/actions/workflows/arc-deploy.yml) |

Badges show workflow results on `main`, not deployment readiness or proof that
resources are running. The delivery workflow calls validation before preview;
an unresolved security gate blocks the delivery chain.

### Delivery Inputs

| Input | Values / behavior |
| --- | --- |
| `projectname` | `odido`; selects the project beneath `projects/`. |
| `environment` | `arc-we-rvit`, `arc-we-nrvit` or `governance`. These are class/shared-governance boundaries, not dev/prod tiers. |
| `stage` | One solution stage from the catalogue below. |
| `apply` | Defaults to `false` (preview only). Set `true` to request apply after preview and the separately protected environment approval. |

`governance` accepts only `definitions`. Both class environments accept all other
stages. Invalid combinations are rejected rather than redirected to another scope.

## Solutions

Reusable entry points live under `bicep/solutions/azure`. Modules use pinned
[Azure Verified Modules](https://azure.github.io/Azure-Verified-Modules/) where
available, with small native modules for documented gaps. Native modules are not
Microsoft-verified modules.

| Stage | What it configures | Deployment scope | Entry / documentation |
| --- | --- | --- | --- |
| `foundation` | Operations, monitoring and connectivity resource groups with authoritative class tags. | Class subscription | [foundation.bicep](bicep/solutions/azure/infrastructure/foundation/foundation.bicep) / [Guide](bicep/solutions/azure/infrastructure/foundation/README.md) |
| `monitoring` | Log Analytics workspace, Windows/Linux data collection endpoints (DCEs) and rules (DCRs). | Class monitoring RG | [monitoring.bicep](bicep/solutions/azure/platform/monitoring/monitoring.bicep) / [Guide](bicep/solutions/azure/platform/monitoring/README.md) |
| `connectivity` | Arc private link scope (ALPLS), Azure Monitor private link scope (AMPLS), private endpoints and scope links. | Class connectivity RG | [connectivity.bicep](bicep/solutions/azure/infrastructure/connectivity/connectivity.bicep) / [Guide](bicep/solutions/azure/infrastructure/connectivity/README.md) |
| `rbac` | Onboarding and approved operator role assignments for existing principals. | Class operations RG | [rbac.bicep](bicep/solutions/azure/platform/identity/rbac/rbac.bicep) / [Guide](bicep/solutions/azure/platform/identity/rbac/README.md) |
| `definitions` | Shared custom policy definitions and initiative. | Existing parent management group | [definitions.bicep](bicep/solutions/azure/platform/governance/policy/definitions.bicep) / [Guide](bicep/solutions/azure/platform/governance/policy/README.md) |
| `assignments` | Class-specific policy initiative assignment, initially audit-only. | Existing class management group | [assignments.bicep](bicep/solutions/azure/platform/governance/policy/assignments.bicep) / [Guide](bicep/solutions/azure/platform/governance/policy/README.md) |
| `associations` | AMA extensions and OS-specific DCR/DCE associations on an explicit list of existing Arc machines. | Class operations RG | [associations.bicep](bicep/solutions/azure/platform/monitoring/associations.bicep) / [Guide](bicep/solutions/azure/platform/monitoring/README.md) |
| `maintenance` | Maintenance windows and opt-in dynamic targeting by class and patch ring. | Class operations RG | [maintenance.bicep](bicep/solutions/azure/platform/maintenance/maintenance.bicep) / [Guide](bicep/solutions/azure/platform/maintenance/README.md) |
| `defender` | Explicitly cost-approved Defender for Servers plan pricing. | Class subscription | [defender-for-servers.bicep](bicep/solutions/azure/security/defender-for-servers/defender-for-servers.bicep) / [Guide](bicep/solutions/azure/security/defender-for-servers/README.md) |

Resource groups for RG-scoped stages are resolved from the selected environment's
foundation parameters, not inferred from the current Azure CLI defaults.

### Boundaries and Safe Defaults

- RVIT and Non-RVIT keep separate parameters, identities and scopes. CMDB is the
  classification authority; moving between classes is an approved migration,
  not merely a tag update.
- Arc public access and Monitor public ingestion/query are disabled. Existing
  networks, subnets, DNS zones and VNet links remain external dependencies;
  separate subscriptions alone do not guarantee DNS isolation.
- Monitoring resources alone do not onboard hosts. Associations require real
  Arc registrations and verified private connectivity.
- Policy assignments default to `Audit`. Enforcement requires a separate review.
- Maintenance targeting defaults to `enableAssignment = false`. Creating a window
  does not schedule hosts; disabling a condition does not remove an existing assignment.
- Defender defaults to `costApproved = false`. Pricing does not install or prove
  MDE protection, and unapproved billing is rejected by delivery.
- No implicit tenant/MG hierarchy, CMDB connector, host onboarding automation,
  alert routing or fleet rollout is provided. See the readiness record for
  deferred integrations and ownership decisions.

## Repo Layout

Following the B2B Hub catalogue pattern, workflows, reusable solutions and
project/environment values are separate:

```text
.
|-- .github/workflows/             # Validation and protected OIDC delivery
|-- bicep/
|   |-- guidelines/folderstructure/
|   `-- solutions/azure/
|       |-- infrastructure/
|       |   |-- foundation/
|       |   `-- connectivity/
|       |-- platform/
|       |   |-- governance/policy/
|       |   |-- identity/rbac/
|       |   |-- monitoring/
|       |   `-- maintenance/
|       `-- security/defender-for-servers/
|-- projects/odido/
|   |-- arc-we-rvit/
|   |   |-- bicep/solutions/azure/  # Mirrored solution parameter paths
|   |   `-- deployment/context.bicepparam
|   |-- arc-we-nrvit/              # Same layout, independent class values
|   `-- governance/               # Shared definitions and deployment context
|-- scripts/validation/            # Compilation, scans and delivery helper
|-- tests/policy/                  # Policy, security-setting and delivery tests
`-- docs/                         # Architecture, readiness and operations
```

See the [folder structure guide](bicep/guidelines/folderstructure/README.md).
Do not copy reusable templates into project folders or commit generated ARM and
parameter JSON alongside the Bicep sources.

## Project Parameters

### Matching a Solution to Its Parameters

Each solution parameter file mirrors the solution's path **and filename**:

```text
Solution:
  bicep/solutions/azure/infrastructure/foundation/foundation.bicep

RVIT parameters:
  projects/odido/arc-we-rvit/bicep/solutions/azure/infrastructure/foundation/foundation.bicepparam

Non-RVIT parameters:
  projects/odido/arc-we-nrvit/bicep/solutions/azure/infrastructure/foundation/foundation.bicepparam
```

The parameter file's `using` declaration references that exact reusable template.
Validation enforces this relationship; the deployment helper resolves the
solution and selected parameter file together.

| Environment | Purpose | Example solution parameters | Runner context |
| --- | --- | --- | --- |
| `arc-we-rvit` | RVIT class resources and policy assignments | [foundation.bicepparam](projects/odido/arc-we-rvit/bicep/solutions/azure/infrastructure/foundation/foundation.bicepparam), [monitoring.bicepparam](projects/odido/arc-we-rvit/bicep/solutions/azure/platform/monitoring/monitoring.bicepparam) | [context.bicepparam](projects/odido/arc-we-rvit/deployment/context.bicepparam) |
| `arc-we-nrvit` | Non-RVIT class resources and policy assignments | [foundation.bicepparam](projects/odido/arc-we-nrvit/bicep/solutions/azure/infrastructure/foundation/foundation.bicepparam), [connectivity.bicepparam](projects/odido/arc-we-nrvit/bicep/solutions/azure/infrastructure/connectivity/connectivity.bicepparam) | [context.bicepparam](projects/odido/arc-we-nrvit/deployment/context.bicepparam) |
| `governance` | Shared definitions deployed once at the parent MG | [definitions.bicepparam](projects/odido/governance/bicep/solutions/azure/platform/governance/policy/definitions.bicepparam) | [context.bicepparam](projects/odido/governance/deployment/context.bicepparam) |

### Resource Inputs Versus Runner Context

Solution parameters contain resource settings: names, classification, tags,
network references, collection rules, principals, policy effects and approved hosts.

Each environment's separate `deployment/context.bicepparam` uses `using none`
and contains runner settings, not resource inputs:

| Setting | Meaning |
| --- | --- |
| `tenantId`, `subscriptionId` | Explicit approved Azure scope; no subscription-name lookup or current-subscription assumption. |
| `managementGroupId` | Existing parent MG for definitions or class MG for assignments; use the ID, not display name. |
| `location` | Deployment metadata region for subscription/MG stages; resource regions remain in solution parameters. |
| `implementationReady` | Reviewed source gate; keep false until readiness and effective security scanning are approved. |

All deployment configuration is source-controlled Bicep parameters, not injected
workflow values. Replace `REQUIRED_*` and all-zero IDs with approved inventory
values before delivery. Names and retention values are proposals, not evidence
of live resources or owner approval. Do not commit credentials.

Review outputs from upstream stages and commit approved IDs into downstream
parameter files before proceeding. See the [complete input guide](projects/odido/README.md)
for required values and acceptance gates.

## Local Validation

Prerequisites: Node.js 22+, Azure CLI and Bicep CLI **0.43.1**. Module restore
requires access to the Microsoft public module registry; no Azure login or
deployment-input environment variables are needed for compilation/tests.

From the repository root:

```bash
az bicep install --version v0.43.1
node scripts/validation/validate.mjs
```

The validator builds every maintained template and parameter file, checks pinned
AVM references and mirrored solution paths, checks safe source defaults, and runs
policy/security-setting/delivery regression tests. Generated files are temporary.
It performs no deployment and does **not** run the full CI security scans.

CI additionally uses pinned Checkov 3.4.3 for source-secret and compiled ARM
scanning. The [scanner compatibility blocker](docs/IMPLEMENTATION-STATUS.md)
must be resolved or an approved alternative verified; an empty/zero-check scan
is not accepted as a security pass.

## Deployment

### GitHub Actions

Before dispatching, complete readiness decisions, fix effective security scanning,
replace placeholders, and commit/review the configuration.

1. Configure the approved OIDC trust and least-privilege identities.
2. Configure protected environments named `<environment>-<stage>-preview` and
   `<environment>-<stage>-apply`, with independent apply approval.
3. Supply environment variables `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` and
   `AZURE_SUBSCRIPTION_ID` for the login action only. The helper independently
   verifies the tenant/subscription against source context. Preview and apply
   may use different approved identities.
4. Run **Arc Preview and Deploy** against a reviewed source revision. For example:
   `projectname = odido`, `environment = arc-we-rvit`, `stage = foundation`.
5. Leave `apply = false` for preview only. To deploy, request `apply = true` on
   the run and review that run's preview before approving its apply environment.

Preview produces compiled template/parameters, a manifest and `what-if.json`.
Apply verifies the project, target, stage, scope, source revision and bundle
hashes, validates again, and compares a fresh what-if against the reviewed
changes. Drift requires a new preview; delete changes require a separate
approved decommissioning process.

Preview artifacts are retained for 7 days; deployment result artifacts for
30 days. Never apply an old copied bundle.

### Local or Other CI Runners

Use an approved authenticated Azure CLI session, the same reviewed source values,
and a clean Git checkout. After readiness/security gates and independent change
approval are satisfied:

```bash
# Preview into a unique absolute directory outside the checkout.
node scripts/validation/deploy.mjs preview odido arc-we-rvit foundation /tmp/arc-reviewed-preview

# After reviewing what-if.json and obtaining approval, apply that exact bundle.
node scripts/validation/deploy.mjs apply odido arc-we-rvit foundation /tmp/arc-reviewed-preview
```

The helper takes `preview|apply projectname environment stage bundle-directory`.
It does not depend on GitHub runtime variables. Outside GitHub, your change
process must supply reviewer separation, security-scan gates, artifact access
controls and retention; the helper does not replace them.

### Rollout Sequence

1. Confirm live inventory, existing scopes, naming, identities and network/DNS design.
2. Deploy class foundation, monitoring resources and onboarding RBAC.
3. Deploy connectivity using reviewed monitoring outputs; prove private host and
   operator connectivity.
4. Publish shared definitions, then class assignments in audit mode.
5. Onboard approved pilots separately, verify inventory/agent/private-scope state,
   then deploy AMA associations and prove class-correct telemetry.
6. Separately approve Defender costs and MDE integration; pilot maintenance before
   enabling targeting.
7. Complete fail-closed exercises and service-owner acceptance before fleet expansion.

Use the [operations runbook](docs/runbooks/OPERATIONS.md) for the full acceptance,
failure/recovery, reclassification and offboarding requirements.

## Documentation

| Topic | Reference |
| --- | --- |
| Folder structure and solution/parameter relationship | [Folder structure](bicep/guidelines/folderstructure/README.md) |
| Environment values, placeholders and authentication boundary | [Project input guide](projects/odido/README.md) |
| Approved implementation design | [Implementation plan](docs/IMPLEMENTATION-PLAN.md) |
| Verification evidence, scanner blocker and deferred work | [Implementation status](docs/IMPLEMENTATION-STATUS.md) |
| Required decisions and deployment approval gates | [Deployment readiness](docs/decisions/DEPLOYMENT-READINESS.md) |
| Rollout, operating boundaries and recovery | [Operations runbook](docs/runbooks/OPERATIONS.md) |
| Original architecture document | [Azure Arc configuration architecture](docs/Azure%20Arc%20configuration%20architecture.docx) |
| Upstream module catalogue | [Azure Verified Modules](https://azure.github.io/Azure-Verified-Modules/) |
