# Arc Connectivity

Scope: class connectivity RG. Owns Arc ALPLS, its private endpoint, Azure Monitor
AMPLS and its private endpoint/scope links. Networks, subnets, DNS zones and
VNet links are external references. No enterprise proxy or circuits are created.

Arc ALPLS uses a small native module because the catalog has no equivalent AVM.
AMPLS and private endpoints use pinned AVM. Arc public access is disabled and
Monitor ingestion/query modes are `PrivateOnly`. There is no public fallback.

Inputs: approved existing subnet and DNS zone IDs, class workspace and both DCE
IDs. Outputs: Arc scope, Arc endpoint and Monitor scope IDs. Deploy only after
the `monitoring` resource stage and network/DNS design approval.

A VNet must not use a conflicting Arc scope. Shared DNS requires particular care
with AMPLS; separate subscriptions alone do not provide DNS isolation. Hosts,
operations clients and deployment diagnostics must be able to resolve/reach their
private endpoints. Entra/ARM and MDE still need their separately approved paths.

Acceptance requires real DNS/routing/proxy tests from Windows and Linux hosts in
each site/class; compilation and ARM what-if cannot prove this.