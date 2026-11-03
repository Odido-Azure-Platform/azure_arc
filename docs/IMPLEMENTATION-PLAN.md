# Azure Arc implementation plan

Status: Approved for repository implementation and unused-sample cleanup by the
user on 2026-11-03. Azure configuration changes and deployments remain subject to
the inventory, design and deployment gates below.

Prepared: 2026-11-03.

Implementation progress and verification limits are tracked in
[IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md). The initial implementation
consolidates the proposed deployment workflows into one stage-allowlisted
workflow plus reusable validation; scopes and approval boundaries remain separate.

## 1. Purpose and evidence

Implement the Azure Arc-enabled servers architecture in
[Azure Arc configuration architecture.docx](Azure%20Arc%20configuration%20architecture.docx)
as a maintainable Odido platform, following the separation used in
`odido-b2b-hub`: reusable solutions, project-specific Bicep parameters, and
independent GitHub Actions workflows.

Repository observations before implementation:

- The repository README is empty.
- `bicep/solutions/azure-arc/` is an imported Jumpstart sample collection, not an
  Odido production deployment. It includes servers, Kubernetes, data services,
  VMware, ML, IoT, ArcBox, LocalBox, archived samples, and upstream pipelines.
- `projects/odido/arc-we-rvit/` and `projects/odido/arc-we-nrvit/` exist but are
  empty. `.github/` is also empty.
- The Arc working tree was clean before writing this plan.
- No live Azure inventory was requested or performed. Existing subscription,
  networking, policy, identity, and monitoring resources must be inventoried
  before implementation. Folder names do not prove a subscription exists.
- Internal HLD/LLD, CMDB scripts, and roadmap documents mentioned in the Word
  document were not supplied separately; their detailed claims remain unverified.

### Intended outcome

One reusable implementation deployed independently into RVIT and Non-RVIT
subscriptions, with CMDB-driven classification, least-privilege onboarding,
private connectivity where supported, segregated telemetry, controlled patching,
Defender for Servers integration, and auditable GRC enforcement changes.

The solution manages Azure governance and guest-management capabilities. It does
not implement VMware DRS placement rules or move VMs between physical hosts.

## 2. Architecture decisions and corrections

Preserve the architecture's intent, but do not copy its illustrative snippets
without correcting and testing them.

| Topic | Proposed implementation decision |
| --- | --- |
| Subscription separation | Retain two target subscriptions: RVIT and Non-RVIT. Keep the existing project folder names. Reference actual subscription IDs explicitly; never infer them from display names. |
| Management groups | Target `Corp / ETN / Arc / {Arc-RVIT, Arc-NonRVIT}` only after the landing-zone owner confirms actual IDs and inheritance. Management groups sit above subscriptions, never inside them. Reuse existing groups; do not create or move subscriptions implicitly. |
| CMDB classification | Preserve the exact tag key `cmdb.Security.Class` and canonical values `RVIT` and `Non-RVIT`. Folder suffix `nrvit` is not a tag value. Validate each subscription against its expected class, not merely membership in either allowed value. |
| Private connectivity | Deploy an Arc Private Link Scope (ALPLS) per class and Arc resource region. The machine and ALPLS must share a region. A machine uses one ALPLS; Microsoft limits a VNet to one Arc private link scope. Separate class connectivity and DNS views must be designed before deployment. |
| Public endpoint exceptions | ALPLS does not privatize all traffic. Entra endpoints and normally ARM still need controlled access to public endpoints. ARM Private Link is a separate capability, not part of ALPLS. A literal ban on every public destination is a design blocker until security approves a supported connectivity model. |
| Azure Monitor | Use Azure Monitor Private Link Scope (AMPLS), workspace/DCE scope links, DCRs, DCEs where required, private endpoints, and correct DNS. Do not model a Log Analytics private endpoint as a standalone substitute for AMPLS. Design AMPLS around DNS boundaries; two subscriptions alone do not guarantee network or telemetry isolation. |
| Defender networking | Do not assume a generic private endpoint for Defender for Endpoint exists. Microsoft's retrieved Security Private Link setup guidance currently supports the `containers` subresource; that is not evidence of MDE/Servers coverage. Validate the supported MDE connectivity model separately; ALPLS and AMPLS do not make all MDE traffic private. Do not equate Defender for Servers with a legacy Log Analytics agent dependency. |
| Defender capabilities | Agree on Servers P1/P2 and cost before enabling. Do not promise agentless VM scanning for on-premises VMware machines simply because they are Arc-enabled. Validate support per feature and host platform. |
| Proxy terminology | Distinguish the local agent's Arc proxy, the managed Azure Arc gateway, and an enterprise forward proxy. Do not deploy two copies of the local Arc proxy behind a load balancer. Prefer the approved existing enterprise proxy service for required public destinations. |
| HA and fallback | Validate redundant enterprise proxy, DNS, and ER/VPN paths end to end. RVIT must not silently switch private-capable services to public endpoints. Any Non-RVIT fallback requires explicit approval, expiry, logging, and a tested recovery procedure. |
| Policy effects | Use `Audit`, `Deny`, and `Disabled` for direct property checks. Use `AuditIfNotExists`/`DeployIfNotExists` only with valid related-resource evaluation and deployment details. A universal effect switch across all these types is not valid. |
| Extension governance | Match tested publisher/type pairs, not a concatenated publisher/type against the type property alone. Evaluate child extension resources with a suitable policy mode (normally `All`), verified aliases, and a tested allowlist. Do not carry forward unverified Qualys entries. |
| Update Manager | Maintenance configurations and configuration assignments control patch schedules. DCR assignments do not assign maintenance windows. OS package sources, WSUS/repositories, and update-service egress remain separate prerequisites. |
| Reclassification | A tag change is not a migration between subscriptions or private link scopes. Treat class changes as an approved migration workflow with identity, resource support, telemetry, and connectivity validation. Reject silent cross-class retagging. |
| GRC exceptions | Prefer narrow, time-limited policy exemptions over weakening the entire class assignment. Broad must/should changes remain approved, version-controlled operations with a rollback record. |

