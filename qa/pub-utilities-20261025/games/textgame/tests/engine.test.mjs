import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, executeCommand, isValidState, MAX_HEALTH } from '../src/engine.mjs';

function run(state, command) { return executeCommand(state, command).state; }

test('initial state is valid and starts at base camp', () => {
  const state = createInitialState();
  assert.equal(state.location, 'camp');
  assert.equal(state.health, MAX_HEALTH);
  assert.ok(isValidState(state));
});

test('look is read-only', () => {
  const state = createInitialState();
  const result = executeCommand(state, 'look');
  assert.equal(result.changed, false);
  assert.strictEqual(result.state, state);
  assert.equal(result.state.turns, 0);
});

test('moving discovers a location and does not mutate the prior state', () => {
  const state = createInitialState();
  const result = executeCommand(state, 'east');
  assert.equal(result.state.location, 'creek');
  assert.ok(result.state.discovered.includes('creek'));
  assert.deepEqual(state.discovered, ['camp']);
});

test('player can take the fuse and repair the beacon', () => {
  let state = createInitialState();
  state = run(state, 'east');
  state = run(state, 'take fuse');
  state = run(state, 'north');
  const result = executeCommand(state, 'use fuse');
  assert.equal(result.tone, 'win');
  assert.equal(result.state.flags.beaconLit, true);
  assert.ok(!result.state.inventory.includes('fuse'));
});

test('invalid commands do not advance turns', () => {
  const state = createInitialState();
  const result = executeCommand(state, 'teleport moon');
  assert.equal(result.changed, false);
  assert.equal(result.state.turns, 0);
});

test('ridge hazard only triggers once without a lantern', () => {
  let state = createInitialState();
  const first = executeCommand(state, 'north').state;
  const healthAfterFirst = first.health;
  state = run(first, 'south');
  state = run(state, 'north');
  assert.equal(state.health, healthAfterFirst);
});
