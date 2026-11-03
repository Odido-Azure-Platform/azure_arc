# Defender for Servers

Scope: subscription. A small native `Microsoft.Security/pricings` resource
configures the explicitly approved P1 or P2 Servers plan; no matching AVM pricing
module was found. This can change subscription-wide billing, including any
eligible resources outside the Arc RGs, and requires a separate cost review.

Project files keep `costApproved = false`; the delivery helper refuses that
stage until a reviewed source change opts in. False means no new pricing resource
deployment, not disabling an existing plan under incremental deployment.

This initial template configures pricing only. MDE auto-provisioning/integration,
sensor deployment, supported OS coverage, paid extensions, exclusions and plan
inheritance require security-owner decisions and separate implementation. It
does not enable agentless scanning for VMware hosts or create an MDE private
endpoint. Do not report a healthy protected fleet from successful pricing alone.

Validate the existing subscription plan first. Changing or disabling an existing
Defender plan is an explicit security/cost change, never an automatic rollback.