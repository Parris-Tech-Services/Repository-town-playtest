import Database from 'better-sqlite3';
import { runMigrations } from '../src/db/schema';
import { runSeed } from '../src/db/seed';
import { movePlayer } from '../src/engine/movement';
import { initDefaultPlayerState } from '../src/engine/state';
import { advanceTime } from '../src/engine/time';
import { formatCurrency } from '../src/narration/renderStatus';

describe('formatCurrency', () => {
  test('formats 300 as 3 talents', () => {
    expect(formatCurrency(300)).toBe('3 talents');
  });

  test('formats 15 as 1 jot, 5 drabs', () => {
    expect(formatCurrency(15)).toBe('1 jot, 5 drabs');
  });

  test('formats 7 as 7 drabs', () => {
    expect(formatCurrency(7)).toBe('7 drabs');
  });

  test('formats 0 as nothing', () => {
    expect(formatCurrency(0)).toBe('nothing');
  });
});

describe('advanceTime', () => {
  test('advances morning to afternoon without changing the day number', () => {
    const state = initDefaultPlayerState();
    const nextState = advanceTime(state);

    expect(nextState.time_of_day).toBe('afternoon');
    expect(nextState.day_number).toBe(1);
  });

  test('advances night to morning and increments the day number', () => {
    const state = {
      ...initDefaultPlayerState(),
      time_of_day: 'night' as const,
      day_number: 3
    };
    const nextState = advanceTime(state);

    expect(nextState.time_of_day).toBe('morning');
    expect(nextState.day_number).toBe(4);
  });
});

describe('movement', () => {
  const db = new Database(':memory:');

  beforeAll(() => {
    runMigrations(db);
    runSeed(db);
  });

  test('moves north from university_mains to university_artificery', () => {
    const result = movePlayer(db, { ...initDefaultPlayerState(), location_id: 'university_mains' }, 'north');

    expect(result.success).toBe(true);
    expect(result.newState.location_id).toBe('university_artificery');
  });

  test('returns a no-exit message when moving up from university_mains', () => {
    const result = movePlayer(db, { ...initDefaultPlayerState(), location_id: 'university_mains' }, 'up');

    expect(result.success).toBe(false);
    expect(result.message).toBe('You cannot go that way.');
  });

  test("blocks entering the Archives for an E'lir", () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_archives_exterior'
    };
    const result = movePlayer(db, state, 'enter');

    expect(result.success).toBe(false);
    expect(result.message).toContain("Re'lar");
  });
});
