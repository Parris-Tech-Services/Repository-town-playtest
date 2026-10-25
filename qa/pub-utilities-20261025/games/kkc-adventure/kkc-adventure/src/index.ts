import 'dotenv/config';

import db from './db/connection';
import { runMigrations } from './db/schema';
import { runSeed } from './db/seed';
import { LocalNarrator } from './narration/localNarrator';
import { startREPL } from './repl';

runMigrations(db);
runSeed(db);
const narrator = new LocalNarrator();
startREPL(db, narrator);
