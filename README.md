# Odido Azure Arc

Azure Arc platform configuration for the RVIT and Non-RVIT server estates.

## Structure

- [Reusable solutions](bicep/guidelines/folderstructure/README.md): pinned AVM
    modules, with small native modules for gaps.
- [Project inputs](projects/odido/README.md): independent RVIT/Non-RVIT
    `.bicepparam` files and shared governance definitions.
- [Validation](.github/workflows/arc-validate.yml): builds, regression tests and
    security gates without Azure credentials.
- [Delivery](.github/workflows/arc-deploy.yml): manual stage selection, OIDC,
    reviewed what-if bundles and separately protected apply environments.

## Status

Repository implementation and sample cleanup were approved on 2026-11-03.
The 1,030-file Jumpstart import has been removed. No Azure resource or machine
configuration has been changed.

Deployment is blocked pending [readiness decisions](docs/decisions/DEPLOYMENT-READINESS.md)
and the security-scanner compatibility issue documented in the
[implementation status](docs/IMPLEMENTATION-STATUS.md). Compiling successfully
does not prove that the target tenant, network or agents are ready.

## Local Validation

Prerequisites: Node.js 22+ and Azure CLI with Bicep CLI 0.43.1. No Azure login is
needed; module restore needs access to the Microsoft public module registry.

```bash
node scripts/validation/validate.mjs
```

The command compiles every template and parameter set, runs policy/delivery
regression tests and uses temporary synthetic inputs. It does not deploy.
Compiled JSON is never committed alongside `.bicep` / `.bicepparam` sources.

## Design and Operations

- [Approved implementation plan](docs/IMPLEMENTATION-PLAN.md)
- [Source architecture](docs/Azure%20Arc%20configuration%20architecture.docx)
- [Operations and rollout runbook](docs/runbooks/OPERATIONS.md)
- [Microsoft Azure Verified Modules](https://azure.github.io/Azure-Verified-Modules/)