### Scope boundaries

In scope: Arc-enabled Windows/Linux servers, Azure governance, resource groups,
RBAC, connectivity, observability, Update Manager, Defender integration,
onboarding/synchronization tooling, CI/CD, and operational documentation.

Out of scope unless separately approved: Arc-enabled Kubernetes, Arc data
services, SQL Server-specific management, Azure ML, IoT Operations, Azure Local,
ArcBox/LocalBox/Jumpstart labs, and Arc-enabled VMware vSphere resource bridge.
Guest management of VMware-hosted Windows/Linux servers remains in scope and
does not require the VMware resource bridge solution.

## 3. Repository structure

Use the hub repository's organizational pattern, not a wholesale copy of its
older module versions, permissive defaults, or subscription-name lookup logic.
Keep project parameters in the existing class folders rather than introducing
fictional `dev`/`prod` subscriptions. Pilot rings live within each approved
target; a separate non-production subscription can be added later if supplied.

Proposed final structure (files below are planned, not created yet):

```text
azure_arc/
  README.md
  bicepconfig.json
  .github/workflows/
    arc-validate.yml
    arc-governance.yml
    arc-foundation.yml
    arc-connectivity.yml
    arc-operations.yml
  bicep/
    guidelines/
      folderstructure/README.md
    solutions/azure/
      infrastructure/foundation/
        foundation.bicep
        README.md
      infrastructure/connectivity/
        connectivity.bicep
        modules/arc-private-link-scope.bicep
        README.md
      platform/governance/management-group/
        management-group.bicep
      platform/governance/policy/
        definitions.bicep
        assignments.bicep
        modules/
        README.md
      platform/identity/rbac/
        rbac.bicep
        README.md
      platform/monitoring/
        monitoring.bicep
        modules/
        README.md
      platform/maintenance/
        maintenance.bicep
        README.md
      security/defender-for-servers/
        defender-for-servers.bicep
        README.md
  projects/odido/
    arc-we-rvit/bicep/solutions/azure/<matching-solution-path>/*.bicepparam
    arc-we-nrvit/bicep/solutions/azure/<matching-solution-path>/*.bicepparam
    governance/bicep/solutions/azure/platform/governance/<solution>/*.bicepparam
  scripts/
    onboarding/
    cmdb/
    validation/
  tests/
    policy/
    onboarding/
  docs/
    Azure Arc configuration architecture.docx
    IMPLEMENTATION-PLAN.md
    decisions/
    runbooks/
```

