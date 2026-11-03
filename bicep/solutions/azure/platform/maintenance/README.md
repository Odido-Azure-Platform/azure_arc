# Arc Maintenance

Scope: class operations RG. Pinned AVM creates an `InGuestPatch` maintenance
window and, only when enabled, a dynamic configuration assignment limited to the
same RG, region, Arc machine resource type and both required tags:
`cmdb.Security.Class` plus `PatchRing`. Missing/unknown tags are excluded.

Supply approved local start, Windows time-zone ID and recurrence. Project files
default to the `pilot` ring with assignment disabled. Creating the window does
not patch hosts. Classifications are Critical/Security and reboot defaults to
IfRequired; approve application/cluster exclusions before targeting any machine.

Assessment settings, update repositories/WSUS access, supported OS eligibility,
pre/post events and application recovery are deployment prerequisites, not
configured by this template. Validate DST behavior and a real pilot patch cycle.

Disable future assignments/windows to stop subsequent runs. Incremental Bicep
with a conditional assignment set to false does not remove a previously deployed
assignment; removal needs an explicitly reviewed operation. Reverting Bicep
cannot uninstall already-applied patches.