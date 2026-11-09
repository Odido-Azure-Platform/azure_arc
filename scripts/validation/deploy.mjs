import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stages = {
  foundation: { solution: 'infrastructure/foundation/foundation', scope: 'sub' },
  monitoring: { solution: 'platform/monitoring/monitoring', scope: 'group', group: 'monitor' },
  connectivity: { solution: 'infrastructure/connectivity/connectivity', scope: 'group', group: 'pls' },
  rbac: { solution: 'platform/identity/rbac/rbac', scope: 'group', group: 'ops' },
  associations: { solution: 'platform/monitoring/associations', scope: 'group', group: 'ops' },
  maintenance: { solution: 'platform/maintenance/maintenance', scope: 'group', group: 'ops' },
  defender: { solution: 'security/defender-for-servers/defender-for-servers', scope: 'sub' },
  definitions: { solution: 'platform/governance/policy/definitions', scope: 'mg' },
  assignments: { solution: 'platform/governance/policy/assignments', scope: 'mg' },
};

export function resolveStage(target, stage) {
  assert.ok(['arc-we-rvit', 'arc-we-nrvit', 'governance'].includes(target), 'Unknown deployment target');
  assert.ok(Object.hasOwn(stages, stage), 'Unknown deployment stage');
  assert.equal(target === 'governance', stage === 'definitions', 'Shared definitions require governance; class stages require a class target');
  return stages[stage];
}

export function resolveDeployment(projectname, environment, stage) {
  assert.ok(['odido'].includes(projectname), 'Unknown deployment project');
  const configuration = resolveStage(environment, stage);
  const projectDirectory = path.join(root, 'projects', projectname, environment);
  const solution = path.join('bicep/solutions/azure', configuration.solution);
  const templateFile = path.join(root, `${solution}.bicep`);
  const parameterFile = path.join(projectDirectory, `${solution}.bicepparam`);
  const source = readFileSync(parameterFile, 'utf8');
  const using = source.match(/^using '([^']+)'/m);
  assert.ok(using, `Missing solution reference in ${parameterFile}`);
  assert.equal(path.resolve(path.dirname(parameterFile), using[1]), templateFile, 'Project parameters must reference the matching reusable solution');
  const contextFile = path.join(projectDirectory, 'deployment/context.bicepparam');
  return { ...configuration, projectDirectory, templateFile, parameterFile, contextFile };
}

export function checkParameters(target, stage, parameters) {
  resolveStage(target, stage);
  const expectedClass = target === 'arc-we-rvit' ? 'RVIT' : 'Non-RVIT';
  if (parameters.classification) assert.equal(parameters.classification.value, expectedClass, 'Wrong class parameters');
  if (stage === 'assignments') assert.ok(['Audit', 'Deny', 'Disabled'].includes(parameters.effect.value));
  if (stage === 'defender') assert.equal(parameters.costApproved.value, true, 'Defender billing has not been approved in source');
  assert.ok(!JSON.stringify(parameters).includes('11111111-1111-1111-1111-111111111111'), 'Synthetic validation IDs cannot be deployed');
  assert.ok(!JSON.stringify(parameters).includes('00000000-0000-0000-0000-000000000000'), 'Placeholder IDs cannot be deployed');
  assert.ok(!JSON.stringify(parameters).includes('REQUIRED_'), 'Replace required values in the source parameter file before deployment');
}

export function checkDeploymentContext(target, stage, parameters) {
  const configuration = resolveStage(target, stage);
  const context = Object.fromEntries(Object.entries(parameters).map(([name, parameter]) => [name, parameter.value]));
  assert.equal(context.implementationReady, true, 'Complete the readiness record and approve implementationReady in deployment/context.bicepparam before Azure operations');
  for (const identifier of [context.subscriptionId, context.tenantId]) {
    assert.match(identifier || '', /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i, 'Set explicit Azure subscription and tenant IDs in deployment/context.bicepparam');
    assert.ok(!['00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111'].includes(identifier), 'Placeholder context IDs cannot be deployed');
  }
  assert.match(context.location || '', /^[a-z0-9]+$/, 'Set the deployment location in deployment/context.bicepparam');
  if (configuration.scope === 'mg') {
    assert.match(context.managementGroupId || '', /^[a-zA-Z0-9_.()-]{1,90}$/, 'Set the management group ID in deployment/context.bicepparam');
    assert.ok(!context.managementGroupId.includes('REQUIRED_'), 'Replace the management group placeholder');
  }
  return context;
}

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

const digest = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');