Structural rules:

- Reusable Bicep contains no Odido subscription IDs, class-specific names, group
  object IDs, or CMDB credentials. Use typed inputs and documented outputs.
- Each solution has an independently deployable entry point, matching project
  `.bicepparam` files, a README, ownership, prerequisites, and verification steps.
- Shared tenant/MG configuration is maintained once under `governance`, not
  duplicated into both subscriptions.
- Project parameter `using` paths resolve to reusable entry points; CI verifies
  every parameter file. `.bicep` and `.bicepparam` are the source of truth.
- Never commit generated deployment or parameter JSON beside Bicep. Temporary
  compiled files belong in a runner temporary directory. Functional policy or
  workbook JSON is allowed when genuinely needed, with one authoritative source.
- Consume AVM from the public registry with pinned versions. Do not vendor the
  AVM repository or build a local clone of every resource module.
- Add local modules only for real AVM gaps or cohesive solution logic. Do not
  label Odido-specific wrappers as Microsoft-verified modules.
- Keep scope-specific entry points: tenant for optional MG bootstrap; management
  group for policy definitions/assignments; subscription for foundation and
  cross-RG orchestration; resource group for resource deployment.
- Give each resource one deployment owner. Foundation owns RGs; monitoring owns
  workspaces/DCRs/DCEs; connectivity owns ALPLS/AMPLS, private endpoints and
  links; maintenance owns windows/assignments; governance owns policy/RBAC.
- Existing hub VNets, circuits, DNS zones, subscriptions and identities are
  inputs/references unless their owning team explicitly delegates management.

## 4. AVM implementation map

The Microsoft AVM Bicep catalog was queried while preparing this plan. Versions
below are catalog observations, not a compatibility guarantee. Recheck release
notes and input schemas, select an approved Bicep CLI version, then pin and test
these versions during implementation. Never use a floating `latest` tag.

| Capability | Registry module path | Observed version / approach |
| --- | --- | --- |
| Resource groups | `avm/res/resources/resource-group` | `0.4.4` |
| Optional management groups | `avm/res/management/management-group` | `0.2.0`; omit if already owned elsewhere |
| Optional class VNets | `avm/res/network/virtual-network` | `0.10.2`; reference existing networks by default |
| Private endpoints | `avm/res/network/private-endpoint` | `0.12.1` |
| Private DNS zones / VNet links | `avm/res/network/private-dns-zone` | `0.8.1`; central DNS team owns shared zones |
| Log Analytics | `avm/res/operational-insights/workspace` | `0.16.1` |
| DCR | `avm/res/insights/data-collection-rule` | `0.11.0` |
| DCE | `avm/res/insights/data-collection-endpoint` | `0.5.1` |
| AMPLS | `avm/res/insights/private-link-scope` | `0.7.3`; this is Azure Monitor, NOT Arc ALPLS |
| AMPLS scoped resources | `avm/res/insights/private-link-scope/scoped-resource` | `0.1.0`, or parent module support; one owner only |
| Maintenance windows | `avm/res/maintenance/maintenance-configuration` | `0.4.0` |
| Maintenance assignments | `avm/res/maintenance/configuration-assignment` | `0.2.1`; verify dynamic-scope capabilities |
| Policy assignments | `avm/ptn/authorization/policy-assignment` | `0.5.3`; choose supported MG/subscription scopes |
| Policy exemptions | `avm/ptn/authorization/policy-exemption` | `0.2.0` |
| Policy remediation | `avm/ptn/policy-insights/remediation` | `0.1.0`; explicitly invoked, not silently run |
| RBAC | `avm/ptn/authorization/role-assignment` | `0.2.4`, or resource-module role assignment interfaces |
| Arc extensions | `avm/res/hybrid-compute/machine/extension` | `0.2.0`; only where direct assignment is chosen |
| Connected machine | `avm/res/hybrid-compute/machine` | `0.6.0` exists, but do not use Bicep to pretend an unconnected server is onboarded |
| Arc gateway | `avm/res/hybrid-compute/gateway` | `0.3.0` exists; optional alternative requiring a separate connectivity decision |
| Arc ALPLS | No matching ALPLS module in the retrieved catalog | Small native module for `Microsoft.HybridCompute/privateLinkScopes`; verify API/schema before coding |
| Custom policies / initiatives | No matching definition module in the retrieved catalog | Small native `Microsoft.Authorization/policyDefinitions` / `policySetDefinitions` modules |
| Defender plan / integration settings | Verify exact AVM coverage for each required setting | Use native `Microsoft.Security` resources only where catalog/schema review confirms a gap |
| DCR associations / dynamic patch scopes | Check parent/child AVM interfaces first | Native resources only for unsupported associations or scope features |

