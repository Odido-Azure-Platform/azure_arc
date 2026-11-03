import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputDirectory = process.env.ARC_VALIDATION_OUTPUT || mkdtempSync(path.join(tmpdir(), 'arc-validation-'));
const fixtureId = '11111111-1111-1111-1111-111111111111';
const baseId = `/subscriptions/${fixtureId}/resourceGroups/arc-validation`;
const monitorId = `${baseId}/providers/Microsoft.Insights`;
const fixtures = {
  ARC_SUBNET_ID: `${baseId}/providers/Microsoft.Network/virtualNetworks/validation/subnets/private-endpoints`,
  ARC_DNS_ZONE_IDS: JSON.stringify([`${baseId}/providers/Microsoft.Network/privateDnsZones/privatelink.his.arc.azure.com`]),
  ARC_MONITOR_DNS_ZONE_IDS: JSON.stringify([`${baseId}/providers/Microsoft.Network/privateDnsZones/privatelink.monitor.azure.com`]),
  ARC_WORKSPACE_ID: `${baseId}/providers/Microsoft.OperationalInsights/workspaces/validation`,
  ARC_DCE_IDS: JSON.stringify([`${monitorId}/dataCollectionEndpoints/windows`, `${monitorId}/dataCollectionEndpoints/linux`]),
  ARC_WINDOWS_DCR_ID: `${monitorId}/dataCollectionRules/windows`,
  ARC_LINUX_DCR_ID: `${monitorId}/dataCollectionRules/linux`,
  ARC_WINDOWS_DCE_ID: `${monitorId}/dataCollectionEndpoints/windows`,
  ARC_LINUX_DCE_ID: `${monitorId}/dataCollectionEndpoints/linux`,
  ARC_MACHINES: JSON.stringify([{ name: 'validation-windows', osType: 'Windows' }, { name: 'validation-linux', osType: 'Linux' }]),
  ARC_ONBOARDING_PRINCIPAL_ID: fixtureId,
  ARC_PATCH_START: '2030-01-05 02:00',
  ARC_PATCH_RECURRENCE: '1Week Saturday',
  ARC_INITIATIVE_ID: '/providers/Microsoft.Management/managementGroups/validation/providers/Microsoft.Authorization/policySetDefinitions/arc-servers-baseline',
  ARC_SCOPE_ID: `${baseId}/providers/Microsoft.HybridCompute/privateLinkScopes/validation`,
  ARC_ALLOWED_EXTENSIONS: JSON.stringify(['Microsoft.Azure.Monitor/AzureMonitorWindowsAgent', 'Microsoft.Azure.Monitor/AzureMonitorLinuxAgent']),
  ARC_DEFENDER_PLAN: 'P1',
};

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? files(fullPath) : [fullPath];
  });
}

function execute(command, args, environment = process.env) {
  const result = spawnSync(command, args, { cwd: root, env: environment, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, `${command} ${args.join(' ')}\n${result.error || result.stderr || result.stdout}`);
  return result.stdout;
}

try {
  const templates = files(path.join(root, 'bicep/solutions')).filter(file => file.endsWith('.bicep'));
  const parameters = files(path.join(root, 'projects')).filter(file => file.endsWith('.bicepparam'));
  for (const template of templates) {
    const source = readFileSync(template, 'utf8');
    for (const match of source.matchAll(/'br\/public:([^']+)'/g)) {
      assert.match(match[1], /^avm\/.+:\d+\.\d+\.\d+$/, `Unpinned or non-AVM reference in ${template}`);
    }
    const compiled = execute('az', ['bicep', 'build', '--file', template, '--stdout']);
    JSON.parse(compiled);
    const relative = path.relative(root, template);
    const destination = relative.replaceAll(path.sep, '__').replace(/\.bicep$/, '.json');
    writeFileSync(path.join(outputDirectory, destination), compiled);
    console.log(`PASS build ${relative}`);
  }
  for (const parameterFile of parameters) {
    const source = readFileSync(parameterFile, 'utf8');
    const using = source.match(/^using '([^']+)'/m);
    assert.ok(using, `Missing using declaration: ${parameterFile}`);
    const resolved = path.resolve(path.dirname(parameterFile), using[1]);
    assert.ok(templates.includes(resolved), `Parameter target outside maintained solutions: ${parameterFile}`);
    execute('az', ['bicep', 'build-params', '--file', parameterFile, '--stdout'], { ...process.env, ...fixtures });
    const classValue = parameterFile.includes('arc-we-nrvit') ? 'Non-RVIT' : 'RVIT';
    assert.ok(!source.includes(`classification = '${classValue === 'RVIT' ? 'Non-RVIT' : 'RVIT'}'`));
    if (source.includes('param effect =')) assert.ok(source.includes("param effect = 'Audit'"));
    if (source.includes('param enableAssignment =')) assert.ok(source.includes('param enableAssignment = false'));
    if (source.includes('param costApproved =')) assert.ok(source.includes('param costApproved = false'));
    console.log(`PASS parameters ${path.relative(root, parameterFile)}`);
  }
  for (const directory of ['bicep', 'projects']) {
    const generated = files(path.join(root, directory)).filter(file => /\.(params|parameters)\.json$/.test(file));
    assert.deepEqual(generated, [], 'Generated parameter JSON must not be committed alongside Bicep');
  }
  const tests = files(path.join(root, 'tests')).filter(file => file.endsWith('.test.mjs'));
  const testResult = execute(process.execPath, ['--test', ...tests], { ...process.env, ARC_COMPILED_DIR: outputDirectory });
  console.log(testResult);
  console.log(`PASS ${templates.length} templates, ${parameters.length} parameter sets; no Azure deployment was performed.`);
} finally {
  if (!process.env.ARC_VALIDATION_OUTPUT) rmSync(outputDirectory, { recursive: true, force: true });
}