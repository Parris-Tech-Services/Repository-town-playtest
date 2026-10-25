import { runInteraction } from './ui/interactions.js';
import { setArchiveLoader } from './ui/archive.js';
const $ = id => document.getElementById(id);
const active = new Set();
const ctx = { activate: k => active.add(k), toggle: k => { if (active.has(k)) { active.delete(k); return false; } active.add(k); return true; } };
let entries = [], tab = 'games', request = 0, opener = null;
// Per-viewer play history and ratings: conveniences only, so storage failures are ignored.
const PLAYS = 'repository-town.arcade.plays.v1';
const load = () => { try { const v = JSON.parse(localStorage.getItem(PLAYS) || '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; } };
const plays = load();
const persist = () => { try { localStorage.setItem(PLAYS, JSON.stringify(plays)); } catch { /* private mode */ } };
const record = (id) => (plays[id] ||= { count: 0, last: 0, rating: 0 });
let archive;
setArchiveLoader(() => archive ||= fetch('repo-data.json').then(r => { if (!r.ok) throw Error('Archive unavailable'); return r.json(); }));
function renderPanel(content) {
  $('exhibit-title').textContent = content.title;
  $('body').innerHTML = content.body;
  $('actions').replaceChildren();
  for (const action of content.actions || []) {
    const el = document.createElement(action.url ? 'a' : 'button'); el.textContent = action.label;
    if (action.url) { el.href = action.url; el.target = '_blank'; el.rel = 'noopener'; }
    else el.onclick = async () => {
      const token = request;
      try {
        if (action.play) { startGame(action.play); return; }
        const next = await (action.run ? action.run() : content.onAnswer(action.answer));
        if (token === request && $('exhibit').open) renderPanel(next);
      } catch (e) { if (token === request) $('body').textContent = `Could not open this exhibit: ${e.message}`; }
    };
    $('actions').append(el);
  }
}
async function openEntry(entry, button) {
  opener = button;
  if (entry.act.do === 'game') return startGame({ id: entry.act.game, title: entry.act.title });
  const token = ++request;
  $('exhibit-title').textContent = entry.label; $('body').textContent = 'Opening…'; $('actions').replaceChildren(); $('exhibit').showModal();
  try { const content = await runInteraction(entry, ctx); if (token === request && $('exhibit').open) renderPanel(content); }
  catch (e) { if (token === request) $('body').textContent = `Could not open this exhibit: ${e.message}`; }
}
function startGame(game) { const r = record(game.id); r.count++; r.last = Date.now(); persist(); request++; $('exhibit').close(); $('game-title').textContent = game.title; $('game-frame').src = `games/${encodeURIComponent(game.id)}/index.html`; $('game').hidden = false; document.body.classList.add('playing'); $('game-exit').focus(); }
function stopGame() { $('game-frame').src = 'about:blank'; $('game').hidden = true; document.body.classList.remove('playing'); render(); opener?.focus(); }
$('game-exit').onclick = stopGame;
$('close-exhibit').onclick = () => $('exhibit').close();
$('exhibit').addEventListener('close', () => { request++; opener?.focus(); });
const gameId = (e) => e.act.game;
const stat = (e) => plays[gameId(e)] || { count: 0, last: 0, rating: 0 };
const SORTS = {
  az: (a, b) => (a.act.title || a.label).localeCompare(b.act.title || b.label),
  recent: (a, b) => stat(b).last - stat(a).last,
  played: (a, b) => stat(b).count - stat(a).count,
  liked: (a, b) => stat(b).rating - stat(a).rating || stat(b).count - stat(a).count,
};
function ago(ms) {
  const m = Math.round((Date.now() - ms) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
}
function card(e) {
  const card = document.createElement('article');
  const tag = document.createElement('p'); tag.className = 'tag'; tag.textContent = e.house;
  const title = document.createElement('h2'); title.textContent = e.act.title || e.label;
  const desc = document.createElement('p'); desc.textContent = e.act.do === 'game' ? e.act.text : `${e.roomName} · ${e.act.do}`;
  const foot = document.createElement('div'); foot.className = 'card-foot';
  const button = document.createElement('button'); button.textContent = e.act.do === 'game' ? '▶ Play' : 'Explore'; button.onclick = () => openEntry(e, button);
  foot.append(button);
  if (e.act.do === 'game') {
    const s = stat(e);
    for (const [value, face, name] of [[1, '👍', 'Like'], [-1, '👎', 'Not for me']]) {
      const b = document.createElement('button'); b.className = 'rate'; b.textContent = face;
      b.setAttribute('aria-label', `${name}: ${e.act.title || e.label}`); b.setAttribute('aria-pressed', String(s.rating === value));
      b.onclick = () => { const r = record(gameId(e)); r.rating = r.rating === value ? 0 : value; persist(); render(); };
      foot.append(b);
    }
    if (s.count) { const p = document.createElement('span'); p.className = 'stats'; p.textContent = `Played ${s.count}× · ${ago(s.last)}`; foot.append(p); }
  }
  card.append(tag, title, desc, foot);
  return card;
}
function render() {
  const q = $('filter').value.trim().toLowerCase();
  const games = tab === 'games';
  const selected = entries.filter(e => (e.act.do === 'game') === games && `${e.house} ${e.label} ${e.act.title || ''} ${e.act.do}`.toLowerCase().includes(q));
  if (games) selected.sort(SORTS[$('sort').value] || SORTS.az);
  $('tools').hidden = !games;
  // Most recent first; the same game in two houses only shows once.
  const seen = new Set();
  const recent = games && !q ? entries.filter(e => e.act.do === 'game' && stat(e).last && !seen.has(gameId(e)) && seen.add(gameId(e))).sort(SORTS.recent).slice(0, 6) : [];
  $('continue').hidden = !recent.length;
  $('continue-cards').replaceChildren(...recent.map(card));
  $('count').textContent = `${selected.length} ${games ? 'games' : 'exhibits'}${q ? ' found' : ' available'}`;
  $('cards').replaceChildren(...selected.map(card));
}
$('sort').onchange = render;
$('surprise').onclick = () => {
  // Favour games not played yet, and never pick one marked "not for me" if there's a choice.
  const games = entries.filter(e => e.act.do === 'game' && stat(e).rating >= 0);
  const fresh = games.filter(e => !stat(e).count);
  const pool = fresh.length ? fresh : games;
  if (pool.length) openEntry(pool[Math.floor(Math.random() * pool.length)], $('surprise'));
};
$('filter').oninput = render;
for (const name of ['games', 'toys']) $(name + '-tab').onclick = () => { tab = name; for (const t of ['games', 'toys']) $(t+'-tab').setAttribute('aria-pressed',String(t === tab)); render(); };
try {
  const response = await fetch('houses.json'); if (!response.ok) throw Error(`HTTP ${response.status}`);
  const { houses } = await response.json();
  entries = houses.flatMap(h => h.int.rooms.flatMap((r, ri) => r.props.flatMap((p, pi) => p[2]?.do ? [{ key: `${h.coordinate}:${ri}:${pi}`, label: p[1], act: p[2], house: `${h.coordinate} · ${h.name}`, roomName: r.name }] : [])));
  render();
} catch (e) { $('count').textContent = `The library could not load: ${e.message}. Please reload to retry.`; }