For every selected AVM module: review required inputs, private networking,
diagnostic settings, RBAC interfaces, telemetry options, supported scope, and
outputs. Do not assume an AVM default satisfies Odido's security requirements.

## 5. Target deployment contracts

### Common project inputs

Explicit tenant/subscription IDs; management group IDs; Azure resource region
and deployment metadata location; expected class; RG names; required tags;
existing network/subnet and DNS zone resource IDs; onboarding and operator
principal IDs; policy modes; extension allowlist; workspace retention and data
sources; patch ring selectors/time zones; Defender plan; alert recipients; and
approved public-destination/proxy settings.

No credentials belong in parameters. Reference approved secret stores only where
the onboarding method genuinely needs a credential.

### Per-class resource layout

- `ops` RG: Arc machine registrations, maintenance resources where appropriate,
  and class-scoped operations. Machines are created by agent onboarding.
- `monitor` RG: workspace, DCRs/DCEs, alerts and action groups as approved.
- `pls` RG: Arc/Monitor scopes and private connectivity resources owned by Arc.
  Shared DNS remains with its existing owner.
- Confirm the Word document's `euw` naming versus existing `we` project naming
  once; apply the approved naming convention consistently rather than renaming
  project directories for appearance.

Use outputs such as RG, ALPLS, workspace, DCR, DCE, AMPLS and maintenance IDs as
explicit downstream contracts. Resolve cross-stage outputs through controlled
deployment outputs or approved configuration, not manually copied generated JSON.
Revalidate after upstream ID changes.

## 6. Ordered implementation backlog

### Phase 0: Approve decisions and inventory dependencies

Owners: platform, networking/DNS, security/GRC, Windows/Linux operations, CMDB.

1. Approve this plan and the cleanup boundary in section 7.
2. Inventory existing MGs/subscriptions, inherited policy, RBAC/PIM, networks,
   DNS forwarding, workspaces, AMPLS, proxies, and Arc registrations. Record IDs,
   owners and whether each is referenced, extended by agreement, or created new.
3. Confirm West Europe versus other required regions, supported OS distributions,
   server counts per class/site, pilot inventory and maintenance exclusions.
4. Approve endpoint-by-endpoint network flows, DNS boundaries, proxy product,
   HA responsibilities, TLS inspection exclusions and failure behavior.
5. Agree Defender plan, log volumes/retention, patching charges, private endpoint,
   DNS/proxy and optional runtime costs. Produce an estimate from actual counts
   and current pricing; no numeric estimate is defensible from this repo alone.
6. Confirm CMDB API/schema, authentication, synchronization ownership, canonical
   class values, reclassification approval and evidence retention.

Exit: signed decision record and dependency inventory. No deployment until the
network/security model is supportable. Do not create a new MG tree merely to
match the drawing.

### Phase 1: Repository cleanup and validation skeleton

1. Capture the pre-change commit and tracked cleanup manifest. Verify references,
   custom modifications, licences and any actually consumed sample assets.
2. Remove approved unused imports under section 7 without deploying or deleting
   Azure resources. Preserve reusable material only with an identified purpose.
3. Establish the section 3 structure incrementally, README/navigation,
   `bicepconfig.json`, approved CLI versions and `.gitignore` rules for build
   outputs. Do not generate empty placeholder solutions for unrelated services.
4. Add PR checks for Bicep build/lint, all parameter `using` targets, formatting,
   secrets, pinned AVM references and forbidden generated parameter artifacts.
5. Set up OIDC identities and protected GitHub environments as an explicit
   bootstrap prerequisite, not hardcoded credentials in a workflow.

Exit: clean, documented solution tree and passing offline CI checks.

### Phase 2: Scope and foundation

1. Optional, separately approved MG bootstrap at tenant scope. Reuse `Corp/ETN`
   and other existing platform scopes; subscription moves require their own
   approval and inheritance impact review.
