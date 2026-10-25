export const MAX_HEALTH = 5;
export const MAX_STAMINA = 5;

const WORLD = Object.freeze({
  camp: {
    name: 'Base Camp',
    description: 'A canvas shelter, a cold fire ring and a trail marker pointing into the hills.',
    exits: { north: 'ridge', east: 'creek' },
  },
  creek: {
    name: 'Ironbark Creek',
    description: 'Shallow water slips over red stone. A maintenance crate sits beneath a leaning gum.',
    exits: { west: 'camp', north: 'tower' },
  },
  ridge: {
    name: 'Black Ridge',
    description: 'Wind combs through dry grass. The old radio tower stands to the east.',
    exits: { south: 'camp', east: 'tower' },
  },
  tower: {
    name: 'Signal Tower',
    description: 'The emergency beacon is dark. Its fuse housing is open and empty.',
    exits: { west: 'ridge', south: 'creek' },
  },
});

const ITEM_NAMES = Object.freeze({
  lantern: 'storm lantern',
  fuse: 'copper fuse',
  bandage: 'field bandage',
});

const normalise = (value) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const clone = (state) => ({
  ...state,
  inventory: [...state.inventory],
  discovered: [...state.discovered],
  items: Object.fromEntries(Object.entries(state.items).map(([key, value]) => [key, [...value]])),
  flags: { ...state.flags },
});

export function createInitialState() {
  return {
    version: 1,
    location: 'camp',
    health: MAX_HEALTH,
    stamina: MAX_STAMINA,
    turns: 0,
    inventory: [],
    discovered: ['camp'],
    items: {
      camp: ['lantern'],
      creek: ['fuse', 'bandage'],
      ridge: [],
      tower: [],
    },
    flags: {
      beaconLit: false,
      ridgeHazardTriggered: false,
    },
  };
}

export function isValidState(value) {
  return Boolean(
    value &&
      value.version === 1 &&
      WORLD[value.location] &&
      Number.isInteger(value.health) && value.health >= 0 && value.health <= MAX_HEALTH &&
      Number.isInteger(value.stamina) && value.stamina >= 0 && value.stamina <= MAX_STAMINA &&
      Number.isInteger(value.turns) && value.turns >= 0 &&
      Array.isArray(value.inventory) && value.inventory.every((item) => ITEM_NAMES[item]) &&
      Array.isArray(value.discovered) && value.discovered.every((location) => WORLD[location]) &&
      value.items && typeof value.items === 'object' &&
      value.flags && typeof value.flags.beaconLit === 'boolean' && typeof value.flags.ridgeHazardTriggered === 'boolean'
  );
}

export function describeLocation(state) {
  const place = WORLD[state.location];
  const here = state.items[state.location] || [];
  const exits = Object.keys(place.exits).join(', ');
  const itemText = here.length ? ` You can see ${here.map((item) => `a ${ITEM_NAMES[item]}`).join(' and ')}.` : '';
  return `${place.name}. ${place.description}${itemText} Exits: ${exits}.`;
}

export function getStatus(state) {
  return {
    location: WORLD[state.location].name,
    health: state.health,
    stamina: state.stamina,
    turns: state.turns,
    won: state.flags.beaconLit,
    inventory: state.inventory.map((item) => ITEM_NAMES[item]),
    discovered: state.discovered.map((location) => WORLD[location].name),
  };
}

const aliases = Object.freeze({
  n: 'go north', s: 'go south', e: 'go east', w: 'go west',
  north: 'go north', south: 'go south', east: 'go east', west: 'go west',
  i: 'inventory', inv: 'inventory', l: 'look', h: 'help', '?': 'help',
});

function resolveItem(text) {
  const cleaned = normalise(text).replace(/^(the|a|an) /, '');
  return Object.keys(ITEM_NAMES).find((key) => key === cleaned || ITEM_NAMES[key] === cleaned || ITEM_NAMES[key].includes(cleaned));
}

function response(state, output, { changed = false, tone = 'normal' } = {}) {
  return { state, output, changed, tone };
}

