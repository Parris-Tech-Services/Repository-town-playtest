// Run locally: node tests/expedition.mjs
// No browser, paid AI service or GitHub Actions required.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const source = read('adventure/data.js');
const mod = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const { RELICS, MILESTONES, HOUSE_BADGES, cleanProgress, answerRelic, nextMilestone } = mod;
const houses = JSON.parse(read('houses.json')).houses;
const coords = new Map(houses.map((h) => [h.coordinate, h]));

assert.equal(houses.length, 188);
assert.equal(RELICS.length, 12);
assert.equal(new Set(RELICS.map((r) => r.id)).size, 12);
assert.equal(new Set(RELICS.map((r) => r.coordinate)).size, 12);
for (const r of RELICS) {
  assert.equal(coords.get(r.coordinate)?.visibility, 'public', r.id + ' must not point to a private house');
  assert(r.name && r.clue && r.hint && r.story, 'meaningful relic story: ' + r.id);
  assert(r.options.length === 3 && Number.isInteger(r.correct) && r.correct >= 0 && r.correct < 3, 'valid puzzle: ' + r.id);
}
assert.deepEqual(MILESTONES.map((m) => m.count), [3, 7, 12]);
assert.deepEqual(HOUSE_BADGES.map((m) => m.count), [6, 20, 50]);

let p = cleanProgress({ collected: ['fake'], visited: ['invalid', 'M5', 'M5'], tracked: 'bad', vault: true }, new Set(coords.keys()));
assert.deepEqual(p.collected, []);
assert.deepEqual(p.visited, ['M5']);
assert.equal(p.vault, false);
for (let i = 0; i < RELICS.length; i++) {
  const r = RELICS[i];
  const wrong = answerRelic(p, r.id, (r.correct + 1) % 3);
  assert.equal(wrong.correct, false);
  assert.equal(wrong.progress.collected.length, i);
  const right = answerRelic(p, r.id, r.correct);
  assert.equal(right.first, true);
  assert.equal(right.progress.collected.length, i + 1);
  const duplicate = answerRelic(right.progress, r.id, r.correct);
  assert.equal(duplicate.first, false);
  p = right.progress;
}
assert.equal(p.collected.length, 12);
assert.equal(nextMilestone(p), null);
assert.equal(nextMilestone({ ...p, collected: p.collected.slice(0, 3) }).count, 7);
p.vault = true;
assert.equal(cleanProgress(p).vault, true);

const main = read('main.js');
const html = read('index.html');
const css = read('adventure/adventure.css');
for (const keyword of ['createExpedition', 'expedition.noteVisit', 'expedition.use', 'expedition.drawMap', 'expedition.update']) {
  assert(main.includes(keyword), 'Missing main game integration ' + keyword);
}
for (const id of ['btn-journal', 'journal', 'journal-content', 'expedition-compass', 'expedition-hint']) {
  assert(html.includes('id="' + id + '"'), 'Missing HTML ' + id);
}
assert(css.includes('@media(max-width:700px)'), 'Missing mobile styling');
for (const src of ['main.js', 'adventure/expedition.js']) {
  const content = read(src).replace(/^import .*?;\s*$/gm, '').replace(/^export /gm, '');
  assert.doesNotThrow(() => new Function(content), 'Module syntax ' + src);
}
console.log('PASS: 188 houses, 12 public relics, 12 puzzles, progress persistence rules, quest tiers, integrated controls, JavaScript syntax');
