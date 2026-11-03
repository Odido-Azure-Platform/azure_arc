# Arc Monitoring

`monitoring.bicep`: class monitoring RG. Creates one Log Analytics workspace,
OS-specific DCEs and Windows/Linux DCRs using pinned AVM. Public ingestion/query
and DCE public access are disabled. Workspace local authentication and
resource-permission-only query access are disabled. Workspace RBAC remains with
approved platform identity administration; no broad query roles are added here.

Collection defaults: Application critical/error/warning events for Windows;
auth/authpriv warning-or-higher syslog for Linux. Project retention is 90 days,
subject to records-owner approval. No broad security/performance collection,
workbooks or alert-routing configuration is guessed.

Outputs: workspace ID plus both DCE and DCR IDs. Connectivity consumes workspace
and DCE IDs. Deploying monitoring resources alone does not onboard or configure
hosts and cannot ingest while private connectivity is incomplete.

`associations.bicep`: class operations RG, after pilot onboarding and private
connectivity checks. Installs AMA through AVM on a nonempty explicit host list,
then creates DCR and `configurationAccessEndpoint` associations. It references
existing Arc machines; it never creates pretend registrations. Automatic AMA
upgrades are enabled; approve this behavior in extension governance.

This is the initial direct-assignment owner. Do not simultaneously enable AMA
or DCR DINE remediation over the same hosts. Before applying, verify each live
machine's class, OS, region, agent status and private scope against inventory.
Acceptance requires heartbeat and expected logs in the correct workspace plus
denied cross-class queries. Alert/action-group rollout awaits routing/ownership
inputs in the readiness record.