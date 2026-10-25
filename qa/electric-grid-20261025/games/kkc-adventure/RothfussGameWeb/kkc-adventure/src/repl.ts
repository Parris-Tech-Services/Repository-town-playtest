import readline from 'readline';
import type BetterSqlite3 from 'better-sqlite3';
import { dispatch } from './engine/actions';
import { getAccessibleExits, getLocation, getNPCsAtLocation } from './engine/movement';
import { initDefaultPlayerState, loadPlayerState, savePlayerState } from './engine/state';
import type { NarrationProvider } from './types';

type Database = BetterSqlite3.Database;

const welcomeText =
  'You wake to another University morning, the chill of stone and the promise of work already pressing at the edges of the day. Sleep leaves you by slow degrees as the familiar sounds of students and distant industry gather beyond your room. By the time you draw a full breath, the hours ahead feel close and real.';

export function startREPL(db: Database, narrator: NarrationProvider): void {
  const loadedState = loadPlayerState(db);
  let state = loadedState ?? initDefaultPlayerState();
  let turnQueue: Promise<void> = Promise.resolve();

  if (!loadedState) {
    savePlayerState(db, state);
  }

  console.log(welcomeText);

  const startingLocation = getLocation(db, state.location_id);

  if (startingLocation) {
    const startingNpcs = getNPCsAtLocation(db, state.location_id);
    const accessibleExits = getAccessibleExits(startingLocation, state);
    console.log('');
    console.log(narrator.renderLocation(startingLocation, state, startingNpcs, accessibleExits));
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });

  rl.prompt();

  rl.on('line', (line: string) => {
    turnQueue = turnQueue
      .then(async () => {
        const result = await dispatch(line, state, db, narrator);
        console.log(result.output);

        if (result.shouldExit) {
          rl.close();
          return;
        }

        savePlayerState(db, result.newState);
        state = result.newState;
        rl.prompt();
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error(message);
        rl.prompt();
      });
  });

  rl.on('close', () => {
    console.log('The halls grow quiet around you.');
  });
}