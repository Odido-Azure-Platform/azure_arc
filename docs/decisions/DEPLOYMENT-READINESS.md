# Deployment Readiness

Status: Not ready for Azure deployment. Repository implementation approval does
not approve these unknown environment details.

| Decision / prerequisite | Current evidence | Required owner |
| --- | --- | --- |
| Actual tenant, two subscription IDs and MG IDs | Not provided; no live inventory performed | Platform / landing-zone owner |
| Existing/new resource inventory and inherited policy/RBAC | Not provided | Platform / governance |
| `we` resource naming and West Europe | Proposed from existing project roots; confirm before preview | Platform |
| Class VNets, subnet IDs and one-ALPLS-per-VNet boundaries | Not provided | Network |
| Complete private DNS zones, forwarding and AMPLS DNS boundary | Not provided | DNS / network |
| ER/VPN paths, enterprise proxy HA and recovery targets | Not provided | Network / operations |
| Entra/ARM/MDE public destinations and fail-closed policy | Not approved | Security / GRC |
| Onboarding identity/authentication and credential handling | Not provided | Identity / Windows / Linux owners |
| CMDB API, schema, auth, reconciliation and migration rules | Not provided | CMDB / security |
| Pilot inventory, OS support, host locations and patch exclusions | Not provided | Service / OS owners |
| Patch windows, assessment settings, repositories and DST test | Not approved | Operations |
| Defender plan/billing, MDE integration and allowed handlers | Not approved | Security / finance |
| Log collection, retention, expected volume and alert recipients | Defaults proposed; acceptance/routing not provided | Monitoring / records / SOC |
| Protected workflow environments, reviewers and OIDC bootstrap | Not configured by this change | Repository / identity admins |
| Effective static security scan of Bicep 2.0 AVM resources | Checkov 3.4.3 ARM parser crashes; raw scans evaluate zero checks | Tooling / security |

Keep `implementationReady = false` in each project's `deployment/context.bicepparam` until these decisions are recorded with
actual IDs, owner, approval/change ID and acceptance evidence. A failed scanner
must be fixed or replaced through a reviewed tooling decision with meaningful
coverage; do not bypass the gate or suppress a parser crash as a finding.

## GitHub Bootstrap

Create protected environments named `<target>-<stage>-preview` and
`<target>-<stage>-apply` for the intended combinations. Require independent
reviewers for apply, prevent self-review and restrict deployment branches/refs to
approved branches. Workflows cannot create/enforce those repository settings.

Create separate preview/apply OIDC clients with environment-bound federated
subjects. Preview needs only scope-appropriate read/validation/what-if actions;
apply needs only the selected stage's resource write actions. Use different class
identities. MG policy publication, policy assignment, RG creation and role
assignment need distinct privilege review; do not grant Owner universally.

Only login-action credentials/identity values belong in workflow environments.
Resource inputs, target tenant/subscription/MG IDs and readiness approval belong
in source-controlled `.bicepparam` files, as described in the project README.
Keep login identities authorized for those explicit source scopes; no default
subscription display-name discovery or runtime parameter overrides are used.

MG hierarchy creation and subscription moves are intentionally not implemented:
there are no approved hierarchy ownership/ID inputs. Reference existing scopes.
Do not run an MG bootstrap merely to reproduce the Word document's drawing.