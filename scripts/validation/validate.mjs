import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputDirectory = process.env.ARC_VALIDATION_OUTPUT || mkdtempSync(path.join(tmpdir(), 'arc-validation-'));

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
    assert.ok(!/\breadEnvironmentVariable\s*\(/.test(source), `Deployment inputs must be in source, not environment variables: ${parameterFile}`);
    const projectRelative = path.relative(path.join(root, 'projects'), parameterFile).split(path.sep);
    if (projectRelative.length === 4 && projectRelative[2] === 'deployment' && projectRelative[3] === 'context.bicepparam') {
      assert.match(source, /^using none\s*$/m);
    } else {
      const using = source.match(/^using '([^']+)'/m);
      assert.ok(using, `Missing using declaration: ${parameterFile}`);
      const resolved = path.resolve(path.dirname(parameterFile), using[1]);
      assert.ok(templates.includes(resolved), `Parameter target outside maintained solutions: ${parameterFile}`);
      const [, projectname, environment, ...solution] = path.relative(root, parameterFile).split(path.sep);
      assert.ok(projectname && environment && solution[0] === 'bicep', `Expected projects/<projectname>/<environment>/bicep/solutions path: ${parameterFile}`);
      const expected = path.join(root, ...solution).replace(/\.bicepparam$/, '.bicep');
      assert.equal(resolved, expected, `Project parameters must mirror their reusable solution path: ${parameterFile}`);
    }
    execute('az', ['bicep', 'build-params', '--file', parameterFile, '--stdout']);
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