2. Create only missing class RGs using AVM; agree naming, tags and ownership.
3. Assign least-privilege operator, reader, onboarding and pipeline roles.
   Prefer onboarding role at the intended Arc machine RG, not at an MG by default.
4. Reference existing Entra groups and PIM arrangements. If identity creation or
   PIM automation is needed, treat Graph permissions/licensing and approvals as
   a separate bootstrap task; do not assume ordinary ARM deployments cover it.

Exit: what-if contains only approved resources/changes; operator and pipeline
access tests prove RVIT/Non-RVIT separation.

### Phase 3: Monitoring resources and private connectivity

1. Deploy class workspaces, explicit retention, minimum required Windows event /
   Linux syslog/performance streams, DCRs and DCEs. Avoid broad collection by
   default; document ingestion costs and table retention.
2. Deploy ALPLS with public access disabled, class-private endpoints, AMPLS and
   required scoped-resource links. Configure workspace ingestion/query access
   after verifying the private operations/query path.
3. Coordinate conditional forwarding, private DNS links, routing and security
   rules with connectivity owners. Do not link conflicting scopes into one VNet
   or shared DNS view. If shared AMPLS is required by existing DNS, explicitly
   approve its isolation implications or redesign the DNS boundary first.
4. Allow documented non-private-capable dependencies through approved egress.
   Exempt relevant endpoints from unsupported TLS interception.
5. Validate from real Windows/Linux hosts in each site/class before onboarding:
   DNS answers, TLS reachability, private routing, proxy bypass where supported,
   and approved public exceptions. A successful ARM deployment is insufficient.

Exit: network team accepts the flow matrix; both class pilots can reach their
own private services; unauthorized cross-class access and public fallback fail.

### Phase 4: Governance definitions, initially non-blocking

1. Inventory inherited and Microsoft built-in Arc policies; reuse built-ins
   before writing equivalent definitions. Record definition IDs, versions,
   effects, aliases, assignment scope and remediation roles.
2. Implement direct-property checks for expected class, allowed extensions and
   private-link posture only where built-ins do not meet the requirement.
   Validate aliases against current resource schemas and live policy metadata.
3. Use a shared definition library and two class initiatives/assignments with
   distinct parameters. Start direct checks in `Audit`; use AINE for valid
   related-resource audits, not as a substitute for direct tag evaluation.
4. Enable DINE automation only for approved extensions/associations; grant each
   assignment identity only the required roles and plan explicit remediation.
5. Test missing tags, the wrong valid class in each subscription, approved and
   disallowed publisher/type pairs, absent/wrong ALPLS, existing machines,
   extension upgrades, and approved exemptions. Separate test fixtures from
   fleet assignments.

Exit: positive and negative policy tests pass; onboarding and required
extensions are not blocked; no duplicate/conflicting inherited assignments.

### Phase 5: Onboarding and CMDB reconciliation

1. Build idempotent Windows/Linux wrappers around Microsoft's supported
   Connected Machine agent onboarding. Verify supported agent/OS versions,
   signed package source, architecture, admin/root privileges, time sync,
   connectivity, expected class and target IDs before changing a host.
2. Use separate class onboarding identities. Choose a supported noninteractive
   authentication method; prefer certificates where operationally supported.
   CI federation does not automatically authenticate an arbitrary on-prem host.
   Never write credentials to source, transcripts, shell history or evidence.
3. Pass explicit ALPLS association at connect time, expected subscription/RG,
   location and canonical CMDB tags. Verify agent connection, actual scope,
   machine identity, class and provisioning status after connect.
4. Separate the CMDB reconciler identity from onboarding. Grant minimal tag
   update rights, preserve unrelated tags, rate-limit/retry safely and provide
   dry-run, audit, checkpoint and failed-record reporting.
5. Quarantine missing/unknown classifications. For a requested class change,
   create an approved migration task rather than retagging the existing machine
   into an inconsistent security boundary.
6. Pilot Windows and Linux for each class and representative network site.
   Retry and already-connected cases must not create duplicate registrations.

Exit: pilot inventory matches CMDB and Azure; identities and secrets are handled
correctly; reruns are safe; no false success on an unreachable/offline machine.

### Phase 6: Operational baselines

