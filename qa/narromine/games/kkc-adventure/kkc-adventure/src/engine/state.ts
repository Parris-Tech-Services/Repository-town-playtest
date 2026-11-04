import type BetterSqlite3 from 'better-sqlite3';
import type { AcademicRank, InventoryItem, PlayerState, Reputation, TimeOfDay, TuitionState } from '../types';

type Database = BetterSqlite3.Database;

interface PlayerStateRow {
  character_id: string;
  era: string;
  location_id: string;
  money_drabs: number;
  inventory: string;
  reputation: string;
  time_of_day: string;
  day_number: number;
  term_number: number;
  injuries: string;
  hunger: number;
  fatigue: number;
  academic_rank: string;
  tuition_state: string;
  world_state_flags: string;
}

function parseJson<T>(value: string, fieldName: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(`Failed to parse player state field "${fieldName}".`);
  }
}

function toTimeOfDay(value: string): TimeOfDay {
  if (value === 'morning' || value === 'afternoon' || value === 'evening' || value === 'night') {
    return value;
  }

  throw new Error(`Invalid time_of_day value: ${value}`);
}

function toAcademicRank(value: string): AcademicRank {
  if (value === 'none' || value === 'E_lir' || value === 'Re_lar' || value === 'El_the') {
    return value;
  }

  throw new Error(`Invalid academic_rank value: ${value}`);
}

export function loadPlayerState(db: Database): PlayerState | null {
  const row = db
    .prepare('SELECT character_id, era, location_id, money_drabs, inventory, reputation, time_of_day, day_number, term_number, injuries, hunger, fatigue, academic_rank, tuition_state, world_state_flags FROM player_state WHERE id = 1')
    .get() as PlayerStateRow | undefined;

  if (!row) {
    return null;
  }

  return {
    character_id: row.character_id,
    era: row.era,
    location_id: row.location_id,
    money_drabs: row.money_drabs,
    inventory: parseJson<InventoryItem[]>(row.inventory, 'inventory'),
    reputation: parseJson<Reputation>(row.reputation, 'reputation'),
    time_of_day: toTimeOfDay(row.time_of_day),
    day_number: row.day_number,
    term_number: row.term_number,
    injuries: parseJson<string[]>(row.injuries, 'injuries'),
    hunger: row.hunger,
    fatigue: row.fatigue,
    academic_rank: toAcademicRank(row.academic_rank),
    tuition_state: parseJson<TuitionState>(row.tuition_state, 'tuition_state'),
    world_state_flags: parseJson<Record<string, boolean | string | number>>(row.world_state_flags, 'world_state_flags')
  };
}

export function savePlayerState(db: Database, state: PlayerState): void {
  db.prepare(`
    INSERT INTO player_state (
      id,
      character_id,
      era,
      location_id,
      money_drabs,
      inventory,
      reputation,
      time_of_day,
      day_number,
      term_number,
      injuries,
      hunger,
      fatigue,
      academic_rank,
      tuition_state,
      world_state_flags
    ) VALUES (
      1,
      @character_id,
      @era,
      @location_id,
      @money_drabs,
      @inventory,
      @reputation,
      @time_of_day,
      @day_number,
      @term_number,
      @injuries,
      @hunger,
      @fatigue,
      @academic_rank,
      @tuition_state,
      @world_state_flags
    )
    ON CONFLICT(id) DO UPDATE SET
      character_id = excluded.character_id,
      era = excluded.era,
      location_id = excluded.location_id,
      money_drabs = excluded.money_drabs,
      inventory = excluded.inventory,
      reputation = excluded.reputation,
      time_of_day = excluded.time_of_day,
      day_number = excluded.day_number,
      term_number = excluded.term_number,
      injuries = excluded.injuries,
      hunger = excluded.hunger,
      fatigue = excluded.fatigue,
      academic_rank = excluded.academic_rank,
      tuition_state = excluded.tuition_state,
      world_state_flags = excluded.world_state_flags
  `).run({
    ...state,
    inventory: JSON.stringify(state.inventory),
    reputation: JSON.stringify(state.reputation),
    injuries: JSON.stringify(state.injuries),
    tuition_state: JSON.stringify(state.tuition_state),
    world_state_flags: JSON.stringify(state.world_state_flags)
  });
}

export function initDefaultPlayerState(): PlayerState {
  return {
    character_id: 'kvothe',
    era: 'university',
    location_id: 'university_mews_room',
    money_drabs: 300,
    inventory: [
      {
        id: 'lute',
        name: "Kvothe's lute",
        quantity: 1,
        notes: 'Old but well-kept. Handle carefully.'
      }
    ],
    reputation: {
      academic_standing: 50,
      university_social: 40,
      eolian_standing: 30,
      npc_trust: {}
    },
    time_of_day: 'morning',
    day_number: 1,
    term_number: 1,
    injuries: [],
    hunger: 10,
    fatigue: 10,
    academic_rank: 'E_lir',
    tuition_state: {
      amount_drabs: 30,
      due_on_day: 14,
      paid: false,
      overdue: false
    },
    world_state_flags: {}
  };
}
