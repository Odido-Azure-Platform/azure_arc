# Arc Rollout and Operations

This is an acceptance/operating sequence, not authorization to deploy. Complete
the readiness record and resolve the security gate first.

## Stage Order

1. Inventory scopes/resources and approve naming, networking, DNS, identities,
   cost and service ownership. Use existing MGs; no implicit hierarchy changes.
2. Deploy `foundation` per class, then `monitoring` resources and onboarding
   `rbac` at the class operations RG. Review each stage independently.
3. Deploy `connectivity` using actual monitoring outputs and approved network/DNS
   references. Prove host and operator private connectivity, including outages.
4. Publish shared `definitions` under target `governance`, then class
   `assignments` at their class MGs with `Audit` effect.
5. Onboard approved Windows/Linux pilots using Microsoft's current supported
   agent scripts and the separately approved authentication method. Verify
   tenant/subscription/RG, canonical class tag, region and explicit ALPLS
   association at connection time. Never log credentials.
6. Confirm the real machine registration, connected status, OS, location and
   private scope. Set the approved pilot list and deploy `associations`.
7. Verify AMA health, heartbeat and expected event/syslog data in the correct
   class workspace. Test permitted operators and denied cross-class readers.
8. Independently approve Defender billing, then opt in to pricing. Implement and
   test MDE integration/host sensor rollout separately; pricing is not protection.
9. Create `maintenance` windows without assignment. Verify assessment support,
   repositories, time zones/DST, reboot behavior and application exclusions.
   Enable targeting only after pilot approval and check actual patch outcomes.
10. Run HA/fail-closed exercises. Remediate audit findings before GRC-approved
    enforcement changes. Expand in approved rings with explicit stop conditions.

For every workflow, review `what-if.json` from the exact run before approving the
apply environment. Apply checks source revision, target, bundle hashes and a
fresh what-if; drift requires a new preview/approval. Artifacts expire; never
apply an old copied bundle. Workflow runs must target a reviewed source commit.

## Runner-Independent Delivery

From the repository root, after completing the readiness record, resolving the
security gate and committing/reviewing real source parameter values, use an
Azure CLI session authenticated by your approved local or CI login mechanism:

```bash
node scripts/validation/validate.mjs
node scripts/validation/deploy.mjs preview odido arc-we-rvit foundation /tmp/arc-reviewed-preview
```

Review the generated what-if, obtain the same independent change approval used
for CI, then apply the exact bundle from the same clean Git revision:

```bash
node scripts/validation/deploy.mjs apply odido arc-we-rvit foundation /tmp/arc-reviewed-preview
```

Use a unique absolute bundle directory outside the checkout for each preview.
The arguments are `preview|apply projectname environment stage bundle-directory`,
matching the workflow's project/environment/stage selections. Existing protected
GitHub environment names remain unchanged. Generate a fresh preview when moving
from the old target-only command; old bundles lack the project context.
Target scope and readiness come from that project's `deployment/context.bicepparam`;
resource inputs come from the stage file. No GitHub values or input environment
variables are required. The helper retains hash, revision, account-context,
drift and deletion checks. Outside GitHub, your change process/CI must provide
reviewer separation, security-scan gates and artifact access/retention controls;
the helper is not a replacement for them.

## CMDB Reconciliation

CMDB remains authoritative. Its connector is not implemented because no API,
schema or authentication contract was supplied. The implementation must provide
dry-run/diffs, canonical classes, bounded retries, unrelated-tag preservation,
checkpointing, audit records and failed-record reporting with a separate
least-privilege reconciler identity.

Unknown classifications are quarantined. A change between RVIT and Non-RVIT is
an approved migration involving supported resource moves or reconnect workflows,
identity/scope changes and telemetry continuity; never just retag across the
security boundary. Arc governance does not replace VMware DRS placement rules.

## Failure and Recovery

- Pause rollout for missing heartbeat, wrong class/scope, policy-blocked required
  extensions, patch/application regressions or unapproved public egress.
- Investigate DNS answers and private routing from the affected host/site, then
  proxy availability, agent connection, extensions and service data arrival.
  Entra/MDE permitted public destinations are separate from private fallback.
- Do not enable RVIT public access to recover a private-network outage. Any
  Non-RVIT fallback requires approval, expiry, audit and return-to-baseline tests.
- Revert owned infrastructure to an approved revision after preview. Incremental
  deployment does not delete resources merely removed from source or disabled
  by a condition. Any resource/assignment deletion is a separate reviewed action.
- Restore approved policy settings or narrow expiring exemptions if a new deny
  blocks operations. Do not disable the entire baseline by default.
- Stop future patch assignments using an explicitly reviewed removal operation;
  do not rely on `enableAssignment = false` to delete an existing assignment.
  OS/application recovery for installed patches is outside Bicep rollback.
- Preserve workspaces, audit evidence and machine identities. Offboarding and
  agent disconnect/reconnect require dedicated approval and supported procedures.

Record source commit, change/approval ID, deployment IDs, affected inventory,
actual telemetry/MDE/patch results, exceptions and service-owner acceptance.
Alert recipients, independent network-outage detection, recovery targets and
escalation contacts must be supplied before fleet rollout.