1. Assign AMA and DCRs through the chosen policy/extension owner, not two competing
   mechanisms. Prove heartbeat and expected data arrive in the correct workspace
   and unauthorized readers cannot query the other class.
2. Enable approved Defender for Servers settings and MDE integration. Test
   supported OS coverage, sensor health, required egress and policy allowlist
   compatibility. Validate any P2-specific feature separately for on-prem hosts.
3. Deploy Update Manager assessment settings, maintenance windows and dynamic or
   explicit configuration assignments with class and patch-ring selectors.
   Require known tags before inclusion and exclude unclassified resources.
4. Agree the architecture's RVIT-first sequencing with operations. Use a small
   canary within each class before its broad ring; do not patch all RVIT servers
   first solely because their governance is stricter.
5. Test time zone/DST, reboot behavior, cluster/application exclusions, package
   source access, failure handling and supported pre/post maintenance events.
6. Add alerts for disconnected agents, missing heartbeat/DCR data, failed
   extensions, patch failures, Defender health and DNS/proxy/egress failures.
   Define who responds and how monitoring outages are detected independently.

Exit: end-to-end telemetry, Defender health and a successful approved patch cycle
are evidenced for pilot OS/class/site combinations.

### Phase 7: Resilience, enforcement and controlled rollout

1. Exercise proxy-node loss, DNS failure, ER/VPN path failure and private endpoint
   reachability loss. Validate session recovery, alert delivery and agreed
   restoration targets. Do not treat DNS round-robin alone as health-aware HA.
2. Prove RVIT private-capable traffic fails closed. Test any approved Non-RVIT
   fallback separately and restore the baseline afterward. Continued access to
   approved public Entra/MDE endpoints is not an implicit private fallback.
3. Review audit findings and remediate through bounded, approved batches.
4. With GRC approval, promote only eligible RVIT direct checks to `Deny`.
   Keep DINE policies as DINE and related-resource checks in valid effects.
   Use expiring exemptions for documented exceptions.
5. Roll out by approved site/OS/class rings, with stop conditions for identity,
   telemetry, patching or application health regression. Pause between rings for
   agreed observation windows rather than inventing compliance percentages.
6. Complete operations handover, rollback rehearsal and review sign-off.

Exit: agreed fleet coverage and compliance targets met, no unresolved critical
issues, recovery tested, and service owners accept the runbooks.

## 7. Unused-solution cleanup proposal

Deletion is deferred until plan approval. Repository deletion is not Azure
resource decommissioning. Do not run any imported `destroy` workflow or cleanup
script as part of this work.

All paths below are relative to `bicep/solutions/azure-arc/`.

| Path | Proposed disposition | Reason / safeguard |
| --- | --- | --- |
| `archive/` | Delete after reference check | Archived scenarios are not production dependencies. |
| `azure_arc_k8s_jumpstart/` | Delete | Kubernetes not in this server architecture. |
| `azure_arc_app_services_jumpstart/` | Delete | App Services on Arc is not in scope. |
| `azure_arc_ml_jumpstart/` | Delete | ML scenarios not in scope. |
| `azure_arc_data_jumpstart/` | Delete | Arc data services not in scope. |
| `arc_data_services/` | Delete | Data-services artifacts not in scope. |
| `azure_arc_sqlsrv_jumpstart/` | Delete unless SQL scope is explicitly added | Ordinary Arc server management does not require the SQL sample tree. |
| `azure_arc_vsphere_jumpstart/` | Delete unless resource bridge is explicitly added | Hosting guests on VMware does not require Arc-enabled vSphere. |
| `azure_edge_iot_ops_jumpstart/` | Delete | IoT Operations not in scope. |
| `azure_jumpstart_ag/` | Delete after confirming no consumed artifacts | Sample implementation is not part of the stated architecture. |
| `azure_jumpstart_arcbox/` | Delete | Demo/lab environment, not Odido platform infrastructure. |
| `azure_jumpstart_localbox/` | Delete | Azure Local lab not in scope. |
| `azure_arc_servers_jumpstart/` | Review first, then replace/remove | Relevant topic, but retain only specifically justified onboarding examples; new production scripts must not depend on the imported tree. |
| `.azure-pipelines/`, nested `.github/`, `.devcontainer/` | Delete with imported sample tree | Upstream demo automation is not an Odido delivery workflow. |
| Upstream README and repository metadata | Remove when no imported content remains | Preserve required licence/attribution for any copied code; never blanket-delete legal notices while retaining that code. |

