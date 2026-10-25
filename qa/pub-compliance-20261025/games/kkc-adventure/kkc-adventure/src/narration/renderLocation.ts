import { LOCATION_FLAVOUR } from '../content/locationFlavour';
import { timeLabel } from '../engine/time';
import type { Exit, Location, NPC, PlayerState, TimeOfDay } from '../types';

function capitalizeFirst(value: string): string {
  if (value.length === 0) {
    return value;
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function timeIndex(time: TimeOfDay): number {
  switch (time) {
    case 'morning':
      return 0;
    case 'afternoon':
      return 1;
    case 'evening':
      return 2;
    case 'night':
      return 3;
  }
}

function renderExitLine(accessibleExits: Exit[]): string {
  if (accessibleExits.length === 0) {
    return 'There is no obvious way out.';
  }

  const directions = accessibleExits.map((exit) => exit.direction);

  if (directions.length === 1) {
    return `You could go ${directions[0]}.`;
  }

  if (directions.length === 2) {
    return `You could go ${directions[0]} or ${directions[1]}.`;
  }

  const initialDirections = directions.slice(0, -1).join(', ');
  const finalDirection = directions[directions.length - 1];
  return `You could go ${initialDirections}, or ${finalDirection}.`;
}

export function renderLocation(
  location: Location,
  state: PlayerState,
  npcs: NPC[],
  accessibleExits: Exit[]
): string {
  const lines: string[] = [];
  lines.push(`--- ${capitalizeFirst(location.name)} ---`);
  lines.push(location.description_base);

  const flavourLines = LOCATION_FLAVOUR[location.id];

  if (flavourLines && flavourLines.length > 0) {
    const index = (state.day_number + timeIndex(state.time_of_day)) % flavourLines.length;
    lines.push(flavourLines[index]);
  }

  lines.push(`It is ${timeLabel(state.time_of_day)}.`);
  lines.push(renderExitLine(accessibleExits));

  if (npcs.length > 0) {
    const npcLine = npcs.map((npc) => `${npc.name} is here.`).join('\n');
    lines.push(npcLine);
  }

  return lines.join('\n');
}
