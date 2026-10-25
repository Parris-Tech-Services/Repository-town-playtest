import type BetterSqlite3 from 'better-sqlite3';
import { NPC_PROFILES, NPC_TABOO_RESPONSES, NPC_TOPIC_RESPONSES } from '../content/npcProfiles';
import { getNPCsAtLocation } from './movement';
import type { NPC, NPCProfile, PlayerState } from '../types';

type Database = BetterSqlite3.Database;

const npcAliases: Record<string, string> = {
  simmon: 'simmon',
  wilem: 'wilem',
  anker: 'anker'
};

function normalizeTopic(topic: string): string {
  return topic.trim().toLowerCase();
}

function matchesTopic(topic: string, candidate: string): boolean {
  const normalizedTopic = normalizeTopic(topic);
  const normalizedCandidate = candidate.trim().toLowerCase();
  return normalizedTopic.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedTopic);
}

function getRequestedNpcName(npcId: string): string {
  const profile = NPC_PROFILES[npcId];
  return profile ? profile.name : npcId;
}

function getTopicResponse(npcId: string, topic: string): string | null {
  const responses = NPC_TOPIC_RESPONSES[npcId];

  if (!responses) {
    return null;
  }

  for (const [key, response] of Object.entries(responses)) {
    if (matchesTopic(topic, key)) {
      return response;
    }
  }

  return null;
}

function getTabooResponse(npcId: string, topic: string): string | null {
  const responses = NPC_TABOO_RESPONSES[npcId];

  if (!responses) {
    return null;
  }

  for (const [key, response] of Object.entries(responses)) {
    if (matchesTopic(topic, key)) {
      return response;
    }
  }

  return null;
}

export function getNPCProfile(npc_id: string): NPCProfile | null {
  return NPC_PROFILES[npc_id] ?? null;
}

export function isNPCPresent(npc: NPC, state: PlayerState): boolean {
  return npc.location_id === state.location_id;
}

export function parseNPCCommand(input: string): { npc_id: string; topic: string | null } | null {
  const normalizedInput = input.trim().toLowerCase();
  let npcName: string | null = null;
  let topic: string | null = null;

  const talkOrSpeakMatch = normalizedInput.match(/^(talk to|speak to)\s+([a-z]+)(?:\s+about\s+(.+))?$/);
  if (talkOrSpeakMatch) {
    npcName = talkOrSpeakMatch[2];
    topic = talkOrSpeakMatch[3] ? talkOrSpeakMatch[3].trim() : null;
  }

  const askMatch = normalizedInput.match(/^ask\s+([a-z]+)\s+about\s+(.+)$/);
  if (askMatch) {
    npcName = askMatch[1];
    topic = askMatch[2].trim();
  }

  if (!npcName) {
    return null;
  }

  const npc_id = npcAliases[npcName];

  if (!npc_id) {
    return null;
  }

  return { npc_id, topic };
}

export function talkToNPC(
  npc_id: string,
  topic: string | null,
  state: PlayerState,
  db: Database
): string {
  const profile = getNPCProfile(npc_id);

  if (!profile) {
    return 'No one answers you.';
  }

  const npcsInLocation = getNPCsAtLocation(db, state.location_id);
  const npc = npcsInLocation.find((candidate) => candidate.id === npc_id);

  if (!npc || !isNPCPresent(npc, state)) {
    return `${getRequestedNpcName(npc_id)} isn't here right now.`;
  }

  const greeting = profile.greeting_pool[state.day_number % 3];

  if (topic === null) {
    return greeting;
  }

  const normalizedTopic = normalizeTopic(topic);
  const tabooTopic = profile.taboo_topics.find((candidate) => matchesTopic(normalizedTopic, candidate));

  if (tabooTopic) {
    return getTabooResponse(npc_id, normalizedTopic) ?? `${profile.name} declines to speak on that.`;
  }

  const knownTopic = profile.known_topics.find((candidate) => matchesTopic(normalizedTopic, candidate));

  if (knownTopic) {
    const response = getTopicResponse(npc_id, normalizedTopic) ?? `${profile.name} considers it and gives you a measured answer.`;
    const exitLine = profile.exit_lines[state.day_number % 2];
    return `${greeting} ${response} ${exitLine}`;
  }

  return `${greeting} ${profile.name} considers the subject, then lets it pass without much interest.`;
}
