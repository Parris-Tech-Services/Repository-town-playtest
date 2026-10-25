import type BetterSqlite3 from 'better-sqlite3';
import type { Exit, Location, NPC, PlayerState } from '../types';

type Database = BetterSqlite3.Database;

interface LocationRow {
  id: string;
  name: string;
  era: string;
  tier: 1 | 2 | 3;
  cluster_id: string;
  description_base: string;
  exits: string;
  is_accessible: number;
  travel_time_minutes: number;
  canon_source: string | null;
}

interface NpcRow {
  id: string;
  name: string;
  location_id: string;
  era: string;
  temperament: string;
  speech_style: string;
  conditions: string | null;
}

function parseExits(value: string): Exit[] {
  try {
    return JSON.parse(value) as Exit[];
  } catch {
    throw new Error('Failed to parse exits for location.');
  }
}

function mapLocationRow(row: LocationRow): Location {
  return {
    id: row.id,
    name: row.name,
    era: row.era,
    tier: row.tier,
    cluster_id: row.cluster_id,
    description_base: row.description_base,
    exits: parseExits(row.exits),
    is_accessible: row.is_accessible === 1,
    travel_time_minutes: row.travel_time_minutes,
    canon_source: row.canon_source ?? undefined
  };
}

export function getLocation(db: Database, id: string): Location | null {
  const row = db.prepare('SELECT * FROM locations WHERE id = ?').get(id) as LocationRow | undefined;
  return row ? mapLocationRow(row) : null;
}

export function getAllLocations(db: Database): Location[] {
  const rows = db.prepare('SELECT * FROM locations').all() as LocationRow[];
  return rows.map(mapLocationRow);
}

export function getNPCsAtLocation(db: Database, location_id: string): NPC[] {
  const rows = db.prepare('SELECT * FROM npcs WHERE location_id = ?').all(location_id) as NpcRow[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    location_id: row.location_id,
    era: row.era,
    temperament: row.temperament,
    speech_style: row.speech_style,
    conditions: row.conditions ?? undefined
  }));
}

export function getAccessibleExits(location: Location, state: PlayerState): Exit[] {
  return location.exits.filter((exit) => {
    if (!exit.access_condition) {
      return true;
    }

    if (exit.access_condition === 'requires_Re_lar') {
      return state.academic_rank === 'Re_lar' || state.academic_rank === 'El_the';
    }

    if (exit.access_condition === 'locked_at_night') {
      return state.time_of_day !== 'night';
    }

    return true;
  });
}

export function movePlayer(
  db: Database,
  state: PlayerState,
  direction: string
): { success: boolean; newState: PlayerState; message: string } {
  const currentLocation = getLocation(db, state.location_id);

  if (!currentLocation) {
    return {
      success: false,
      newState: state,
      message: 'You hesitate, unsure where to set your feet.'
    };
  }

  const requestedExit = currentLocation.exits.find(
    (exit) => exit.direction.toLowerCase() === direction.toLowerCase()
  );

  if (!requestedExit) {
    return {
      success: false,
      newState: state,
      message: 'You cannot go that way.'
    };
  }

  if (
    requestedExit.access_condition === 'requires_Re_lar' &&
    (state.academic_rank === 'E_lir' || state.academic_rank === 'none')
  ) {
    return {
      success: false,
      newState: state,
      message: "The Stacks are closed to you. Only a Re'lar may enter the Archives unescorted."
    };
  }

  if (requestedExit.access_condition === 'locked_at_night' && state.time_of_day === 'night') {
    return {
      success: false,
      newState: state,
      message: 'That way is shut for the night.'
    };
  }

  return {
    success: true,
    newState: {
      ...state,
      location_id: requestedExit.target_location_id
    },
    message: ''
  };
}
