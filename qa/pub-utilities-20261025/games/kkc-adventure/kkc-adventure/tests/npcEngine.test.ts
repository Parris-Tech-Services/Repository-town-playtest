import Database from 'better-sqlite3';
import { parseNPCCommand, isNPCPresent, talkToNPC } from '../src/engine/npcEngine';
import { initDefaultPlayerState } from '../src/engine/state';
import { runMigrations } from '../src/db/schema';
import { runSeed } from '../src/db/seed';
import type { NPC } from '../src/types';

describe('npcEngine', () => {
  const db = new Database(':memory:');

  beforeAll(() => {
    runMigrations(db);
    runSeed(db);
  });

  test('parseNPCCommand("talk to simmon") returns the npc id and null topic', () => {
    expect(parseNPCCommand('talk to simmon')).toEqual({ npc_id: 'simmon', topic: null });
  });

  test('parseNPCCommand("ask wilem about classes") returns the npc id and topic', () => {
    expect(parseNPCCommand('ask wilem about classes')).toEqual({ npc_id: 'wilem', topic: 'classes' });
  });

  test('parseNPCCommand("look around") returns null', () => {
    expect(parseNPCCommand('look around')).toBeNull();
  });

  test('isNPCPresent returns true when npc.location_id matches state.location_id', () => {
    const npc: NPC = {
      id: 'simmon',
      name: 'Simmon',
      location_id: 'university_ankers',
      era: 'university',
      temperament: '',
      speech_style: ''
    };
    const state = { ...initDefaultPlayerState(), location_id: 'university_ankers' };

    expect(isNPCPresent(npc, state)).toBe(true);
  });

  test('isNPCPresent returns false when locations differ', () => {
    const npc: NPC = {
      id: 'simmon',
      name: 'Simmon',
      location_id: 'university_ankers',
      era: 'university',
      temperament: '',
      speech_style: ''
    };
    const state = { ...initDefaultPlayerState(), location_id: 'university_mains' };

    expect(isNPCPresent(npc, state)).toBe(false);
  });

  test("talkToNPC('simmon', null, state, db) at university_ankers returns a non-empty string", () => {
    const state = { ...initDefaultPlayerState(), location_id: 'university_ankers' };
    const result = talkToNPC('simmon', null, state, db);

    expect(result.length).toBeGreaterThan(0);
  });

  test("talkToNPC('simmon', null, state, db) at university_mains returns a not here message", () => {
    const state = { ...initDefaultPlayerState(), location_id: 'university_mains' };
    const result = talkToNPC('simmon', null, state, db);

    expect(result).toContain("isn't here");
  });
});
