# Implementation Status

Updated: 2026-11-03. Repository work approved; no Azure deployment performed.

## Delivered

- Removed the complete unused Jumpstart import: 1,030 tracked files, all below
  `bicep/solutions/azure-arc/`. No external tracked references were found and no
  imported code was retained in the replacement solutions.
- Added 11 Bicep templates (including child modules) for foundation, connectivity,
  monitoring/AMA associations, policy definitions/assignments, onboarding RBAC,
  maintenance windows and explicitly gated Defender pricing.
- Added 17 resource `.bicepparam` sets plus three project-level deployment-context
  `.bicepparam` files, preserving both class roots and shared governance.
- Added repeatable local validation, policy/security-setting/delivery tests,
  pinned workflow actions, OIDC delivery and protected preview/apply stages.
- Defaults remain audit-only governance, no patch assignment, no billing opt-in,
  private-only Arc/Monitor services and no implicit public fallback.

## Verification

The local validator compiles all 11 templates and 20 parameter files; all 15
regression tests pass against compiled policy conditions, explicit module
settings and delivery guards. Actionlint 1.7.7 passes for both workflows;
Markdown links and staged/unstaged whitespace checks pass. Live Azure policy
aliases, real identities, agents and network flows are not validated.

All resource inputs and deployment scopes are now source-controlled Bicep
parameters. No `readEnvironmentVariable` calls or injected input fixtures remain.
Unknown live values are explicit placeholders; source readiness is false and
the delivery helper rejects unresolved values. GitHub variables are restricted
to workflow authentication. The helper uses ordinary Git revision data and an
authenticated Azure CLI, not GitHub runtime metadata.

Checkov 3.4.3 was installed into a temporary package directory because this host
lacks Python ensurepip/venv support. A raw ARM scan returned success but evaluated
zero checks against Bicep 2.0 symbolic resource maps. That result is rejected.

The scan-only adapter exposes symbolic resource maps and nested module templates
as separate resource arrays, preserving the original compiled deployment files.
It copies literal module parameter overrides but does not evaluate arbitrary ARM
expressions, optional resource conditions or deployment loops. These scan files
are not deployable templates and do not prove instance-level compliance.

With those resources exposed, Checkov crashes in
`checkov/arm/utils.py:extract_resource_name_from_reference_func` with
`IndexError: list index out of range` while parsing reference graph edges.
The security helper reports this as blocked, not passed. CI and Azure delivery
remain fail-closed until scanner compatibility or an approved alternative is
verified. No unresolved security findings are claimed to be absent.

The independent source-secret scan returned an empty summary with no findings
and no reported coverage. It is not counted as a verified security pass. Confirm
effective source scanning before declaring the security gate ready.

## Deferred Behind Readiness Gates

Live inventory/adoption, MG bootstrap, OIDC/PIM bootstrap, deployment previews,
host onboarding, CMDB synchronization, reclassification automation, MDE
integration, assessment configuration, alert routing, HA testing and fleet
rollout require the inputs/approvals in the readiness record. No placeholder
CMDB connector or unsupported onboarding authentication was invented.

The manual delivery workflow consolidates the originally proposed separate
foundation/connectivity/governance/operations workflows. Its fixed stage map,
scope-specific parameter paths, per-stage protected environments and separate
identities retain those ownership boundaries without duplicating YAML logic.

## Cleanup Recovery

Original commit: `28c2b577c2bde81a25e6e67b6cbc3a8241b14003`.

The tracked import manifest can be recovered without changing the worktree:

```bash
git ls-tree -r --name-only 28c2b577c2bde81a25e6e67b6cbc3a8241b14003 -- bicep/solutions/azure-arc
```

If rollback is approved, restore only that directory from the original commit.
Do not reset the repository or remove new solutions. The deletion used `git rm`,
and the initial implementation was committed as `f2c2d2b34`. The subsequent
source-parameter portability changes are separate work. No imported
destroy/cleanup automation was executed.