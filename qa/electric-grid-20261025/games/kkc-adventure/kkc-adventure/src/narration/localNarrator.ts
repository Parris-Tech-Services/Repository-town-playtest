import type { Exit, Location, NPC, NarrationProvider, PlayerState } from '../types';
import { renderLocation } from './renderLocation';

const waitLines = [
  'A little while passes, quiet as turning pages.',
  'You linger where you are and let the hour move on.',
  'The day shifts almost without asking your leave.',
  'You wait, and the University settles into a slightly different rhythm.'
];

const fallbackLines = [
  'The thought passes without resolution.',
  'Nothing comes of that just now.',
  'You hesitate, then let the notion go.',
  'The moment offers no clear answer.',
  'For now, the University keeps its own counsel.'
];

export class LocalNarrator implements NarrationProvider {
  renderLocation(location: Location, state: PlayerState, npcs: NPC[], accessibleExits: Exit[]): string {
    return renderLocation(location, state, npcs, accessibleExits);
  }

  renderWait(state: PlayerState): string {
    return waitLines[state.day_number % 4];
  }

  renderFallback(input: string, _state: PlayerState): string {
    return fallbackLines[input.length % 5];
  }

  renderHelp(): string {
    return [
      'If you are at a loss, begin by looking around and taking stock.',
      'You can go north, south, east, west, up, down, enter, or out when the way is open.',
      'Try wait if you mean to let the hour pass, and keep status or inventory close at hand.'
    ].join('\n');
  }
}
