import 'dotenv/config';

import Database from 'better-sqlite3';
import type BetterSqlite3 from 'better-sqlite3';
import { runMigrations } from './schema';

type DatabaseInstance = BetterSqlite3.Database;

interface SeedLocation {
  id: string;
  name: string;
  era: string;
  tier: number;
  cluster_id: string;
  description_base: string;
  exits: Array<{ direction: string; target_location_id: string; access_condition?: string }>;
  is_accessible: number;
  travel_time_minutes: number;
  canon_source: string;
}

interface SeedNpc {
  id: string;
  name: string;
  location_id: string;
  era: string;
  temperament: string;
  speech_style: string;
  conditions: string | null;
}

const seedLocations: SeedLocation[] = [
  {
    id: 'university_mains',
    name: 'the Mains',
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'Stone passages gather the traffic of the University into a steady hush of footsteps and low conversation. Cool air lingers in the shaded ways, carrying the faint smell of paper, dust, and worked metal.',
    exits: [
      { direction: 'north', target_location_id: 'university_artificery' },
      { direction: 'east', target_location_id: 'university_archives_exterior' },
      { direction: 'south', target_location_id: 'university_medica' },
      { direction: 'west', target_location_id: 'university_courtyard' },
      { direction: 'enter', target_location_id: 'university_mains_hall' }
    ],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_artificery',
    name: 'the Artificery',
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'The air here holds the sharp tang of hot metal and lamp oil. Hammering rings from deeper within, and every sound seems edged with the patience of careful work.',
    exits: [
      { direction: 'south', target_location_id: 'university_mains' },
      { direction: 'down', target_location_id: 'university_fishery_outer' }
    ],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_archives_exterior',
    name: 'the Archives, outer steps',
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'Broad stone steps rise toward the Archives, worn smooth by years of passing feet. The place has a grave stillness to it, broken only by the scrape of shoes and the quiet turn of pages nearby.',
    exits: [
      { direction: 'west', target_location_id: 'university_mains' },
      {
        direction: 'enter',
        target_location_id: 'university_archives_stacks',
        access_condition: 'requires_Re_lar'
      }
    ],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_archives_stacks',
    name: 'the Stacks',
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'The Stacks swallow sound beneath a weight of paper, leather, and old bindings. The air is cool and dry, and even a quiet breath feels loud among so many ordered shelves.',
    exits: [{ direction: 'out', target_location_id: 'university_archives_exterior' }],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_medica',
    name: 'the Medica',
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'Clean linen, bitter tinctures, and steeped herbs mark the Medica before anything else. Voices stay low here, and the rooms feel orderly in a way that encourages caution.',
    exits: [{ direction: 'north', target_location_id: 'university_mains' }],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_mews_room',
    name: "Kvothe's room, the Mews",
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'The room is narrow, spare, and cheap, with just enough space for bed, case, and the day\'s small necessities. Morning light comes grudgingly here, touching bare surfaces and making the cold feel honest.',
    exits: [{ direction: 'out', target_location_id: 'university_mews_corridor' }],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_mews_corridor',
    name: 'the Mews corridor',
    era: 'university',
    tier: 2,
    cluster_id: 'university',
    description_base:
      'The corridor is plain and close, its boards and plaster showing the wear of student lodgings without ceremony. Sounds carry easily here: a door latch, a cough, the creak of someone leaving early for class.',
    exits: [
      { direction: 'in', target_location_id: 'university_mews_room' },
      { direction: 'south', target_location_id: 'university_courtyard' }
    ],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_courtyard',
    name: 'the University courtyard',
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'Open air and stone meet here in a space crossed by students with books under arm and business on their faces. Wind shifts across the yard carrying damp earth, distant forge heat, and the restless sense of a day already underway.',
    exits: [
      { direction: 'north', target_location_id: 'university_mews_corridor' },
      { direction: 'east', target_location_id: 'university_mains' },
      { direction: 'west', target_location_id: 'university_ankers' }
    ],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_ankers',
    name: "Anker's inn",
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'Anker\'s is busy in the practical way of a place that feeds students and hears more than it repeats. Warm food, stale ale, and old wood give the room its character, while the talk rises and falls without ever quite settling.',
    exits: [{ direction: 'east', target_location_id: 'university_courtyard' }],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_fishery_outer',
    name: 'the Fishery, outer workspace',
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'Benches, tools, and heat define the space more than any ornament could. The smell of metal and old scorch hangs in the air, and the noise of careful labor never quite dies away.',
    exits: [{ direction: 'south', target_location_id: 'university_mains' }],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_mains_hall',
    name: 'the Mains, lecture hall',
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'The hall holds the dry stillness of a room built for listening and note-taking. Voices carry plainly here, and the benches keep the memory of long hours, lectures, and examinations.',
    exits: [{ direction: 'out', target_location_id: 'university_mains' }],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  }
];