Cleanup procedure after approval:

1. Produce the exact tracked-file manifest and check all remaining project,
   workflow, Bicep, script, documentation and submodule references to candidates.
2. Check for local customizations, runtime downloads of sample assets, symlinks,
   generated-content ownership, and retained third-party code licences.
3. If a candidate has a live or repository dependency, stop its deletion and
   record a migration task; being a sample is not proof of being unused.
4. Delete the approved paths, then remove the now-empty imported parent only
   when no retained assets remain. Keep the Word source and class project roots.
5. Verify the deletion diff against the manifest, confirm no unrelated changes,
   check for broken links/references, and rerun solution/parameter validation.
6. Record the original commit and restore procedure. Do not create another local
   archive of unused samples; source history and upstream links are sufficient.

## 8. CI/CD and verification gates

### Workflows

| Workflow | Responsibility and authorization |
| --- | --- |
| `arc-validate.yml` | PR/offline validation; no Azure credentials for untrusted PRs; builds all maintained solutions and project parameters, policy tests and onboarding tests. |
| `arc-governance.yml` | Separately gated MG bootstrap/definition/assignment operations; elevated identity distinct from class deployment identities. |
| `arc-foundation.yml` | Class RGs and approved foundation/RBAC changes; explicit target subscription allowlist. |
| `arc-connectivity.yml` | Private connectivity and scope links after monitoring resources exist; separate approval from network/DNS owner. |
| `arc-operations.yml` | Independently selectable monitoring, maintenance and Defender stages; monitoring resource stage runs before connectivity, associations follow pilot onboarding. No automatic fleet patch or policy remediation. |

Use OIDC, minimal job permissions, reviewed/pinned action versions, concurrency
locks per class/scope/stage and protected deployment environments. Accept only
allowlisted targets and stages. Use separate identities for RVIT and Non-RVIT.
Entra bootstrap, MG administration, RBAC changes and ordinary resource deployment
must not share an unnecessarily privileged standing identity.

Validation/what-if and deployment must be separate jobs with approval between
them. Keep reviewed what-if output and source commit; detect changed inputs and
rerun validation before applying. What-if is advisory and does not prove guest
connectivity, policy correctness or absence of all provider-side effects.

### Required gates

| Gate | Required evidence |
| --- | --- |
| Static validation | Bicep restore/build/lint and parameter compilation pass for every maintained entry point/target; temporary outputs only. |
| Security checks | Secret scan and IaC security scan (for example PSRule for Azure/Checkov on supported compiled inputs); review findings against native/AVM coverage and document approved suppressions. No unresolved high/critical findings. |
| Policy correctness | Definition/alias validation and positive/negative resource tests in an approved test scope; exemptions, inherited policy and remediation identities checked. |
| Azure preflight | Correct tenant/subscription IDs, provider registrations, permissions, supported regions/features, subnet capacity, DNS design and inherited controls. |
| Deployment preview | ARM validation and scope-appropriate what-if show only approved owned changes. Reject unapproved delete/replace or shared-resource mutation. |
| Runtime acceptance | Per-host network, agent, CMDB tag/scope, extension, log, MDE and maintenance evidence. Include denied cross-class cases. |
| Release | Approved commit, reviewers, cost approval, rollback owner, affected pilot/fleet ring and stop conditions. |

Do not grant deployments permission to register providers or alter shared
networks silently. Bootstrap these prerequisites with the appropriate owner.
Use incremental deployments; no complete-mode cleanup or deployment-stack
deletion of pre-existing resources as a convenience.

## 9. Operations, rollback and handover

Required runbooks: onboard/offboard; diagnose connection/DNS/proxy failures;
rotate onboarding credentials; reconcile CMDB tags; approve a class migration;
approve/expire GRC exemptions; change enforcement; investigate telemetry/MDE
health; operate maintenance rings; and recover failed rollout stages.

Rollback principles:

- Redeploy the previous approved code/parameters for resources owned by Arc.
  Do not assume this reverses every service-side effect.
- Restore assignment settings or approved exemptions if a new deny blocks
  operations; do not disable the entire platform baseline by default.
- Pause maintenance assignments/future schedules after a patch failure.
  Installed OS patches require an application/OS recovery procedure; reverting
  Bicep does not uninstall them.
