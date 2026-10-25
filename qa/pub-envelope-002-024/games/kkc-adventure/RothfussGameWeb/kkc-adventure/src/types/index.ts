export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type AcademicRank = 'none' | 'E_lir' | 'Re_lar' | 'El_the';
export type CanonTier = 1 | 2 | 3;

export interface Exit {
  direction: string;
  target_location_id: string;
  access_condition?: string;
}

export interface Location {
  id: string;
  name: string;
  era: string;
  tier: CanonTier;
  cluster_id: string;
  description_base: string;
  exits: Exit[];
  is_accessible: boolean;
  travel_time_minutes: number;
  canon_source?: string;
}

export interface NPC {
  id: string;
  name: string;
  era: string;
  temperament: string;
  speech_style: string;
  conditions?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
}

export interface Reputation {
  academic_standing: number;
  university_social: number;
  eolian_standing: number;
  npc_trust: Record<string, number>;
}

export interface TuitionState {
  amount_drabs: number;
  due_on_day: number;
  paid: boolean;
  overdue: boolean;
}

export interface NPCProfile {
  id: string;
  name: string;
  era: string;
  home_location_id: string;
  temperament: string;
  speech_style: string;
  known_topics: string[];
  taboo_topics: string[];
  greeting_pool: string[];
  exit_lines: string[];
}

export interface PlayerState {
  character_id: string;
  era: string;
  location_id: string;
  money_drabs: number;
  inventory: InventoryItem[];
  reputation: Reputation;
  time_of_day: TimeOfDay;
  day_number: number;
  term_number: number;
  injuries: string[];
  hunger: number;
  fatigue: number;
  academic_rank: AcademicRank;
  tuition_state: TuitionState;
  world_state_flags: Record<string, boolean | string | number>;
}

export interface NarrationProvider {
  renderLocation(location: Location, state: PlayerState, npcs: NPC[], accessibleExits: Exit[]): string;
  renderWait(state: PlayerState): string;
  renderFallback(input: string, state: PlayerState): string;
  renderHelp(): string;
}

export interface CommandResult {
  output: string;
  newState: PlayerState;
  shouldExit: boolean;
}