const seedNpcs: SeedNpc[] = [
  {
    id: 'simmon',
    name: 'Simmon',
    location_id: 'university_ankers',
    era: 'university',
    temperament: 'warm, perceptive, genuinely decent, not naive',
    speech_style:
      'easy and direct, quick to laugh, notices things others miss, does not pry but does not ignore distress either',
    conditions: null
  },
  {
    id: 'wilem',
    name: 'Wilem',
    location_id: 'university_mains',
    era: 'university',
    temperament: 'reserved, loyal, sceptical, economical with words',
    speech_style:
      'brief, dry, Siaru accent shapes his phrasing, rarely volunteers information, trust runs deep once given',
    conditions: null
  },
  {
    id: 'anker',
    name: 'Anker',
    location_id: 'university_ankers',
    era: 'university',
    temperament: 'practical, tolerant, neither warm nor cold',
    speech_style: 'functional, inn-keeper terse, fair but not generous',
    conditions: null
  }
];

export function runSeed(db: DatabaseInstance): void {
  runMigrations(db);

  const locationStatement = db.prepare(`
    INSERT OR IGNORE INTO locations (
      id,
      name,
      era,
      tier,
      cluster_id,
      description_base,
      exits,
      is_accessible,
      travel_time_minutes,
      canon_source
    ) VALUES (
      @id,
      @name,
      @era,
      @tier,
      @cluster_id,
      @description_base,
      @exits,
      @is_accessible,
      @travel_time_minutes,
      @canon_source
    )
  `);

  const npcStatement = db.prepare(`
    INSERT OR IGNORE INTO npcs (
      id,
      name,
      location_id,
      era,
      temperament,
      speech_style,
      conditions
    ) VALUES (
      @id,
      @name,
      @location_id,
      @era,
      @temperament,
      @speech_style,
      @conditions
    )
  `);

  const updateLocationStatement = db.prepare(`
    UPDATE locations
    SET
      name = @name,
      era = @era,
      tier = @tier,
      cluster_id = @cluster_id,
      description_base = @description_base,
      exits = @exits,
      is_accessible = @is_accessible,
      travel_time_minutes = @travel_time_minutes,
      canon_source = @canon_source
    WHERE id = @id
  `);

  const updateNpcStatement = db.prepare(`
    UPDATE npcs
    SET
      name = @name,
      location_id = @location_id,
      era = @era,
      temperament = @temperament,
      speech_style = @speech_style,
      conditions = @conditions
    WHERE id = @id
  `);

  for (const location of seedLocations) {
    const payload = {
      ...location,
      exits: JSON.stringify(location.exits)
    };

    locationStatement.run(payload);
    updateLocationStatement.run(payload);
  }

  for (const npc of seedNpcs) {
    npcStatement.run(npc);
    updateNpcStatement.run(npc);
  }
}

if (require.main === module) {
  const dbPath = process.env.DB_PATH;

  if (!dbPath) {
    throw new Error('DB_PATH is not set. Add it to your environment or .env file.');
  }

  const db = new Database(dbPath);
  runSeed(db);
  console.log('Database seeded.');
}