- Preserve machine identity and registration during ordinary infrastructure
  rollback; disconnect/reconnect only under the supported migration/offboarding
  runbook. Do not remove Arc agents automatically as a rollback shortcut.
- Do not delete workspaces or purge evidence as rollback. Preserve class
  separation, retention requirements and records of public endpoint exceptions.
- Document failure behavior for DNS/proxy changes; never recover by silently
  enabling public access for RVIT private-capable services.

Evidence should include change/approval ID, deployment commit, Azure deployment
IDs, inventory coverage, test results, exceptions and remediation outcomes,
without secrets or unnecessary CMDB personal/sensitive data.

## 10. Approval checklist

Implementation can start after approval of the plan and the decisions needed for
its first phase. Later stages remain blocked until their own prerequisites pass.

- [ ] Two-subscription model, actual IDs, MG ownership and target regions.
- [ ] Proposed folder structure and reuse of the existing class project roots.
- [ ] Section 7 deletion list, including whether VMware bridge or SQL management
  must be retained as future scope.
- [ ] ALPLS/VNet and AMPLS/DNS boundary design with network team ownership.
- [ ] Approved public endpoint exceptions and RVIT failure behavior.
- [ ] Enterprise proxy HA design; no unsupported shared local Arc proxy design.
- [ ] Defender plan, supported features, endpoint requirements and cost.
- [ ] CMDB integration contract, onboarding authentication and migration process.
- [ ] Pilot inventory, patch order/windows, success targets and service owners.
- [ ] OIDC/bootstrap roles, CI/security tooling and reviewer assignments.

Approval of this plan does not authorize an Azure deployment. Deployment requires
an independently reviewed what-if and explicit approval for that target/stage.

## 11. Microsoft references

Consult these sources again during implementation; product limits, endpoints and
module releases can change.

- [Azure Arc-enabled servers landing zone accelerator](https://learn.microsoft.com/azure/cloud-adoption-framework/scenarios/hybrid/arc-enabled-servers/landing-zone-accelerator)
- [Azure Arc Private Link setup and limitations](https://learn.microsoft.com/azure/azure-arc/servers/private-link-security)
- [Connected Machine agent network requirements](https://learn.microsoft.com/azure/azure-arc/servers/network-requirements)
- [Azure Arc gateway and limitations](https://learn.microsoft.com/azure/azure-arc/servers/arc-gateway)
- [Azure Arc built-in policy catalog](https://learn.microsoft.com/azure/azure-arc/servers/policy-reference)
- [Azure Policy effects](https://learn.microsoft.com/azure/governance/policy/concepts/effect-basics)
- [Azure Policy exemptions](https://learn.microsoft.com/azure/governance/policy/concepts/exemption-structure)
- [Arc at-scale onboarding with a service principal](https://learn.microsoft.com/azure/azure-arc/servers/onboard-service-principal)
- [Azure Monitor Private Link design](https://learn.microsoft.com/azure/azure-monitor/fundamentals/private-link-design)
- [Azure Monitor Agent network configuration](https://learn.microsoft.com/azure/azure-monitor/agents/azure-monitor-agent-network-configuration)
- [Defender for Endpoint connectivity](https://learn.microsoft.com/defender-endpoint/configure-device-connectivity)
- [Microsoft Security Private Link supported setup](https://learn.microsoft.com/azure/defender-for-cloud/configure-private-endpoints)
- [Defender for Servers overview](https://learn.microsoft.com/azure/defender-for-cloud/defender-for-servers-overview)
- [Azure Update Manager scheduled patching](https://learn.microsoft.com/azure/update-manager/scheduled-patching)
- [Azure Verified Modules Bicep resource index](https://azure.github.io/Azure-Verified-Modules/indexes/bicep/bicep-resource-modules/)
- [Azure Verified Modules Bicep pattern index](https://azure.github.io/Azure-Verified-Modules/indexes/bicep/bicep-pattern-modules/)
- [Bicep best practices](https://learn.microsoft.com/azure/azure-resource-manager/bicep/best-practices)

The AVM catalog and Microsoft Azure/Bicep best-practice tools were consulted for
this draft. This is a repository-grounded plan, not an assertion that the target
tenant or its current configurations have passed validation.