function az(args) {
  const result = spawnSync('az', [...args, '--only-show-errors', '--output', 'json'], { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, `Azure command failed: az ${args.slice(0, 3).join(' ')}\n${result.error || result.stderr}`);
  return JSON.parse(result.stdout);
}

function compileParameters(file) {
  const compiled = az(['bicep', 'build-params', '--file', file, '--stdout']);
  const parameters = compiled.parametersJson ?? compiled;
  return typeof parameters === 'string' ? JSON.parse(parameters) : parameters;
}

export function rejectDeletes(result) {
  assert.ok(!result.error, 'What-if returned an error');
  assert.ok(Array.isArray(result.changes), 'What-if did not return a change list');
  assert.ok(!result.changes.some(change => change.changeType === 'Delete'), 'Delete changes require a separate approved decommissioning process');
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function main() {
  const [mode, projectname, target, stage, directory] = process.argv.slice(2);
  assert.ok(['preview', 'apply'].includes(mode), 'Usage: deploy.mjs preview|apply projectname environment stage bundle-directory');
  const configuration = resolveDeployment(projectname, target, stage);
  assert.ok(directory && path.isAbsolute(directory), 'Use an absolute runner-temporary bundle directory');
  const bundle = path.resolve(directory);
  const relativeBundle = path.relative(root, bundle);
  assert.ok(relativeBundle.startsWith(`..${path.sep}`), 'Generated deployment bundles must stay outside the source repository');
  const project = configuration.projectDirectory;
  const settings = compileParameters(configuration.contextFile);
  const { subscriptionId, tenantId, managementGroupId, location } = checkDeploymentContext(target, stage, settings.parameters);
  const revision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  assert.equal(revision.status, 0, 'Run delivery from a Git checkout');
  const sourceCommit = revision.stdout.trim();
  assert.match(sourceCommit, /^[0-9a-f]{40}$/i, 'Run delivery from a reviewed source commit');
  const status = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  assert.equal(status.status, 0);
  assert.equal(status.stdout.trim(), '', 'Commit and review configuration changes before delivery');
  const prefix = path.join(project, 'bicep/solutions/azure');
  const currentParameters = compileParameters(configuration.parameterFile);
  checkParameters(target, stage, currentParameters.parameters);
  const account = az(['account', 'show', '--subscription', subscriptionId]);
  assert.equal(account.tenantId.toLowerCase(), tenantId.toLowerCase(), 'Wrong Azure tenant');
  assert.equal(account.id.toLowerCase(), subscriptionId.toLowerCase(), 'Wrong Azure subscription');

  const templateFile = configuration.templateFile;
  const scopeArguments = configuration.scope === 'mg'
    ? ['--management-group-id', managementGroupId, '--location', location]
    : configuration.scope === 'sub' ? ['--location', location] : [];
  if (configuration.scope === 'group') {
    const foundation = compileParameters(path.join(prefix, 'infrastructure/foundation/foundation.bicepparam'));
    checkParameters(target, 'foundation', foundation.parameters);
    scopeArguments.push('--resource-group', foundation.parameters.resourceGroups.value[configuration.group]);
  }
  const commandArguments = ['--subscription', subscriptionId, ...scopeArguments];
  const templatePath = path.join(bundle, 'template.json');
  const parametersPath = path.join(bundle, 'parameters.json');
  const manifestPath = path.join(bundle, 'manifest.json');
  const context = { projectname, target, stage, subscriptionId, tenantId, sourceCommit, scope: configuration.scope, scopeArguments };

  if (mode === 'preview') {
    mkdirSync(bundle, { recursive: true });
    const template = az(['bicep', 'build', '--file', templateFile, '--stdout']);
    const parameters = currentParameters;
    writeJson(templatePath, template);
    writeJson(parametersPath, parameters);
    const inputs = [...commandArguments, '--template-file', templatePath, '--parameters', `@${parametersPath}`];
    az(['deployment', configuration.scope, 'validate', ...inputs]);
    const preview = az(['deployment', configuration.scope, 'what-if', ...inputs]);
    rejectDeletes(preview);
    writeJson(path.join(bundle, 'what-if.json'), preview);
    writeJson(manifestPath, { ...context, templateDigest: digest(template), parameterDigest: digest(parameters), changesDigest: digest(preview.changes) });
    console.log(`Preview ready: ${target}/${stage}. Review what-if.json before approving apply.`);
    return;
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  for (const [key, value] of Object.entries(context)) assert.deepEqual(manifest[key], value, `Preview context changed: ${key}`);
  const template = JSON.parse(readFileSync(templatePath, 'utf8'));
  const parameters = JSON.parse(readFileSync(parametersPath, 'utf8'));
  assert.equal(digest(template), manifest.templateDigest, 'Template changed since preview');
  assert.equal(digest(parameters), manifest.parameterDigest, 'Parameters changed since preview');
  checkParameters(target, stage, parameters.parameters);
  const inputs = [...commandArguments, '--template-file', templatePath, '--parameters', `@${parametersPath}`];
  az(['deployment', configuration.scope, 'validate', ...inputs]);
  const preview = az(['deployment', configuration.scope, 'what-if', ...inputs]);
  rejectDeletes(preview);
  assert.equal(digest(preview.changes), manifest.changesDigest, 'Azure state changed after review; generate and approve a new preview');
  const deployment = az(['deployment', configuration.scope, 'create', ...inputs, '--name', `arc-${stage}-${sourceCommit.slice(0, 12)}-${Date.now()}`]);
  writeJson(path.join(bundle, 'deployment.json'), deployment);
  console.log(`Deployment completed: ${target}/${stage}. Review deployment.json for downstream resource IDs.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();