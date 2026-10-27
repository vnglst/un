// Run with RENOVATE_PACKAGE_ROOT pointing at the pinned runner's renovate package.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const root = process.env.RENOVATE_PACKAGE_ROOT;
if (!root) throw new Error('Set RENOVATE_PACKAGE_ROOT to Renovate 44.181.5');
const pkg = JSON.parse(fs.readFileSync(`${root}/package.json`, 'utf8'));
assert.equal(pkg.version, '44.181.5');
const load = relative => import(pathToFileURL(`${root}/dist/${relative}`));
const { applyPackageRules } = await load('util/package-rules/index.js');
const { resolveConfigPresets } = await load('config/presets/index.js');
const { getConfig } = await load('config/defaults.js');
const { mergeChildConfig } = await load('config/utils.js');
const policy = JSON.parse(fs.readFileSync(new URL('../renovate.json', import.meta.url), 'utf8'));
const { config } = await resolveConfigPresets(mergeChildConfig(getConfig(), policy));
assert.deepEqual(config.enabledManagers, ['npm']);
assert.notEqual(config.vulnerabilityAlerts.enabled, true, 'Forced enabling bypasses severity exclusions');
for (const severity of [undefined, 'UNKNOWN', 'LOW', 'MODERATE', 'MEDIUM', 'HIGH', 'CRITICAL']) {
  const packageRules = [...config.packageRules, { matchPackageNames: ['fixture-package'], matchCurrentVersion: '<2.0.0', isVulnerabilityAlert: true, vulnerabilitySeverity: severity, vulnerabilityFixVersion: '2.0.0', force: config.vulnerabilityAlerts }];
  let result = await applyPackageRules({ ...config, packageRules, manager: 'npm', datasource: 'npm', versioning: 'semver', depName: 'fixture-package', packageName: 'fixture-package', currentVersion: '1.0.0', currentValue: '1.0.0' });
  result = await applyPackageRules({ ...result, updateType: 'major', newVersion: '2.0.0' });
  assert.equal(result.enabled !== false && result.force?.enabled !== false, severity === 'CRITICAL', `severity=${severity}`);
  assert.equal(result.automerge, false, 'Only the trusted verifier may merge');
  assert.equal(result.force.automerge, false);
}
for (const updateType of ['major', 'minor', 'patch', 'pin', 'digest', 'pinDigest', 'lockFileMaintenance', 'rollback', 'replacement', 'bump', 'lockfileUpdate']) {
  let result = await applyPackageRules({ ...config, manager: 'npm', datasource: 'npm', versioning: 'semver', depName: 'ordinary-package', packageName: 'ordinary-package', currentVersion: '1.0.0', currentValue: '1.0.0' });
  assert.notEqual(result.enabled, false, 'Extraction must run before alert metadata is available');
  result = await applyPackageRules({ ...result, updateType, newVersion: '2.0.0' });
  assert.equal(result.enabled, false, `ordinary ${updateType} disabled`);
}
console.log('Renovate 44.181.5: only CRITICAL fixes eligible; unknown/lower severities and ordinary updates disabled; built-in automerge disabled.');
