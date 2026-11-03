# Odido Deployment Inputs

The existing class project roots are retained. The implementation uses `we` for
the proposed West Europe names, matching those roots. Confirm these names against
live inventory before enabling delivery; they are not evidence of existing RGs.

| Target | Expected CMDB class | Foundation RG suffixes |
| --- | --- | --- |
| `arc-we-rvit` | `RVIT` | `rg-arc-rvit-we-{ops,monitor,pls}` |
| `arc-we-nrvit` | `Non-RVIT` | `rg-arc-nrvit-we-{ops,monitor,pls}` |
| `governance` | Shared definitions only | No RGs; parent management group |

## Source-Controlled Inputs

All deployment configuration lives in `.bicepparam`, not GitHub variables or
secrets. Parameter files contain native Bicep strings, arrays and objects; none
use `readEnvironmentVariable`. Validation compiles the actual source unchanged.

Each target has a project-level `deployment.bicepparam` using Bicep's `using none`
syntax. This is deployment-runner context, not a resource deployment template.

| Parameter | Required configuration |
| --- | --- |
| `tenantId`, `subscriptionId` | Actual target IDs. No current CLI default subscription is assumed. |
| `managementGroupId` | Existing parent MG for shared definitions, or class MG for class assignments. Use the ID, not display name or full resource ID. |
| `location` | Deployment metadata location for subscription/MG stages. Resource locations remain explicit in stage parameter files. |
| `implementationReady` | Keep false until readiness decisions and effective security scanning are approved. Change through reviewed source control, not a workflow toggle. |

The stage `.bicepparam` files under each target define all resource inputs:

| Stage | Inputs to complete/review in its parameter file |
| --- | --- |
| `foundation` | RG names, region, canonical class and tags. Names are proposed, not discovered inventory. |
| `monitoring` | Workspace/prefix, retention, Windows event queries, Linux facilities and tags. |
| `connectivity` | Existing subnet ID, complete Arc/Monitor DNS zone ID arrays, workspace ID and both DCE IDs. |
| `rbac` | Existing onboarding service-principal object ID and explicit operator group/role assignments. Object ID is not client ID. |
| `associations` | Approved real Windows/Linux machine list and OS-specific DCR/DCE IDs. Names resolve in the class operations RG. |
| `definitions` | Shared initiative naming prefix in the governance project. |
| `assignments` | Shared initiative ID, exact class ALPLS ID and security-reviewed publisher/type pairs. |
| `maintenance` | Approved local start (`yyyy-MM-dd HH:mm`), recurrence, time zone, duration, reboot policy and ring. |
| `defender` | Approved P1/P2 plan and explicit billing approval. P1 is a proposed value, not cost approval. |

Unknown values are visible as `REQUIRED_*` or an all-zero object ID. They allow
offline compilation but the delivery helper rejects them before Azure resource
operations. Replace arrays with the complete approved values, not just the first
example entry. AMA publisher/type pairs are prefilled; security must complete
the extension review, including any Defender handlers, before assignment.

After reviewing monitoring/connectivity/definition deployment outputs, put actual
IDs into downstream `.bicepparam` files and commit/review the changes before the
next stage. Generated parameter JSON is temporary only and never authoritative.

## Workflow Authentication Only

GitHub environment variables `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` and
`AZURE_SUBSCRIPTION_ID` are used only by the Azure login action. They do not feed
Bicep or select deployment scope. The helper independently reads the target
scope from source and verifies the authenticated tenant/subscription. Preview
and apply may use different least-privilege clients for the same source scope.

Workflow target/stage selections, environment reviews and artifact paths are
workflow controls, not resource configuration. Another CI runner or an already
authenticated local Azure CLI can use the same helper and parameter files.
Never commit credentials; use the runner's credential mechanism for login only.

## Safety Defaults

Policy assignments are `Audit`. Patch windows have `enableAssignment = false`;
creating a configuration alone does not schedule hosts. Defender files have
`costApproved = false`, and delivery rejects a billing-stage no-op. Change these
settings only through separately reviewed changes after their acceptance gates.

`retentionDays = 90` is the proposed project value, not a substitute for the
security/records owner's retention approval. Event sources are intentionally
narrow; change them only after collection scope and ingestion costs are reviewed.

Keep RVIT and Non-RVIT source parameters and identity permissions separate. The
helper requires a clean Git checkout and records its commit in reviewed bundles;
it does not require `GITHUB_SHA` or any other GitHub runtime environment value.