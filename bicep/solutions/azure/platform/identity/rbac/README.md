# Arc Onboarding RBAC

Scope: class operations RG. AVM assigns the existing class service principal the
built-in Azure Connected Machine Onboarding role only at this RG. Optional
operator assignments target existing groups with explicitly approved role IDs.

Use the principal's object ID, not its application/client ID. The template does
not create application registrations, credentials, PIM assignments or pipeline
federation. These require their owners' bootstrap approvals.

The CMDB reconciler and deployment identities must be distinct from onboarding.
This template does not grant tag-update rights or subscription Contributor to the
onboarding principal. Verify allowed and denied scope operations after deployment.