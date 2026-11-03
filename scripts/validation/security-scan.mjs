import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [directory] = process.argv.slice(2);
assert.ok(directory, 'Usage: security-scan.mjs scan-only-template-directory');
const result = spawnSync(process.env.ARC_CHECKOV_BIN || 'checkov', ['--directory', directory, '--framework', 'arm', '--output', 'json'], {
  encoding: 'utf8',
  env: { ...process.env, LOG_LEVEL: 'ERROR' },
  maxBuffer: 32 * 1024 * 1024,
});
writeFileSync(`${directory}.checkov.json`, result.stdout || '[]');
if (result.error || result.status === 2 || !result.stdout?.trim()) {
  console.error('SECURITY GATE BLOCKED: Checkov could not analyze the templates. This is not a clean scan.');
  console.error(result.error?.message || result.stderr.slice(-5000));
  process.exitCode = 1;
} else {
  const reports = [JSON.parse(result.stdout)].flat();
  let evaluated = 0;
  let failures = 0;
  let parsingErrors = 0;
  for (const report of reports) {
    evaluated += report.summary?.passed || 0;
    evaluated += report.summary?.failed || 0;
    failures += report.summary?.failed || 0;
    parsingErrors += report.summary?.parsing_errors || 0;
    console.log(JSON.stringify(report.summary));
    for (const check of report.results?.failed_checks || []) console.error(`${check.check_id}: ${check.check_name} (${check.file_path})`);
  }
  assert.ok(evaluated > 0, 'SECURITY GATE BLOCKED: Checkov evaluated zero checks');
  assert.equal(parsingErrors, 0, 'SECURITY GATE BLOCKED: Checkov parsing errors');
  assert.equal(failures, 0, 'SECURITY GATE BLOCKED: unresolved findings');
  assert.equal(result.status, 0, 'SECURITY GATE BLOCKED: scanner returned a failure');
}