export function executeCommand(currentState, rawInput) {
  if (!isValidState(currentState)) return response(createInitialState(), 'Saved game data was invalid, so a fresh game was started.', { changed: true, tone: 'warning' });

  const original = currentState;
  const input = aliases[normalise(rawInput)] || normalise(rawInput);
  if (!input) return response(original, 'Type a command, or use “help”.');

  if (input === 'help') {
    return response(original, 'Commands: look, go north/east/south/west (or n/e/s/w), take <item>, use <item>, inventory, status, rest, goal, help.');
  }
  if (input === 'look') return response(original, describeLocation(original));
  if (input === 'goal') return response(original, original.flags.beaconLit ? 'Goal complete: the emergency beacon is broadcasting.' : 'Goal: restore the emergency beacon at the Signal Tower.');
  if (input === 'inventory') {
    return response(original, original.inventory.length ? `You carry: ${original.inventory.map((item) => ITEM_NAMES[item]).join(', ')}.` : 'Your pack is empty.');
  }
  if (input === 'status') {
    return response(original, `Health ${original.health}/${MAX_HEALTH}. Stamina ${original.stamina}/${MAX_STAMINA}. Turns ${original.turns}.`);
  }
  if (input === 'rest') {
    if (!['camp', 'creek'].includes(original.location)) return response(original, 'This is not a safe place to stop and recover.');
    const next = clone(original);
    next.stamina = MAX_STAMINA;
    next.health = Math.min(MAX_HEALTH, next.health + 1);
    next.turns += 1;
    return response(next, 'You rest, drink some water and recover your stamina.', { changed: true, tone: 'good' });
  }

  const [verb, ...rest] = input.split(' ');
  const argument = rest.join(' ');

  if (verb === 'go') {
    const direction = argument;
    const target = WORLD[original.location].exits[direction];
    if (!target) return response(original, `You cannot go ${direction || 'that way'} from here.`);
    if (original.stamina <= 0) return response(original, 'You are too exhausted to travel. Rest at camp or the creek first.', { tone: 'warning' });

    const next = clone(original);
    next.location = target;
    next.stamina -= 1;
    next.turns += 1;
    if (!next.discovered.includes(target)) next.discovered.push(target);

    let prefix = `You go ${direction}. `;
    if (target === 'ridge' && !next.inventory.includes('lantern') && !next.flags.ridgeHazardTriggered) {
      next.flags.ridgeHazardTriggered = true;
      next.health = Math.max(0, next.health - 1);
      prefix += 'In the fading light you stumble on loose rock and lose 1 health. ';
    }
    return response(next, `${prefix}${describeLocation(next)}`, { changed: true, tone: next.health === 0 ? 'warning' : 'normal' });
  }

  if (verb === 'take') {
    const item = resolveItem(argument);
    if (!item) return response(original, `There is no item called “${argument || 'that'}” here.`);
    const here = original.items[original.location] || [];
    if (!here.includes(item)) return response(original, `There is no ${ITEM_NAMES[item]} here to take.`);
    const next = clone(original);
    next.items[next.location] = next.items[next.location].filter((value) => value !== item);
    next.inventory.push(item);
    next.turns += 1;
    return response(next, `You take the ${ITEM_NAMES[item]}.`, { changed: true, tone: 'good' });
  }

  if (verb === 'use') {
    const item = resolveItem(argument);
    if (!item || !original.inventory.includes(item)) return response(original, `You are not carrying ${argument ? `the ${argument}` : 'that item'}.`);

    if (item === 'bandage') {
      if (original.health >= MAX_HEALTH) return response(original, 'You are already at full health. Save the bandage.');
      const next = clone(original);
      next.inventory = next.inventory.filter((value) => value !== 'bandage');
      next.health = Math.min(MAX_HEALTH, next.health + 2);
      next.turns += 1;
      return response(next, 'You use the field bandage and recover 2 health.', { changed: true, tone: 'good' });
    }

    if (item === 'lantern') {
      return response(original, original.location === 'ridge' ? 'The lantern throws a steady pool of light across the ridge.' : 'You check the lantern. It is ready when you need it.');
    }

    if (item === 'fuse') {
      if (original.location !== 'tower') return response(original, 'The copper fuse belongs in the emergency beacon at the Signal Tower.');
      if (original.flags.beaconLit) return response(original, 'The beacon is already repaired and broadcasting.');
      const next = clone(original);
      next.inventory = next.inventory.filter((value) => value !== 'fuse');
      next.flags.beaconLit = true;
      next.turns += 1;
      return response(next, 'You seat the copper fuse. The beacon wakes, pulses green, and begins broadcasting your location. You win.', { changed: true, tone: 'win' });
    }
  }

  return response(original, `I do not understand “${rawInput.trim()}”. Type “help” for commands.`);
}
