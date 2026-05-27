# Azure Arc Landing Zone Starter

This folder contains the first implementation slice for the Odido Azure Arc landing zone.

## What it does

- Creates a subscription-scoped landing-zone wrapper for Arc-enabled servers.
- Keeps RVIT and non-RVIT as separate deployment targets.
- Applies stricter governance to RVIT by enabling the stronger policy baseline.
- Deploys only Arc-enabled servers landing-zone foundation components: resource group, Log Analytics workspace, and policy assignments.
- Keeps the landing-zone foundation separate from server onboarding so the two server groups are never mixed.

## Files

- `bicep/main.bicep` - subscription-scoped landing-zone wrapper.
- `bicep/main.rvit.bicepparam` - example parameters for the stricter RVIT boundary.
- `bicep/main.nonrvit.bicepparam` - example parameters for the looser non-RVIT boundary.

## How to use it

Deploy the wrapper once per subscription, choosing the parameter file that matches the intended server boundary for that subscription. Do not reuse the same resource group or landing-zone outputs across the two groups.