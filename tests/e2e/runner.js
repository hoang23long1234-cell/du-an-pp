#!/usr/bin/env node

/**
 * ============================================================================
 * SlideVault E2E Opaque-Box Automated Test Runner
 * Executes Tier 1 (Features), Tier 2 (Boundaries), Tier 3 (Pairwise),
 * and Tier 4 (Real-World Scenarios).
 * ============================================================================
 */

const path = require('path');

const tier1Suite = require('./tier1_features.test');
const tier2Suite = require('./tier2_boundaries.test');
const tier3Suite = require('./tier3_pairwise.test');
const tier4Suite = require('./tier4_realworld.test');

// Command line argument parsing
const args = process.argv.slice(2);
let selectedTier = null;
let selectedFeature = null;
let verbose = false;

for (const arg of args) {
  if (arg.startsWith('--tier=')) {
    selectedTier = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--feature=')) {
    selectedFeature = arg.split('=')[1].toUpperCase();
  } else if (arg === '--verbose' || arg === '-v') {
    verbose = true;
  }
}

// Assemble all test suites
const allTests = [
  ...tier1Suite.tests,
  ...tier2Suite.tests,
  ...tier3Suite.tests,
  ...tier4Suite.tests
];

// Filter tests based on CLI flags
const filteredTests = allTests.filter(t => {
  if (selectedTier && t.tier !== selectedTier) return false;
  if (selectedFeature && !t.featureId.includes(selectedFeature)) return false;
  return true;
});

console.log('='.repeat(78));
console.log(' SLIDEVAULT E2E AUTOMATED TEST SUITE');
console.log(' Scope: Mobile & Tablet UI Overhaul (R1, R2, R3, R4)');
console.log('='.repeat(78));
console.log(`Discovered ${allTests.length} total test cases across 4 Tiers and 14 Features.`);
if (selectedTier) console.log(`Filter: Tier ${selectedTier}`);
if (selectedFeature) console.log(`Filter: Feature ${selectedFeature}`);
console.log(`Executing ${filteredTests.length} tests...\n`);

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  byTier: { 1: { pass: 0, fail: 0 }, 2: { pass: 0, fail: 0 }, 3: { pass: 0, fail: 0 }, 4: { pass: 0, fail: 0 } },
  byFeature: {},
  failures: []
};

const startTime = Date.now();

for (const test of filteredTests) {
  results.total++;
  const testStart = Date.now();
  let passed = false;
  let errorMsg = null;

  try {
    test.fn();
    passed = true;
  } catch (err) {
    passed = false;
    errorMsg = err.message || String(err);
    results.failures.push({
      id: test.id,
      name: test.name,
      tier: test.tier,
      featureId: test.featureId,
      error: errorMsg
    });
  }

  const duration = Date.now() - testStart;

  if (passed) {
    results.passed++;
    results.byTier[test.tier].pass++;
    if (!results.byFeature[test.featureId]) results.byFeature[test.featureId] = { pass: 0, fail: 0 };
    results.byFeature[test.featureId].pass++;
    if (verbose) {
      console.log(`  [PASS] [T${test.tier}] [${test.id}] ${test.name} (${duration}ms)`);
    }
  } else {
    results.failed++;
    results.byTier[test.tier].fail++;
    if (!results.byFeature[test.featureId]) results.byFeature[test.featureId] = { pass: 0, fail: 0 };
    results.byFeature[test.featureId].fail++;
    console.log(`  [FAIL] [T${test.tier}] [${test.id}] ${test.name}`);
    console.log(`         Error: ${errorMsg}`);
  }
}

const totalDuration = Date.now() - startTime;

console.log('\n' + '='.repeat(78));
console.log(' TEST EXECUTION SUMMARY');
console.log('='.repeat(78));

console.log('\n--- BY TIER ---');
console.log('Tier 1 (Feature Coverage):     ' + `${results.byTier[1].pass} / ${results.byTier[1].pass + results.byTier[1].fail} passed`);
console.log('Tier 2 (Boundaries & Devices): ' + `${results.byTier[2].pass} / ${results.byTier[2].pass + results.byTier[2].fail} passed`);
console.log('Tier 3 (Cross-Feature Combos): ' + `${results.byTier[3].pass} / ${results.byTier[3].pass + results.byTier[3].fail} passed`);
console.log('Tier 4 (Real-World Scenarios): ' + `${results.byTier[4].pass} / ${results.byTier[4].pass + results.byTier[4].fail} passed`);

console.log('\n--- OVERALL STATISTICS ---');
console.log(`Total Executed: ${results.total}`);
console.log(`Passed:         ${results.passed} (${((results.passed / (results.total || 1)) * 100).toFixed(1)}%)`);
console.log(`Failed:         ${results.failed}`);
console.log(`Duration:       ${totalDuration}ms`);
console.log('='.repeat(78));

if (results.failed > 0) {
  console.log(`\nFAILURES (${results.failed}):`);
  results.failures.forEach((f, idx) => {
    console.log(`${idx + 1}. [T${f.tier}] [${f.id}] ${f.name}`);
    console.log(`   Feature: ${f.featureId}`);
    console.log(`   Reason:  ${f.error}\n`);
  });
  process.exit(1);
} else {
  console.log('\nALL TESTS PASSED SUCCESSFULLY! (Exit Code 0)\n');
  process.exit(0);
}
