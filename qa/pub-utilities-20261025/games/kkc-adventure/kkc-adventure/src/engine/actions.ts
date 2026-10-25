import type BetterSqlite3 from 'better-sqlite3';
import { eat, sleep, busk, payTuition, checkTuitionDeadline } from './economy';
import { getAccessibleExits, getLocation, getNPCsAtLocation, movePlayer } from './movement';
import { parseNPCCommand, talkToNPC } from './npcEngine';
import { advanceTime } from './time';
import { hungerLabel, renderInventory, renderStatus } from '../narration/renderStatus';
import type { CommandResult, NarrationProvider, PlayerState } from '../types';

type Database = BetterSqlite3.Database;

const directionCommands = new Set(['north', 'south', 'east', 'west', 'up', 'down', 'enter', 'out']);

function appendTuitionWarning(output: string, previousState: PlayerState, nextState: PlayerState): string {
  if (!previousState.tuition_state.overdue && nextState.tuition_state.overdue) {
    return `${output}\nA thought nags at you. Your tuition was due.`;
  }

  return output;
}

function finalizeChangedState(output: string, previousState: PlayerState, nextState: PlayerState): CommandResult {
  const checkedState = checkTuitionDeadline(nextState);
  return {
    output: appendTuitionWarning(output, previousState, checkedState),
    newState: checkedState,
    shouldExit: false
  };
}

export async function dispatch(
  input: string,
  state: PlayerState,
  db: Database,
  narrator: NarrationProvider
): Promise<CommandResult> {
  const normalizedInput = input.trim().toLowerCase();

  if (normalizedInput === 'look' || normalizedInput === 'look around') {
    const location = getLocation(db, state.location_id);

    if (!location) {
      return { output: 'You pause, but the place resists description.', newState: state, shouldExit: false };
    }

    const npcs = getNPCsAtLocation(db, state.location_id);
    const accessibleExits = getAccessibleExits(location, state);
    return {
      output: narrator.renderLocation(location, state, npcs, accessibleExits),
      newState: state,
      shouldExit: false
    };
  }

  const parsedNpcCommand = parseNPCCommand(normalizedInput);
  if (parsedNpcCommand) {
    return {
      output: talkToNPC(parsedNpcCommand.npc_id, parsedNpcCommand.topic, state, db),
      newState: state,
      shouldExit: false
    };
  }

  const [command, ...rest] = normalizedInput.split(/\s+/);
  const isGoCommand = command === 'go' && rest.length > 0;
  const movementDirection = isGoCommand ? rest[0] : command;

  if (directionCommands.has(movementDirection)) {
    const moveResult = movePlayer(db, state, movementDirection);

    if (!moveResult.success) {
      return {
        output: moveResult.message,
        newState: state,
        shouldExit: false
      };
    }

    const newLocation = getLocation(db, moveResult.newState.location_id);

    if (!newLocation) {
      return finalizeChangedState('You arrive, but the place feels strangely insubstantial.', state, moveResult.newState);
    }

    const npcs = getNPCsAtLocation(db, moveResult.newState.location_id);
    const accessibleExits = getAccessibleExits(newLocation, moveResult.newState);
    const arrivalLine = `You make your way ${movementDirection}.`;

    return finalizeChangedState(
      `${arrivalLine}\n\n${narrator.renderLocation(newLocation, moveResult.newState, npcs, accessibleExits)}`,
      state,
      moveResult.newState
    );
  }

  if (normalizedInput === 'wait') {
    const newState = advanceTime(state);
    const location = getLocation(db, newState.location_id);

    if (!location) {
      return finalizeChangedState(narrator.renderWait(newState), state, newState);
    }

    const npcs = getNPCsAtLocation(db, newState.location_id);
    const accessibleExits = getAccessibleExits(location, newState);

    return finalizeChangedState(
      `${narrator.renderWait(newState)}\n\n${narrator.renderLocation(location, newState, npcs, accessibleExits)}`,
      state,
      newState
    );
  }

  if (normalizedInput === 'eat') {
    const result = eat(state);
    let output = result.message;

    if (result.newState.hunger !== state.hunger && hungerLabel(result.newState.hunger) !== hungerLabel(state.hunger)) {
      output = `${output}\nThe gnawing eases a little.`;
    }

    return finalizeChangedState(output, state, result.newState);
  }

  if (normalizedInput === 'sleep' || normalizedInput === 'rest') {
    const result = sleep(state);

    if (result.newState === state) {
      return {
        output: result.message,
        newState: state,
        shouldExit: false
      };
    }

    const location = getLocation(db, result.newState.location_id);

    if (!location) {
      return finalizeChangedState(result.message, state, result.newState);
    }

    const npcs = getNPCsAtLocation(db, result.newState.location_id);
    const accessibleExits = getAccessibleExits(location, result.newState);

    return finalizeChangedState(
      `${result.message}\n\n${narrator.renderLocation(location, result.newState, npcs, accessibleExits)}`,
      state,
      result.newState
    );
  }

  if (normalizedInput === 'busk' || normalizedInput === 'play' || normalizedInput === 'perform') {
    const result = busk(state);

    if (result.newState === state) {
      return {
        output: result.message,
        newState: state,
        shouldExit: false
      };
    }

    return finalizeChangedState(result.message, state, result.newState);
  }

  if (normalizedInput === 'pay tuition' || normalizedInput === 'pay fees') {
    const result = payTuition(state);

    if (result.newState === state) {
      return {
        output: result.message,
        newState: state,
        shouldExit: false
      };
    }

    return finalizeChangedState(result.message, state, result.newState);
  }

  if (normalizedInput === 'status' || normalizedInput === 'stats') {
    return {
      output: renderStatus(state),
      newState: state,
      shouldExit: false
    };
  }

  if (normalizedInput === 'inventory' || normalizedInput === 'inv' || normalizedInput === 'i') {
    return {
      output: renderInventory(state),
      newState: state,
      shouldExit: false
    };
  }

  if (normalizedInput === 'help') {
    return {
      output: narrator.renderHelp(),
      newState: state,
      shouldExit: false
    };
  }

  if (normalizedInput === 'quit' || normalizedInput === 'exit') {
    return {
      output: 'You let the day settle and turn your thoughts elsewhere.',
      newState: state,
      shouldExit: true
    };
  }

  return {
    output: narrator.renderFallback(normalizedInput, state),
    newState: state,
    shouldExit: false
  };
}
