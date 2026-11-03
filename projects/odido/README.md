# Odido Deployment Inputs

The existing class project roots are retained. The implementation uses `we` for
the proposed West Europe names, matching those roots. Confirm these names against
live inventory before enabling delivery; they are not evidence of existing RGs.

| Target | Expected CMDB class | Foundation RG suffixes |
| --- | --- | --- |
| `arc-we-rvit` | `RVIT` | `rg-arc-rvit-we-{ops,monitor,pls}` |
| `arc-we-nrvit` | `Non-RVIT` | `rg-arc-nrvit-we-{ops,monitor,pls}` |
| `governance` | Shared definitions only | No RGs; parent management group |

## Environment Inputs

Only define inputs required by the selected stage. JSON-array values must be
valid JSON, not comma-separated text. Missing required inputs stop parameter
compilation. Never substitute invented IDs for a deployment preview.

| Input | Meaning / stage |
| --- | --- |
| `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` | Actual protected-environment OIDC identity and explicit tenant/subscription context. Preview and apply can use different clients but must use the same tenant/subscription. |
| `ARC_IMPLEMENTATION_READY` | Must be `true` only after the readiness record is completed and approved. This does not bypass CI or environment review. |
| `ARC_MANAGEMENT_GROUP_ID` | Existing MG ID, not display name or full resource ID. Parent MG for `definitions`; class MG for `assignments`. |
| `ARC_SUBNET_ID` | Full existing private-endpoint subnet resource ID; connectivity stage. |
| `ARC_DNS_ZONE_IDS` | JSON array of existing Arc private DNS zone resource IDs. Network owner must supply the complete required zone set. |
| `ARC_MONITOR_DNS_ZONE_IDS` | JSON array of existing AMPLS private DNS zone resource IDs. Approve the DNS boundary first. |
| `ARC_WORKSPACE_ID` | Full workspace ID from the monitoring deployment output. |
| `ARC_DCE_IDS` | JSON array of both class DCE IDs from monitoring outputs, for AMPLS scope links. |
| `ARC_WINDOWS_DCR_ID`, `ARC_LINUX_DCR_ID` | Full class DCR IDs for pilot associations. |
| `ARC_WINDOWS_DCE_ID`, `ARC_LINUX_DCE_ID` | Full OS-specific DCE IDs for pilot configuration access associations. |
| `ARC_MACHINES` | JSON array of approved existing machines, e.g. `[{"name":"pilot-win","osType":"Windows"},{"name":"pilot-linux","osType":"Linux"}]`. Names resolve only in the class operations RG. |
| `ARC_ONBOARDING_PRINCIPAL_ID` | Existing class onboarding service-principal object ID, not client/application ID. |
| `ARC_PATCH_START` | Approved local timestamp, format `yyyy-MM-dd HH:mm`. |
| `ARC_PATCH_RECURRENCE` | Approved Maintenance Configuration recurrence, e.g. `1Week Saturday`. |
| `ARC_INITIATIVE_ID` | Shared policy-set ID returned by the definitions deployment. |
| `ARC_SCOPE_ID` | Exact regional/class ALPLS resource ID returned by connectivity. |
| `ARC_ALLOWED_EXTENSIONS` | Reviewed JSON array of publisher/type pairs. Include both OS AMA handlers and approved Defender handlers before tightening enforcement. Do not guess publisher values. |
| `ARC_DEFENDER_PLAN` | Approved `P1` or `P2`. Billing remains disabled until `costApproved` is changed in a reviewed source change. |

Outputs are obtained from the reviewed deployment result artifact. Populate the
next stage's protected inputs with the actual IDs; no duplicate params JSON is
added to the repository. A future automated output lookup must verify deployment
target, source revision and ownership before consuming IDs.

## Safety Defaults

Policy assignments are `Audit`. Patch windows have `enableAssignment = false`;
creating a configuration alone does not schedule hosts. Defender files have
`costApproved = false`, and delivery rejects a billing-stage no-op. Change these
settings only through separately reviewed changes after their acceptance gates.

`retentionDays = 90` is the proposed project value, not a substitute for the
security/records owner's retention approval. Event sources are intentionally
narrow; change them only after collection scope and ingestion costs are reviewed.

Keep RVIT and Non-RVIT environment variables and OIDC permissions separate.
The compile-only validation fixtures are confined to the validator process and
are explicitly rejected by the delivery helper.