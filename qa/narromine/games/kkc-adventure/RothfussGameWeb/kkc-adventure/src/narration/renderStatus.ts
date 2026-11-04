import type { PlayerState } from '../types';

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatCurrency(drabs: number): string {
  if (drabs === 0) {
    return 'nothing';
  }

  const talents = Math.floor(drabs / 100);
  const remainingAfterTalents = drabs % 100;
  const jots = Math.floor(remainingAfterTalents / 10);
  const remainingDrabs = remainingAfterTalents % 10;
  const parts: string[] = [];

  if (talents > 0) {
    parts.push(pluralize(talents, 'talent', 'talents'));
  }

  if (jots > 0) {
    parts.push(pluralize(jots, 'jot', 'jots'));
  }

  if (remainingDrabs > 0) {
    parts.push(pluralize(remainingDrabs, 'drab', 'drabs'));
  }

  return parts.join(', ');
}

export function hungerLabel(hunger: number): string {
  if (hunger <= 20) {
    return 'well-fed';
  }

  if (hunger <= 50) {
    return 'peckish';
  }

  if (hunger <= 80) {
    return 'hungry';
  }

  return 'starving';
}

export function fatigueLabel(fatigue: number): string {
  if (fatigue <= 20) {
    return 'rested';
  }

  if (fatigue <= 50) {
    return 'tired';
  }

  if (fatigue <= 80) {
    return 'weary';
  }

  return 'exhausted';
}

export function renderStatus(state: PlayerState): string {
  const lines = [
    `Character: ${state.character_id} (${state.era})`,
    `Current location: ${state.location_id}`,
    `Money: ${formatCurrency(state.money_drabs)}`,
    `Academic rank: ${state.academic_rank}`,
    `Time: ${state.time_of_day}, day ${state.day_number}, term ${state.term_number}`,
    `Condition: ${hungerLabel(state.hunger)}, ${fatigueLabel(state.fatigue)}`
  ];

  if (state.injuries.length > 0) {
    lines.push(`Injuries: ${state.injuries.join(', ')}`);
  }

  return lines.join('\n');
}

export function renderInventory(state: PlayerState): string {
  if (state.inventory.length === 0) {
    return 'You are carrying nothing of note.';
  }

  return state.inventory
    .map((item) => {
      const notes = item.notes ? ` (${item.notes})` : '';
      return `- ${item.name} x${item.quantity}${notes}`;
    })
    .join('\n');
}