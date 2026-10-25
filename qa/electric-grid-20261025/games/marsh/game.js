(() => {
  'use strict';

  const C = window.CONTENT;
  const tileColorCache = {};
  const hexTiles = [];
  for (let r = 0; r < C.region.height; r++) {
    const row = C.region.tiles[r];
    for (let q = 0; q < C.region.width; q++) {
      const glyph = row[q];
      const terrain = glyph === 'p' ? 'plains'
        : glyph === 'r' ? 'road'
        : glyph === 'f' ? 'forest'
        : glyph === 'h' ? 'hills'
        : glyph === 's' ? 'swamp'
        : glyph === 'u' ? 'ruins'
        : glyph === '~' ? 'river'
        : glyph === 'w' ? 'river'
        : 'plains';
      hexTiles.push({ q, r, terrain });
    }
  }

  const SETTLEMENTS = Object.fromEntries(C.settlements.map(x => [x.id, x]));
  const NPCS = C.npcs;
  const TOWNS = C.towns;
  const FACTIONS = C.factions;
  const ITEMS = C.items;
  const QUESTS = C.quests;
  const ENEMIES = C.enemies;
  const PARTY_ARCHETYPES = C.partyArchetypes;
  const SITES = Object.fromEntries(C.sites.map(x => [x.id, x]));
  const SITE_BY_COORD = Object.fromEntries(C.sites.map(x => [`${x.q},${x.r}`, x]));
  const SETTLEMENT_BY_COORD = Object.fromEntries(C.settlements.map(x => [`${x.q},${x.r}`, x]));

  const dom = {
    statusStrip: document.getElementById('statusStrip'),
    worldScreen: document.getElementById('worldScreen'),
    townScreen: document.getElementById('townScreen'),
    combatScreen: document.getElementById('combatScreen'),
    modalRoot: document.getElementById('modalRoot'),
    worldCanvas: document.getElementById('worldCanvas'),
    worldSide: document.getElementById('worldSide'),
    townGrid: document.getElementById('townGrid'),
    townInfo: document.getElementById('townInfo'),
    townActions: document.getElementById('townActions'),
    townTitle: document.getElementById('townTitle'),
    townSubtitle: document.getElementById('townSubtitle'),
    townExitBtn: document.getElementById('townExitBtn'),
    townMovePad: document.getElementById('townMovePad'),
    combatBoard: document.getElementById('combatBoard'),
    combatParty: document.getElementById('combatParty'),
    combatInfo: document.getElementById('combatInfo'),
    combatActions: document.getElementById('combatActions'),
    combatLog: document.getElementById('combatLog'),
    saveBtn: document.getElementById('saveBtn'),
    loadBtn: document.getElementById('loadBtn'),
    newBtn: document.getElementById('newBtn')
  };
  const worldCtx = dom.worldCanvas.getContext('2d');

  let hexLayout = [];
  let state = null;

  function defaultState() {
    const party = Object.values(PARTY_ARCHETYPES).map((base) => ({
      id: base.id,
      name: base.name,
      role: base.role,
      color: base.color,
      maxHp: base.maxHp,
      hp: base.maxHp,
      ac: base.ac,
      init: base.init,
      speed: base.speed,
      attackBonus: base.attackBonus,
      basic: clone(base.basic),
      special: clone(base.special),
      statuses: [],
      downed: false
    }));
    return {
      version: C.version,
      seed: 90210,
      rngState: 90210,
      mode: 'world',
      modal: null,
      day: 1,
      hour: 8,
      weather: 'Clear',
      gold: 20,
      renown: 0,
      rations: 7,
      inventory: { ration: 7, tonic: 2 },
      factions: { wardens: 0, gilt: 0, veil: 0 },
      world: {
        q: C.region.start.q,
        r: C.region.start.r,
        discovered: { [`${C.region.start.q},${C.region.start.r}`]: true },
        lastTravelType: null,
        visitedSettlements: { hearthwick: true },
        clearedSites: {},
        activeSettlement: null,
        activeSite: null,
        focus: null
      },
      party,
      leader: 'fighter',
      town: null,
      combat: null,
      quests: {
        cellar_cult: { status: 'locked', step: 0 },
        lost_ledger: { status: 'locked', step: 0 },
        beacon_watch: { status: 'locked', step: 0 },
        ferry_cache: { status: 'locked', step: 0 },
        bell_shrine: { status: 'locked', step: 0 }
      },
      npcMemory: {},
      worldFlags: {},
      notes: [],
      logs: ['The party reaches Hearthwick at first light.']
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function xorshift32() {
    state.rngState ^= state.rngState << 13;
    state.rngState ^= state.rngState >>> 17;
    state.rngState ^= state.rngState << 5;
    return (state.rngState >>> 0) / 4294967296;
  }

  function randInt(min, max) {
    return min + Math.floor(xorshift32() * (max - min + 1));
  }

  function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
  }

  function rollDamage(parts) {
    const [count, sides, mod] = parts;
    let total = mod || 0;
    for (let i = 0; i < count; i++) total += randInt(1, sides);
    return total;
  }

  function addLog(text) {
    state.logs.unshift(`Day ${state.day}, ${formatHour(state.hour)} — ${text}`);
    state.logs = state.logs.slice(0, 60);
  }

  function note(text) {
    state.notes.unshift(text);
    state.notes = state.notes.slice(0, 30);
  }

  function formatHour(hour) {
    const h = ((hour % 24) + 24) % 24;
    const base = h % 12 === 0 ? 12 : h % 12;
    return `${base}${h >= 12 ? 'pm' : 'am'}`;
  }

  function timeLabel() {
    return `Day ${state.day}, ${formatHour(state.hour)} · ${state.weather}`;
  }

  function getHex(q, r) {
    return hexTiles.find(t => t.q === q && t.r === r);
  }

  function currentHex() {
    return getHex(state.world.q, state.world.r);
  }

  function key(q, r) {
    return `${q},${r}`;
  }

  function oddrToCube(q, r) {
    const x = q - (r - (r & 1)) / 2;
    const z = r;
    const y = -x - z;
    return { x, y, z };
  }

  function hexDistance(a, b) {
    const A = oddrToCube(a.q, a.r);
    const B = oddrToCube(b.q, b.r);
    return Math.max(Math.abs(A.x - B.x), Math.abs(A.y - B.y), Math.abs(A.z - B.z));
  }

  function hexNeighbors(q, r) {
    const odd = r & 1;
    const dirs = odd
      ? [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]]
      : [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]];
    return dirs.map(([dq, dr]) => ({ q: q + dq, r: r + dr }))
      .filter(p => p.q >= 0 && p.r >= 0 && p.q < C.region.width && p.r < C.region.height);
  }

  function terrainDef(tile) {
    return C.terrainDefs[tile.terrain];
  }

  function revealAround(q, r) {
    state.world.discovered[key(q, r)] = true;
    hexNeighbors(q, r).forEach(p => state.world.discovered[key(p.q, p.r)] = true);
    Object.values(SITES).forEach(site => {
      if (hexDistance({ q, r }, site) <= 1) state.world.discovered[key(site.q, site.r)] = true;
    });
    C.settlements.forEach(settlement => {
      if (hexDistance({ q, r }, settlement) <= 1) state.world.visitedSettlements[settlement.id] ||= false;
    });
  }

  function setMode(mode) {
    state.mode = mode;
    dom.worldScreen.hidden = mode !== 'world';
    dom.townScreen.hidden = mode !== 'town';
    dom.combatScreen.hidden = mode !== 'combat';
  }

  function renderAll() {
    renderStatus();
    if (state.mode === 'world') renderWorld();
    if (state.mode === 'town') renderTown();
    if (state.mode === 'combat') renderCombat();
    renderModal();
  }

  function renderStatus() {
    const settlement = SETTLEMENT_BY_COORD[key(state.world.q, state.world.r)];
    const site = SITE_BY_COORD[key(state.world.q, state.world.r)];
    const where = state.mode === 'town' ? SETTLEMENTS[state.town.id].name : settlement?.name || site?.name || terrainDef(currentHex()).name;
    const standing = state.party.filter(p => !p.downed).length;
    const totalHp = state.party.reduce((sum, p) => sum + Math.max(0, p.hp), 0);
    const totalMaxHp = state.party.reduce((sum, p) => sum + p.maxHp, 0);
    dom.statusStrip.innerHTML = [
      ['Time', timeLabel()],
      ['Location', where],
      ['Resources', `${state.gold} gold · ${state.rations} rations`],
      ['Renown', `${state.renown}/${C.renownGoal} goal · Day ${state.day}/${C.timeLimitDays}`],
      ['Party', `${standing}/4 standing · ${Math.round((totalHp / totalMaxHp) * 100)}% health`],
      ['Factions', `Wardens ${fmtRep('wardens')} · Guild ${fmtRep('gilt')} · Veil ${fmtRep('veil')}`]
    ].map(([label, value]) => `<div class="stat-chip"><div class="label">${label}</div><div class="value">${value}</div></div>`).join('');
  }

  function fmtRep(id) {
    const v = state.factions[id];
    return v > 0 ? `+${v}` : `${v}`;
  }

  function renderWorld() {
    drawWorldMap();
    const settlement = SETTLEMENT_BY_COORD[key(state.world.q, state.world.r)];
    const site = SITE_BY_COORD[key(state.world.q, state.world.r)];
    const terrain = terrainDef(currentHex());
    const actions = [];
    if (settlement) actions.push(button('Enter settlement', () => enterTown(settlement.id)));
    if (site && !state.world.clearedSites[site.id]) actions.push(button(`Explore ${site.name}`, () => exploreSite(site.id), 'good'));
    actions.push(button('Make camp', makeCamp));
    actions.push(button('Hear road rumours', hearRumours, 'secondary'));

    const questHtml = Object.entries(state.quests)
      .filter(([, q]) => q.status !== 'locked')
      .map(([id, q]) => `<div class="mini-entry"><strong>${QUESTS[id].name}</strong><div>${questText(id)}</div></div>`).join('') || `<div class="muted">No active leads yet. Talk to people.</div>`;

    dom.worldSide.innerHTML = `
      <div class="card">
        <h3>${settlement?.name || site?.name || terrain.name}</h3>
        <p>${settlement?.desc || site?.desc || 'Wind over the road and another stretch of March ahead.'}</p>
        <div class="choice-list">${actions.join('')}</div>
      </div>
      <div class="card">
        <h3>Road Journal</h3>
        <div class="mini-list">${questHtml}</div>
      </div>
      <div class="card">
        <h3>Recent Notes</h3>
        <div class="mini-list">${state.notes.slice(0, 5).map(x => `<div class="mini-entry">${x}</div>`).join('') || '<div class="muted">No notes yet.</div>'}</div>
      </div>
      <div class="card">
        <h3>Party</h3>
        ${state.party.map(p => `<div class="party-row"><span>${p.name}</span><span>${Math.max(0, p.hp)}/${p.maxHp} HP</span></div>`).join('')}
      </div>
      <div class="card">
        <h3>Log</h3>
        <div class="mini-list">${state.logs.slice(0, 8).map(x => `<div class="mini-entry">${x}</div>`).join('')}</div>
      </div>
    `;
  }

  function hearRumours() {
    const line = pick(C.rumours);
    addLog(`You hear a rumour: ${line}`);
    note(`Rumour — ${line}`);
    advanceTime(1);
    renderAll();
  }

  function drawWorldMap() {
    const canvas = dom.worldCanvas;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.max(700, Math.floor(width * (window.devicePixelRatio || 1)));
    canvas.height = Math.max(520, Math.floor(height * (window.devicePixelRatio || 1)));
    worldCtx.setTransform(1, 0, 0, 1, 0, 0);
    const dpr = window.devicePixelRatio || 1;
    worldCtx.scale(dpr, dpr);
    worldCtx.clearRect(0, 0, width, height);

    const size = Math.min((width - 100) / (C.region.width + 0.5), (height - 70) / (C.region.height * 0.9));
    const xOffset = 54;
    const yOffset = 52;
    hexLayout = [];

    hexTiles.forEach(tile => {
      const x = xOffset + size * Math.sqrt(3) * (tile.q + 0.5 * (tile.r & 1));
      const y = yOffset + size * 1.5 * tile.r;
      hexLayout.push({ q: tile.q, r: tile.r, x, y, size });
      const discovered = state.world.discovered[key(tile.q, tile.r)] || tile.q === state.world.q && tile.r === state.world.r;
      const terrain = terrainDef(tile);
      drawHex(x, y, size, discovered ? terrain.color : '#2b241f', discovered ? '#675a47' : '#40372f');
      if (discovered) {
        worldCtx.fillStyle = 'rgba(0,0,0,.12)';
        worldCtx.font = '12px ui-monospace, monospace';
        worldCtx.fillText(terrain.name[0], x - 4, y + 4);
      }
      const settlement = SETTLEMENT_BY_COORD[key(tile.q, tile.r)];
      const site = SITE_BY_COORD[key(tile.q, tile.r)];
      if (discovered && settlement) {
        worldCtx.fillStyle = '#2d1f18';
        worldCtx.beginPath(); worldCtx.arc(x, y, size * 0.24, 0, Math.PI * 2); worldCtx.fill();
        worldCtx.fillStyle = '#eadfc6';
        worldCtx.font = 'bold 12px sans-serif';
        worldCtx.fillText(settlement.name[0], x - 4, y + 4);
      }
      if (discovered && site) {
        worldCtx.fillStyle = state.world.clearedSites[site.id] ? '#8bb083' : '#6b566e';
        worldCtx.fillRect(x - size * 0.18, y - size * 0.18, size * 0.36, size * 0.36);
      }
    });

    const here = hexLayout.find(x => x.q === state.world.q && x.r === state.world.r);
    if (here) {
      worldCtx.fillStyle = '#ffffff';
      worldCtx.strokeStyle = '#221813';
      worldCtx.lineWidth = 2;
      worldCtx.beginPath(); worldCtx.arc(here.x, here.y, here.size * 0.28, 0, Math.PI * 2); worldCtx.fill(); worldCtx.stroke();
    }
  }

  function drawHex(cx, cy, size, fill, stroke) {
    worldCtx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 180 * (60 * i - 30);
      const x = cx + size * Math.cos(angle);
      const y = cy + size * Math.sin(angle);
      if (i === 0) worldCtx.moveTo(x, y); else worldCtx.lineTo(x, y);
    }
    worldCtx.closePath();
    worldCtx.fillStyle = fill;
    worldCtx.fill();
    worldCtx.strokeStyle = stroke;
    worldCtx.lineWidth = 1.25;
    worldCtx.stroke();
  }

  function button(label, onClick, variant = '') {
    const id = `btn-${Math.random().toString(36).slice(2)}`;
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.onclick = onClick;
    }, 0);
    return `<button id="${id}" class="${variant}">${label}</button>`;
  }

  function onWorldCanvasClick(ev) {
    if (state.mode !== 'world') return;
    const rect = dom.worldCanvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const hit = hexLayout.find(h => Math.hypot(h.x - x, h.y - y) <= h.size * 0.92);
    if (!hit) return;
    const dist = hexDistance({ q: state.world.q, r: state.world.r }, hit);
    if (dist !== 1) {
      addLog('The party can only move one hex at a time.');
      renderAll();
      return;
    }
    moveToHex(hit.q, hit.r);
  }

  function moveToHex(q, r) {
    const tile = getHex(q, r);
    const cost = terrainDef(tile).move;
    state.world.q = q;
    state.world.r = r;
    state.world.focus = null;
    revealAround(q, r);
    advanceTime(cost);
    if (state.rations > 0 && state.hour % 6 === 0) consumeRation();
    addLog(`The party travels into ${terrainDef(tile).name.toLowerCase()}.`);
    maybeTravelEvent(tile);
    renderAll();
  }

  function maybeTravelEvent(tile) {
    const chance = terrainDef(tile).risk + (state.world.lastTravelType === tile.terrain ? 0.05 : 0);
    state.world.lastTravelType = tile.terrain;
    if (xorshift32() > chance) return;
    const events = [
      { text: 'Fresh boot prints cross the road and vanish toward scrub.', action: () => note('Tracks near the road. Someone has been shadowing caravans.') },
      { text: 'Cold rain sets in. Progress slows and tempers dip.', action: () => damageWholeParty(1, 'A hard rain leaves the party chilled.') },
      { text: 'A pair of raiders step from cover and demand a toll.', action: () => startCombatFromWorld('road_ambush', 'road', ['raider', 'hound']) },
      { text: 'You find a dropped satchel marked with Gilt wax.', action: () => { giveItem('satchel', 1); state.quests.ferry_cache.status = state.quests.ferry_cache.status === 'locked' ? 'known' : state.quests.ferry_cache.status; note('A courier satchel may matter to Nyra or Corven.'); } }
    ];
    const event = pick(events);
    event.action();
    addLog(event.text);
  }

  function consumeRation() {
    if (state.rations <= 0) {
      damageWholeParty(1, 'The party goes hungry on the road.');
      return;
    }
    state.rations -= 1;
    state.inventory.ration = Math.max(0, (state.inventory.ration || 0) - 1);
  }

  function advanceTime(hours) {
    state.hour += hours;
    while (state.hour >= 24) {
      state.hour -= 24;
      state.day += 1;
      dailyWear();
    }
    state.weather = pick(['Clear', 'Windy', 'Clouded', 'Mist']);
  }

  function dailyWear() {
    if (state.rations < 2) damageWholeParty(1, 'A lean day leaves everyone a little worse.');
    if (state.day > C.timeLimitDays) addLog('The March grows impatient. Time is running thin.');
  }

  function damageWholeParty(amount, logText) {
    state.party.forEach(p => damageActorRecord(p, amount));
    if (logText) addLog(logText);
  }

  function makeCamp() {
    advanceTime(8);
    if (state.rations > 0) consumeRation();
    state.party.forEach(p => {
      p.hp = Math.min(p.maxHp, p.hp + 4);
      p.statuses = p.statuses.filter(s => s !== 'bleed');
      p.downed = p.hp <= 0;
    });
    addLog('The party makes camp, mends gear, and catches what rest it can.');
    renderAll();
  }

  function enterTown(townId) {
    state.town = {
      id: townId,
      x: TOWNS[townId].start.x,
      y: TOWNS[townId].start.y,
      lastScene: null
    };
    state.world.activeSettlement = townId;
    state.world.visitedSettlements[townId] = true;
    setMode('town');
    addLog(`The party enters ${SETTLEMENTS[townId].name}.`);
    renderAll();
  }

  function renderTown() {
    const town = TOWNS[state.town.id];
    dom.townTitle.textContent = SETTLEMENTS[state.town.id].name;
    dom.townSubtitle.textContent = SETTLEMENTS[state.town.id].desc;
    dom.townGrid.textContent = buildTownAscii(town, state.town.x, state.town.y);
    renderTownInfo(town);
    renderTownActions(town);
  }

  function buildTownAscii(town, px, py) {
    const grid = town.rows.map(r => r.split(''));
    town.npcs.forEach(npc => {
      if (npc.x === px && npc.y === py) return;
      grid[npc.y][npc.x] = npc.glyph;
    });
    grid[py][px] = '@';
    return grid.map(r => r.join('')).join('\n');
  }

  function tileCharAtTown(town, x, y) {
    if (x < 0 || y < 0 || y >= town.rows.length || x >= town.rows[0].length) return '#';
    return town.rows[y][x];
  }

  function townNpcAt(town, x, y) {
    return town.npcs.find(n => n.x === x && n.y === y);
  }

  function renderTownInfo(town) {
    const tile = tileCharAtTown(town, state.town.x, state.town.y);
    const legend = town.legends[tile];
    const nearbyNpcs = nearbyTownNpcs(town);
    const nearbyBuildings = nearbyTownBuildings(town);
    dom.townInfo.innerHTML = `
      <div class="card">
        <h3>Where you are</h3>
        <p>${legend ? legend.name : tile === '=' ? 'On the road through town.' : tile === '.' ? 'In the open street.' : 'Near the edge of town.'}</p>
        <div class="row">${nearbyBuildings.map(b => `<span class="tag">${b.name}</span>`).join('') || '<span class="tag">street</span>'}</div>
      </div>
      <div class="card">
        <h3>Nearby people</h3>
        ${nearbyNpcs.map(n => {
          const npc = NPCS[n.id];
          const mem = state.npcMemory[n.id] || { met: false, talks: 0 };
          return `<div class="mini-entry"><strong>${npc.name}</strong> · ${npc.role}<div>${mem.met ? 'They know your face now.' : 'You have not spoken yet.'}</div></div>`;
        }).join('') || '<div class="muted">No one is close enough to address.</div>'}
      </div>
      <div class="card">
        <h3>Conversation memory</h3>
        <div class="mini-list">${Object.entries(state.npcMemory).filter(([, mem]) => mem.met).slice(0, 5).map(([id, mem]) => `<div class="mini-entry"><strong>${NPCS[id].name}</strong><div>${mem.lastTopic || 'They remember you.'}</div></div>`).join('') || '<div class="muted">No strong impressions yet.</div>'}</div>
      </div>
    `;
  }

  function nearbyTownNpcs(town) {
    return town.npcs.filter(n => Math.abs(n.x - state.town.x) + Math.abs(n.y - state.town.y) <= 1);
  }

  function nearbyTownBuildings(town) {
    const out = [];
    const dirs = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
    dirs.forEach(([dx, dy]) => {
      const ch = tileCharAtTown(town, state.town.x + dx, state.town.y + dy);
      if (town.legends[ch]) out.push(town.legends[ch]);
    });
    return out.filter((v, i, a) => a.findIndex(x => x.name === v.name) === i);
  }

  function renderTownActions(town) {
    const actions = [];
    nearbyTownNpcs(town).forEach(n => {
      actions.push(button(`Talk to ${NPCS[n.id].name}`, () => talkToNpc(n.id), 'good'));
    });
    nearbyTownBuildings(town).forEach(loc => {
      if (loc.type === 'building') actions.push(button(`Enter ${loc.name}`, () => enterScene(loc.scene)));
      if (loc.type === 'exit') actions.push(button(`Leave via ${loc.name}`, leaveTown, 'secondary'));
    });
    actions.push(button('Rest for 3 gold', restAtTown, 'secondary'));
    actions.push(button('Use field tonic', useTonic, 'secondary'));
    dom.townActions.innerHTML = actions.join('') || '<div class="muted">Move around to find someone or somewhere useful.</div>';
  }

  function moveTown(dx, dy) {
    if (state.mode !== 'town') return;
    const town = TOWNS[state.town.id];
    const nx = state.town.x + dx;
    const ny = state.town.y + dy;
    const ch = tileCharAtTown(town, nx, ny);
    if (ch === '#' || ch === '~') return;
    state.town.x = nx;
    state.town.y = ny;
    advanceTime(1);
    renderAll();
  }

  function leaveTown() {
    addLog(`The party leaves ${SETTLEMENTS[state.town.id].name}.`);
    state.town = null;
    setMode('world');
    renderAll();
  }

  function restAtTown() {
    if (state.gold < 3) {
      flash('Not enough gold.');
      return;
    }
    state.gold -= 3;
    advanceTime(8);
    state.party.forEach(p => {
      p.hp = Math.min(p.maxHp, p.hp + 8);
      p.statuses = [];
      p.downed = p.hp <= 0;
    });
    addLog('The party takes warm beds and a proper meal.');
    renderAll();
  }

  function useTonic() {
    if ((state.inventory.tonic || 0) < 1) {
      flash('No field tonic left.');
      return;
    }
    state.inventory.tonic -= 1;
    state.party.forEach(p => p.hp = Math.min(p.maxHp, p.hp + 5));
    addLog('The party shares a tonic and steadies itself.');
    renderAll();
  }

  function flash(text) {
    state.modal = {
      title: 'Notice',
      body: `<p>${text}</p>`,
      choices: [{ label: 'Close', action: closeModal }]
    };
    renderModal();
  }

  function closeModal() {
    state.modal = null;
    renderModal();
  }

  function renderModal() {
    const modal = state.modal;
    if (!modal) {
      dom.modalRoot.innerHTML = '';
      dom.modalRoot.hidden = true;
      return;
    }
    dom.modalRoot.hidden = false;
    dom.modalRoot.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-card">
        <div class="modal-head"><h2>${modal.title}</h2><button id="modalCloseBtn">Close</button></div>
        <div class="modal-body">${modal.body}</div>
        <div class="choice-list modal-choices">${modal.choices.map((c, i) => `<button id="modalChoice${i}" class="${c.variant || ''}">${c.label}</button>`).join('')}</div>
      </div>
    `;
    document.getElementById('modalCloseBtn').onclick = closeModal;
    modal.choices.forEach((c, i) => {
      document.getElementById(`modalChoice${i}`).onclick = () => {
        state.modal = null;
        c.action?.();
        renderAll();
      };
    });
  }

  function talkToNpc(id) {
    const npc = NPCS[id];
    const mem = state.npcMemory[id] || { met: false, talks: 0, lastTopic: '' };
    mem.met = true;
    mem.talks += 1;
    state.npcMemory[id] = mem;

    let body = `<p><strong>${npc.name}</strong>, ${npc.role} of ${FACTIONS[npc.faction].name}, studies you for a moment.</p>`;
    const choices = [];

    switch (id) {
      case 'rowan_pike': {
        mem.lastTopic = state.quests.bell_shrine.status === 'completed' ? 'You restored hope to the shrine road.' : 'Hearthwick needs the road to stay safe.';
        body += `<p>${mem.talks === 1 ? '“If the March had more honest blades and fewer speeches, I would sleep better.”' : '“You look like someone who keeps walking instead of talking. Good.”'}</p>`;
        if (state.quests.bell_shrine.status === 'locked') choices.push({ label: 'Ask about trouble on the road', action: () => { state.quests.bell_shrine.status = 'known'; note('Rowan mentioned the silent bell shrine and Sister Elira\'s worry over it.'); addLog('Rowan points you toward Sister Elira and the silent shrine.'); } });
        break;
      }
      case 'tessa_reed': {
        mem.lastTopic = 'She tracks every stranger who pays in clipped coin.';
        body += `<p>“Sanctum merchants smile too quickly these days. Someone is buying black salt and trouble.”</p>`;
        choices.push({ label: 'Buy 2 rations for 2 gold', action: () => { if (state.gold >= 2) { state.gold -= 2; giveItem('ration', 2); state.rations += 2; addLog('Tessa packs you two dry travel meals.'); } else flash('Not enough gold.'); } });
        break;
      }
      case 'sister_elira': {
        mem.lastTopic = state.quests.bell_shrine.status === 'completed' ? 'The bell sounds again.' : 'The old bell shrine has gone silent.';
        body += `<p>“The old bell shrine kept travellers steady. Now it is mute. Silence is how bad things walk close.”</p>`;
        if (state.inventory.shrineBell > 0 && state.quests.bell_shrine.status !== 'completed') {
          choices.push({ label: 'Return the bell piece', action: () => completeQuest('bell_shrine', 'Elira hangs the clapper in place and the road feels less forsaken.') });
        } else if (state.quests.bell_shrine.status === 'known' || state.quests.bell_shrine.status === 'locked') {
          choices.push({ label: 'Accept the bell shrine task', action: () => { state.quests.bell_shrine.status = 'active'; state.quests.bell_shrine.step = 1; addLog('You promise Elira to recover the missing bell piece.'); } });
        }
        break;
      }
      case 'yselle_quill': {
        mem.lastTopic = state.quests.lost_ledger.status === 'completed' ? 'The ledger is back in the archive.' : 'An archive ledger has gone missing.';
        body += `<p>“Records are memory, and memory is how towns stay themselves. Someone stole one of ours.”</p>`;
        if (state.quests.lost_ledger.status === 'locked') choices.push({ label: 'Take the ledger job', action: () => { state.quests.lost_ledger.status = 'active'; state.quests.lost_ledger.step = 1; addLog('Yselle asks you to find the missing Lantern Ledger.'); } });
        if (state.inventory.ledger > 0 && state.quests.lost_ledger.status !== 'completed') choices.push({ label: 'Return the Lantern Ledger', action: () => completeQuest('lost_ledger', 'You place the stolen ledger back into Yselle\'s hands.') });
        break;
      }
      case 'captain_bram': {
        mem.lastTopic = state.quests.cellar_cult.status === 'completed' ? 'The cellar cult has been broken.' : 'He suspects Sanctum is rotting from underneath.';
        body += `<p>“I can guard gates. Harder to guard secrets. Something under the Lantern Cup smells wrong.”</p>`;
        if (state.quests.cellar_cult.status === 'locked') choices.push({ label: 'Offer to investigate the tavern cellar', action: () => { state.quests.cellar_cult.status = 'active'; state.quests.cellar_cult.step = 1; addLog('Captain Bram quietly asks you to inspect the Lantern Cup cellar.'); } });
        break;
      }
      case 'nyra_voss': {
        mem.lastTopic = 'Nyra weighs profit against survival and never says which wins.';
        body += `<p>“Roads are stories with prices. Some stories should be bought before Wardens read them.”</p>`;
        if (state.inventory.satchel > 0) choices.push({ label: 'Show her the courier satchel', action: () => { state.factions.gilt += 1; state.gold += 4; note('Nyra paid to keep quiet about the satchel.'); addLog('Nyra buys the satchel and asks no further questions.'); state.inventory.satchel -= 1; } });
        choices.push({ label: 'Buy a tonic for 5 gold', action: () => { if (state.gold >= 5) { state.gold -= 5; giveItem('tonic', 1); addLog('Nyra slips you a sealed tonic bottle.'); } else flash('Not enough gold.'); } });
        break;
      }
      case 'innkeep_morrow': {
        mem.lastTopic = state.quests.cellar_cult.status === 'completed' ? 'The Lantern Cup cellar is quiet again.' : 'Strangers use the cellar stairs after dark.';
        body += `<p>“You didn\'t hear it from me, but some guests go down with empty hands and come up shaking.”</p>`;
        if (state.quests.cellar_cult.status === 'active') choices.push({ label: 'Ask for the cellar key', action: () => { state.worldFlags.sanctumCellarOpen = true; addLog('Morrow hands over the cellar key and tells you to be quick.'); } });
        break;
      }
      case 'corven_reed': {
        mem.lastTopic = state.quests.ferry_cache.status === 'completed' ? 'The ferry cache is settled.' : 'His stolen key may unlock more than a crate.';
        body += `<p>“Mud keeps secrets until the river wants them back. My key went missing, and so did half my nerve.”</p>`;
        if (state.quests.ferry_cache.status === 'locked') choices.push({ label: 'Take the ferry cache job', action: () => { state.quests.ferry_cache.status = 'active'; state.quests.ferry_cache.step = 1; addLog('Corven asks you to recover the missing ferry cache key.'); } });
        if (state.inventory.ferryKey > 0 && state.quests.ferry_cache.status !== 'completed') choices.push({ label: 'Return the ferry key', action: () => completeQuest('ferry_cache', 'Corven exhales like he has been holding that breath for a week.') });
        break;
      }
      case 'dockmaster_ira': {
        mem.lastTopic = 'Ira watches cargo first and people second.';
        body += `<p>“Everything crossing the river gets weighed. Except rumours. Those leak.”</p>`;
        choices.push({ label: 'Buy 1 ration for 1 gold', action: () => { if (state.gold >= 1) { state.gold -= 1; giveItem('ration', 1); state.rations += 1; addLog('Ira sells you dried fish and hard bread.'); } else flash('Not enough gold.'); } });
        break;
      }
      case 'veska_dane': {
        mem.lastTopic = 'Veska knows where the Ashen Veil hides its wet work.';
        body += `<p>“Keys, ledgers, relics — the March hides everything in wood, mud, and piety. Easy places to lose things.”</p>`;
        if (state.quests.ferry_cache.status === 'active' && state.quests.ferry_cache.step === 1) choices.push({ label: 'Press her about the key', action: () => { state.quests.ferry_cache.step = 2; note('Veska hinted the stolen key was thrown near Reed Ford after a fight.'); addLog('Veska points you toward Reed Ford.'); state.factions.veil += 1; } });
        break;
      }
      case 'serah_cole': {
        mem.lastTopic = state.quests.beacon_watch.status === 'completed' ? 'The beacon burns again.' : 'Brindlewatch needs oil and strong hands.';
        body += `<p>“A dark beacon invites the wrong kind of bravery. Light it, and half the road fear drains away.”</p>`;
        if (state.quests.beacon_watch.status === 'locked') choices.push({ label: 'Take the beacon duty', action: () => { state.quests.beacon_watch.status = 'active'; state.quests.beacon_watch.step = 1; addLog('Serah asks you to relight the Lantern Tower.'); } });
        break;
      }
      case 'quartermaster_olin': {
        mem.lastTopic = 'He counts oil tins like prayers.';
        body += `<p>“No beacon burns on goodwill. Oil costs. Men cost. Stupidity costs more.”</p>`;
        if (state.quests.beacon_watch.status === 'active' && state.quests.beacon_watch.step === 1) choices.push({ label: 'Collect beacon oil', action: () => { giveItem('beaconOil', 1); state.quests.beacon_watch.step = 2; addLog('Olin issues a dented oil can and a warning not to waste it.'); } });
        break;
      }
      case 'scout_fera': {
        mem.lastTopic = 'She has seen Veil smoke near the tower path.';
        body += `<p>“I saw a lantern move in daylight near the tower. That means Veil work or worse.”</p>`;
        break;
      }
      default:
        body += `<p>There is more to say here later.</p>`;
    }

    choices.push({ label: 'Leave', action: () => {} });
    state.modal = { title: npc.name, body, choices };
    renderModal();
  }

  function giveItem(id, qty) {
    state.inventory[id] = (state.inventory[id] || 0) + qty;
  }

  function completeQuest(id, wrapText) {
    const quest = state.quests[id];
    if (!quest || quest.status === 'completed') return;
    quest.status = 'completed';
    const reward = QUESTS[id].reward || {};
    state.gold += reward.gold || 0;
    state.renown += reward.renown || 0;
    if (reward.faction) {
      Object.entries(reward.faction).forEach(([f, v]) => state.factions[f] += v);
    }
    if (id === 'lost_ledger') state.inventory.ledger = Math.max(0, (state.inventory.ledger || 0) - 1);
    if (id === 'ferry_cache') state.inventory.ferryKey = Math.max(0, (state.inventory.ferryKey || 0) - 1);
    if (id === 'bell_shrine') state.inventory.shrineBell = Math.max(0, (state.inventory.shrineBell || 0) - 1);
    addLog(`${QUESTS[id].name} completed.`);
    note(wrapText);
    flash(`${wrapText}<br><br><strong>Reward:</strong> ${reward.gold || 0} gold, ${reward.renown || 0} renown.`);
  }

  function questText(id) {
    const q = state.quests[id];
    const quest = QUESTS[id];
    const stepMap = {
      cellar_cult: ['Find a way into the cellar.', 'Deal with whoever is beneath the tavern.', 'Return to Captain Bram.'],
      lost_ledger: ['Find where the ledger was taken.', 'Recover the ledger.', 'Return it to Yselle.'],
      beacon_watch: ['Speak to Olin for oil.', 'Carry the oil to Lantern Tower.', 'Relight the beacon and report back.'],
      ferry_cache: ['Find who took the key.', 'Follow the lead to Reed Ford.', 'Return the key to Corven.'],
      bell_shrine: ['Search the Old Bell Shrine.', 'Recover the missing bell piece.', 'Return it to Elira.']
    };
    if (q.status === 'completed') return 'Completed.';
    return `${q.status}${q.status === 'active' || q.status === 'known' ? ` — ${stepMap[id][Math.max(0, q.step - 1)] || quest.summary}` : ''}`;
  }

  function enterScene(sceneId) {
    const scene = buildScene(sceneId);
    state.modal = {
      title: scene.title,
      body: `<p>${scene.text}</p>${scene.extra || ''}`,
      choices: scene.choices
    };
    renderModal();
  }

  function buildScene(sceneId) {
    switch (sceneId) {
      case 'hearthwick_inn':
        return {
          title: 'Crooked Lantern Inn',
          text: 'Warm bread, gossip, and damp boots. Your companions keep a back table while Tessa measures every face in the room.',
          choices: [
            { label: 'Rest for 3 gold', action: restAtTown },
            { label: 'Ask after Sanctum', action: () => hearRumours() },
            { label: 'Leave', action: () => {} }
          ]
        };
      case 'hearthwick_shrine':
        return {
          title: 'Roadside Shrine',
          text: state.quests.bell_shrine.status === 'completed' ? 'The shrine bell rings gently in the wind again.' : 'A niche of soot-dark stone. Elira keeps it better than the road deserves.',
          choices: [
            { label: 'Leave an offering (1 gold, +1 hp all)', action: () => { if (state.gold >= 1) { state.gold -= 1; state.party.forEach(p => p.hp = Math.min(p.maxHp, p.hp + 1)); addLog('The little shrine leaves the party a touch steadier.'); } else flash('Not enough gold.'); } },
            { label: 'Leave', action: () => {} }
          ]
        };
      case 'sanctum_tavern':
        return {
          title: 'Lantern Cup Tavern',
          text: 'Old brass lamps, thick stew, and a back stair that should not look as worn as it does.',
          extra: state.worldFlags.sanctumCellarOpen ? '<p>The cellar key feels heavier than iron should.</p>' : '',
          choices: [
            { label: 'Drink and listen', action: hearRumours },
            ...(state.worldFlags.sanctumCellarOpen ? [{ label: 'Go down to the cellar', action: () => startQuestCombat('cellar_cult', 'cellar', ['acolyte', 'hound', 'raider']) }] : []),
            { label: 'Leave', action: () => {} }
          ]
        };
      case 'sanctum_archive':
        return {
          title: 'Archive Annex',
          text: 'Wax tablets, bound ledgers, and dust that somehow feels judged.',
          choices: [
            { label: 'Study the missing ledger trail', action: () => { if (state.quests.lost_ledger.status === 'active' && state.quests.lost_ledger.step < 2) { state.quests.lost_ledger.step = 2; note('Archive marks point toward the Ashen Ruin and a seal from Gloam Ferry.'); addLog('You trace the ledger theft toward the Ashen Ruin.'); } else flash('You do not find a fresh lead.'); } },
            { label: 'Leave', action: () => {} }
          ]
        };
      case 'sanctum_exchange':
        return {
          title: 'Guild Exchange',
          text: 'Clerks glance at you with the professional warmth of people pricing your mistakes.',
          choices: [
            { label: 'Sell one trade good for gold', action: sellTradeGood },
            { label: 'Leave', action: () => {} }
          ]
        };
      case 'sanctum_watch':
        return {
          title: 'West Watch',
          text: 'Bram keeps charts pinned to damp boards: lantern lines, raider runs, and things that should not all overlap.',
          choices: [
            { label: 'Review threat map', action: () => { note('The road between Sanctum and Gloam Ferry is where too many stories vanish.'); addLog('The watch marks Gloam Ferry and the tower path as current trouble.'); } },
            { label: 'Leave', action: () => {} }
          ]
        };
      case 'gloam_dock':
        return { title: 'Dock Office', text: 'Waterlogged ledgers, tariffs, and the smell of river rope. Ira keeps everything in ordered piles except his patience.', choices: [{ label: 'Leave', action: () => {} }] };
      case 'gloam_tavern':
        return { title: 'Wet Rope Tavern', text: 'The floor leans. So do the patrons. Every table looks like it has heard too much.', choices: [{ label: 'Hear ferry gossip', action: hearRumours }, { label: 'Leave', action: () => {} }] };
      case 'gloam_ferry':
        return { title: 'Ferry Slip', text: 'Wet ropes slap the pilings while Corven watches the current like it owes him an apology.', choices: [{ label: 'Leave', action: () => {} }] };
      case 'gloam_warehouse':
        return {
          title: 'Warehouse',
          text: state.quests.ferry_cache.status === 'active' && state.quests.ferry_cache.step >= 2 ? 'A gap under old boards suggests the cache was moved in a hurry.' : 'Crates, mildew, and a floor scarred by dragged weight.',
          choices: [
            { label: 'Search the floor', action: () => { if (state.quests.ferry_cache.status === 'active' && state.quests.ferry_cache.step >= 2 && !state.inventory.ferryKey) { giveItem('ferryKey', 1); addLog('You recover the ferry cache key wedged beneath a split plank.'); } else flash('Nothing more turns up.'); } },
            { label: 'Leave', action: () => {} }
          ]
        };
      case 'brindle_beacon':
        return {
          title: 'Beacon Stairs',
          text: 'The wind claws at the stone. From here the March looks like a map someone folded badly.',
          choices: [
            { label: 'Climb and look east', action: () => { note('From the beacon you can see the Lantern Tower and the black scar of Ashen Ruin.'); addLog('The high view knits the March together in your head.'); } },
            { label: 'Leave', action: () => {} }
          ]
        };
      default:
        return {
          title: 'Interior',
          text: 'There is a room here, and it belongs more to the March than to you.',
          choices: [{ label: 'Leave', action: () => {} }]
        };
    }
  }

  function sellTradeGood() {
    const tradeIds = Object.keys(state.inventory).filter(id => ITEMS[id] && ITEMS[id].type === 'trade' && state.inventory[id] > 0);
    if (!tradeIds.length) {
      flash('You have no trade goods to sell.');
      return;
    }
    const id = tradeIds[0];
    state.inventory[id] -= 1;
    state.gold += ITEMS[id].value;
    addLog(`You sell ${ITEMS[id].name} for ${ITEMS[id].value} gold.`);
  }

  function exploreSite(id) {
    const site = SITES[id];
    switch (id) {
      case 'old_bell_shrine':
        if (state.world.clearedSites[id]) { flash('The shrine is quiet now.'); return; }
        state.modal = {
          title: site.name,
          body: `<p>${site.desc}</p><p>The stone bell frame is empty. Fresh ash marks stain the plinth.</p>`,
          choices: [
            { label: 'Search the shrine', action: () => { giveItem('shrineBell', 1); state.world.clearedSites[id] = true; if (state.quests.bell_shrine.status === 'active') state.quests.bell_shrine.step = 2; addLog('You recover the missing bell clapper wrapped in greasy cloth.'); } },
            { label: 'Leave', action: () => {} }
          ]
        };
        renderModal();
        return;
      case 'lantern_tower':
        if (!state.inventory.beaconOil) { flash('You need beacon oil first.'); return; }
        startQuestCombat('beacon_watch', 'tower', ['hound', 'raider', 'acolyte']);
        return;
      case 'ashen_ruin':
        startQuestCombat('lost_ledger', 'shrine', ['acolyte', 'bruiser', 'cantor']);
        return;
      case 'reed_ford':
        state.modal = {
          title: site.name,
          body: `<p>${site.desc}</p><p>The reeds hide dragged footprints and a snapped ferry rope.</p>`,
          choices: [
            { label: 'Search the bank', action: () => { if (state.quests.ferry_cache.status === 'active' && state.quests.ferry_cache.step < 2) { state.quests.ferry_cache.step = 2; note('Reed Ford confirms Veska\'s hint. The missing key was thrown toward the Gloam warehouse.'); addLog('At Reed Ford you find proof the key was moved toward Gloam Ferry.'); } else flash('Cold mud and little else.'); } },
            { label: 'Leave', action: () => {} }
          ]
        };
        renderModal();
        return;
      default:
        flash('There is nothing to explore there yet.');
    }
  }

  function startCombatFromWorld(kind, mapId, enemyIds) {
    state.world.activeSite = kind;
    const resultId = kind;
    startCombat({ source: 'world', returnMode: 'world', encounterId: resultId, mapId, enemyIds, returnTown: null });
  }

  function startQuestCombat(questId, mapId, enemyIds) {
    startCombat({ source: 'quest', returnMode: state.mode, encounterId: questId, mapId, enemyIds, returnTown: state.town?.id || null });
  }

  function startCombat(payload) {
    const map = C.encounterMaps[payload.mapId];
    const actors = [];
    const partyStart = [[0, 1], [0, 3], [0, 5], [0, 6]];
    state.party.forEach((p, i) => {
      actors.push({
        id: p.id,
        side: 'party',
        refId: p.id,
        name: p.name,
        glyph: p.role[0],
        x: partyStart[i][0],
        y: partyStart[i][1],
        hp: p.hp,
        maxHp: p.maxHp,
        ac: p.ac,
        init: p.init,
        speed: p.speed,
        attackBonus: p.attackBonus,
        basic: clone(p.basic),
        special: clone(p.special),
        statuses: clone(p.statuses || []),
        downed: p.downed,
        acted: false,
        moved: false
      });
    });
    const enemyStart = [[7, 1], [7, 3], [7, 5], [6, 6], [6, 2]];
    payload.enemyIds.forEach((id, i) => {
      const base = ENEMIES[id];
      actors.push({
        id: `${id}-${i}`,
        side: 'enemy',
        refId: id,
        name: base.name,
        glyph: base.glyph,
        x: enemyStart[i][0],
        y: enemyStart[i][1],
        hp: base.maxHp,
        maxHp: base.maxHp,
        ac: base.ac,
        init: base.init,
        speed: base.speed,
        attackBonus: base.attackBonus,
        damage: clone(base.damage),
        range: base.range || 1,
        ai: base.ai,
        statuses: [],
        acted: false,
        moved: false
      });
    });
    const initiative = actors.filter(a => !a.downed).map(a => ({ id: a.id, score: a.init + randInt(1, 20) })).sort((a, b) => b.score - a.score).map(a => a.id);
    state.combat = {
      payload,
      mapId: payload.mapId,
      board: map.rows.map(r => r.split('')),
      w: map.w,
      h: map.h,
      round: 1,
      actors,
      initiative,
      turnIndex: 0,
      selectedActorId: null,
      mode: 'idle',
      log: ['Combat begins.'],
      message: 'Choose an action for the active hero.',
      highlights: []
    };
    setMode('combat');
    refreshCombatTurn();
    renderAll();
  }

  function combatActor(id) {
    return state.combat.actors.find(a => a.id === id);
  }

  function livingActors(side) {
    return state.combat.actors.filter(a => a.side === side && !a.downed && a.hp > 0);
  }

  function refreshCombatTurn() {
    const combat = state.combat;
    combat.actors.forEach(a => { a.acted = false; a.moved = false; });
    combat.mode = 'idle';
    combat.highlights = [];
    while (combat.turnIndex < combat.initiative.length) {
      const actor = combatActor(combat.initiative[combat.turnIndex]);
      if (actor && actor.hp > 0 && !actor.downed) {
        combat.selectedActorId = actor.id;
        if (actor.side === 'enemy') {
          enemyTurn(actor);
          if (state.mode === 'combat') return;
        } else {
          combat.message = `${actor.name}'s turn.`;
          return;
        }
      }
      combat.turnIndex += 1;
    }
    combat.round += 1;
    combat.turnIndex = 0;
    combat.initiative = combat.actors.filter(a => a.hp > 0 && !a.downed).map(a => ({ id: a.id, score: a.init + randInt(1, 20) })).sort((a, b) => b.score - a.score).map(a => a.id);
    refreshCombatTurn();
  }

  function renderCombat() {
    const combat = state.combat;
    if (!combat) return;
    dom.combatInfo.innerHTML = `
      <div class="card"><h3>Encounter</h3><p>${combat.payload.encounterId.replace(/_/g, ' ')}</p><div class="row"><span class="tag">Round ${combat.round}</span><span class="tag">${combat.message}</span></div></div>
      <div class="card"><h3>Objectives</h3><p>Keep the party standing. Clear the field. Effects and wounds carry back into the world.</p></div>
    `;
    dom.combatParty.innerHTML = state.party.map(p => `<div class="party-row ${p.id === combat.selectedActorId ? 'active-row' : ''}"><span>${p.name}</span><span>${Math.max(0, p.hp)}/${p.maxHp} HP</span></div>`).join('');
    renderCombatActions();
    renderCombatBoard();
    dom.combatLog.innerHTML = combat.log.slice(0, 10).map(x => `<div class="mini-entry">${x}</div>`).join('');
  }

  function renderCombatActions() {
    const combat = state.combat;
    const actor = combatActor(combat.selectedActorId);
    if (!actor || actor.side !== 'party') {
      dom.combatActions.innerHTML = '<div class="muted">Enemies are acting.</div>';
      return;
    }
    dom.combatActions.innerHTML = [
      button(`Move (${actor.speed})`, () => setCombatMode('move'), actor.moved ? 'secondary' : ''),
      button(actor.basic.name, () => setCombatMode('basic'), actor.acted ? 'secondary' : 'good'),
      button(actor.special.name, () => setCombatMode('special'), actor.acted ? 'secondary' : 'good'),
      button('End turn', endHeroTurn, 'secondary')
    ].join('');
  }

  function setCombatMode(mode) {
    const combat = state.combat;
    const actor = combatActor(combat.selectedActorId);
    if (!actor || actor.side !== 'party') return;
    if (mode === 'move' && actor.moved) return;
    if ((mode === 'basic' || mode === 'special') && actor.acted) return;
    combat.mode = mode;
    combat.highlights = [];
    if (mode === 'move') combat.highlights = reachableTiles(actor, actor.speed);
    else if (mode === 'basic') combat.highlights = targetableTiles(actor, actor.basic.range);
    else if (mode === 'special') combat.highlights = actor.special.heal ? allyTargetTiles(actor, actor.special.range) : targetableTiles(actor, actor.special.range);
    renderAll();
  }

  function reachableTiles(actor, steps) {
    const queue = [{ x: actor.x, y: actor.y, d: 0 }];
    const seen = new Set([`${actor.x},${actor.y}`]);
    const result = [];
    while (queue.length) {
      const cur = queue.shift();
      if (cur.d > 0) result.push({ x: cur.x, y: cur.y });
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = cur.x + dx, ny = cur.y + dy;
        const k = `${nx},${ny}`;
        if (seen.has(k) || !inCombatBounds(nx, ny) || cur.d + 1 > steps) continue;
        if (!passableCombatTile(nx, ny) || actorAt(nx, ny)) continue;
        seen.add(k);
        queue.push({ x: nx, y: ny, d: cur.d + 1 });
      }
    }
    return result;
  }

  function targetableTiles(actor, range) {
    const result = [];
    for (let y = 0; y < state.combat.h; y++) {
      for (let x = 0; x < state.combat.w; x++) {
        if (Math.abs(actor.x - x) + Math.abs(actor.y - y) <= range) result.push({ x, y });
      }
    }
    return result;
  }

  function allyTargetTiles(actor, range) {
    return state.combat.actors.filter(a => a.side === 'party' && !a.downed && Math.abs(actor.x - a.x) + Math.abs(actor.y - a.y) <= range).map(a => ({ x: a.x, y: a.y }));
  }

  function inCombatBounds(x, y) {
    return x >= 0 && y >= 0 && x < state.combat.w && y < state.combat.h;
  }

  function actorAt(x, y) {
    return state.combat.actors.find(a => a.x === x && a.y === y && !a.downed && a.hp > 0);
  }

  function passableCombatTile(x, y) {
    const ch = state.combat.board[y][x];
    return ch !== '#';
  }

  function renderCombatBoard() {
    const combat = state.combat;
    dom.combatBoard.style.gridTemplateColumns = `repeat(${combat.w}, minmax(0,1fr))`;
    dom.combatBoard.innerHTML = '';
    const active = combatActor(combat.selectedActorId);
    for (let y = 0; y < combat.h; y++) {
      for (let x = 0; x < combat.w; x++) {
        const cell = document.createElement('button');
        cell.className = 'board-cell';
        const tile = combat.board[y][x];
        const occupant = actorAt(x, y);
        if (tile === '#') cell.classList.add('wall');
        if (tile === '^') cell.classList.add('hazard');
        if (combat.highlights.some(p => p.x === x && p.y === y)) cell.classList.add('highlight');
        if (occupant) {
          cell.textContent = occupant.glyph;
          cell.style.color = occupant.side === 'party' ? '#eed69f' : '#f08f7c';
          cell.classList.add(occupant.side);
          if (active && occupant.id === active.id) cell.classList.add('selected');
        } else {
          cell.textContent = tile === '^' ? '^' : tile === '#' ? '■' : '·';
        }
        cell.onclick = () => onCombatCellClick(x, y);
        dom.combatBoard.appendChild(cell);
      }
    }
  }

  function onCombatCellClick(x, y) {
    const combat = state.combat;
    if (!combat) return;
    const actor = combatActor(combat.selectedActorId);
    if (!actor || actor.side !== 'party') return;
    const target = actorAt(x, y);
    if (combat.mode === 'move') {
      if (combat.highlights.some(p => p.x === x && p.y === y)) {
        actor.x = x;
        actor.y = y;
        actor.moved = true;
        applyCombatTileEffects(actor);
        combat.log.unshift(`${actor.name} moves.`);
        setCombatMode('idle');
      }
      return;
    }
    if (combat.mode === 'basic') {
      if (target && target.side === 'enemy' && combat.highlights.some(p => p.x === x && p.y === y)) {
        resolveHeroAttack(actor, target, false);
      }
      return;
    }
    if (combat.mode === 'special') {
      if (actor.special.heal) {
        if (target && target.side === 'party' && combat.highlights.some(p => p.x === x && p.y === y)) {
          const heal = rollDamage(actor.special.heal);
          target.hp = Math.min(target.maxHp, target.hp + heal);
          combat.log.unshift(`${actor.name} uses ${actor.special.name} on ${target.name} for ${heal}.`);
          actor.acted = true;
          finishHeroAction();
        }
      } else if (target && target.side === 'enemy' && combat.highlights.some(p => p.x === x && p.y === y)) {
        resolveHeroAttack(actor, target, true);
      }
    }
  }

  function resolveHeroAttack(actor, target, special) {
    const attackName = special ? actor.special.name : actor.basic.name;
    const bonus = actor.attackBonus;
    const roll = randInt(1, 20) + bonus;
    const dc = target.ac;
    if (roll >= dc) {
      const damage = rollDamage(special ? actor.special.damage : actor.basic.damage);
      damageActor(target, damage, `${actor.name} hits ${target.name} with ${attackName} for ${damage}.`);
      if (special && actor.special.effect === 'stun' && !target.downed) target.statuses.push('stun');
      if (special && actor.special.effect === 'bleed' && !target.downed) target.statuses.push('bleed');
      if (special && actor.special.splash && !target.downed) {
        adjacentEnemies(target).forEach(e => damageActor(e, actor.special.splash, `${target.name} is caught by arcane splash.`));
      }
    } else {
      state.combat.log.unshift(`${actor.name} misses ${target.name} with ${attackName}.`);
    }
    actor.acted = true;
    finishHeroAction();
  }

  function adjacentEnemies(target) {
    return state.combat.actors.filter(a => a.side === 'enemy' && !a.downed && Math.abs(a.x - target.x) + Math.abs(a.y - target.y) === 1);
  }

  function damageActor(target, amount, logText) {
    target.hp -= amount;
    if (target.hp <= 0) {
      target.hp = 0;
      target.downed = true;
      state.combat.log.unshift(`${target.name} falls.`);
    }
    if (logText) state.combat.log.unshift(logText);
  }

  function damageActorRecord(target, amount) {
    target.hp -= amount;
    if (target.hp <= 0) {
      target.hp = 0;
      target.downed = true;
    }
  }

  function applyCombatTileEffects(actor) {
    const tile = state.combat.board[actor.y][actor.x];
    if (tile === '^') damageActor(actor, 1, `${actor.name} takes 1 damage from rough hazard.`);
  }

  function finishHeroAction() {
    syncCombatPartyBack();
    checkCombatEnd();
    if (state.mode !== 'combat') return;
    setCombatMode('idle');
    renderAll();
  }

  function endHeroTurn() {
    syncCombatPartyBack();
    state.combat.turnIndex += 1;
    checkCombatEnd();
    if (state.mode !== 'combat') return;
    refreshCombatTurn();
    renderAll();
  }

  function enemyTurn(actor) {
    if (actor.statuses.includes('stun')) {
      actor.statuses = actor.statuses.filter(s => s !== 'stun');
      state.combat.log.unshift(`${actor.name} is stunned and loses the turn.`);
      state.combat.turnIndex += 1;
      refreshCombatTurn();
      renderAll();
      return;
    }
    const target = nearestPartyActor(actor);
    if (!target) {
      finishCombat(true);
      return;
    }
    const dist = Math.abs(actor.x - target.x) + Math.abs(actor.y - target.y);
    const range = actor.range || 1;
    if (dist > range) moveEnemyToward(actor, target);
    const newTarget = nearestPartyActor(actor);
    if (!newTarget) return;
    const newDist = Math.abs(actor.x - newTarget.x) + Math.abs(actor.y - newTarget.y);
    if (newDist <= range) {
      const roll = randInt(1, 20) + actor.attackBonus;
      if (roll >= newTarget.ac) {
        const damage = rollDamage(actor.damage);
        damageActor(newTarget, damage, `${actor.name} hits ${newTarget.name} for ${damage}.`);
      } else {
        state.combat.log.unshift(`${actor.name} misses ${newTarget.name}.`);
      }
    }
    if (actor.statuses.includes('bleed')) damageActor(actor, 1, `${actor.name} bleeds for 1.`);
    syncCombatPartyBack();
    state.combat.turnIndex += 1;
    checkCombatEnd();
    if (state.mode !== 'combat') return;
    refreshCombatTurn();
    renderAll();
  }

  function nearestPartyActor(actor) {
    const living = state.combat.actors.filter(a => a.side === 'party' && !a.downed && a.hp > 0);
    if (!living.length) return null;
    return living.sort((a, b) => (Math.abs(actor.x - a.x) + Math.abs(actor.y - a.y)) - (Math.abs(actor.x - b.x) + Math.abs(actor.y - b.y)))[0];
  }

  function moveEnemyToward(actor, target) {
    const options = [
      { x: actor.x + 1, y: actor.y }, { x: actor.x - 1, y: actor.y },
      { x: actor.x, y: actor.y + 1 }, { x: actor.x, y: actor.y - 1 }
    ].filter(p => inCombatBounds(p.x, p.y) && passableCombatTile(p.x, p.y) && !actorAt(p.x, p.y));
    if (!options.length) return;
    options.sort((a, b) => (Math.abs(a.x - target.x) + Math.abs(a.y - target.y)) - (Math.abs(b.x - target.x) + Math.abs(b.y - target.y)));
    actor.x = options[0].x;
    actor.y = options[0].y;
    applyCombatTileEffects(actor);
  }

  function syncCombatPartyBack() {
    state.party.forEach(p => {
      const actor = state.combat.actors.find(a => a.id === p.id);
      if (!actor) return;
      p.hp = Math.max(0, actor.hp);
      p.statuses = clone(actor.statuses || []);
      p.downed = actor.downed || p.hp <= 0;
    });
  }

  function checkCombatEnd() {
    const partyAlive = state.party.some(p => !p.downed && p.hp > 0);
    const enemiesAlive = state.combat.actors.some(a => a.side === 'enemy' && !a.downed && a.hp > 0);
    if (!partyAlive) {
      finishCombat(false);
      return true;
    }
    if (!enemiesAlive) {
      finishCombat(true);
      return true;
    }
    return false;
  }

  function finishCombat(victory) {
    const payload = state.combat.payload;
    if (victory) {
      addLog(`The party survives the clash at ${payload.encounterId.replace(/_/g, ' ')}.`);
      resolveEncounterRewards(payload);
    } else {
      addLog('The party is beaten back and limps away from the fight.');
      state.renown = Math.max(0, state.renown - 1);
    }
    state.combat = null;
    if (payload.returnMode === 'town') setMode('town'); else setMode('world');
    renderAll();
  }

  function resolveEncounterRewards(payload) {
    const rewardGold = randInt(3, 7);
    state.gold += rewardGold;
    if (randInt(1, 100) <= 35) { giveItem('silverLeaf', 1); note('A useful trade good turns up in the aftermath.'); }
    if (payload.encounterId === 'cellar_cult') {
      state.quests.cellar_cult.status = 'completed';
      state.renown += 2;
      state.factions.wardens += 1;
      state.factions.veil -= 1;
      note('The cult beneath the Lantern Cup is broken. Bram and Morrow will remember it.');
    }
    if (payload.encounterId === 'lost_ledger') {
      if (!state.inventory.ledger) giveItem('ledger', 1);
      state.quests.lost_ledger.step = 3;
      note('The Lantern Ledger was being used to track Veil payments through Gloam Ferry.');
      state.world.clearedSites.ashen_ruin = true;
    }
    if (payload.encounterId === 'beacon_watch') {
      state.world.clearedSites.lantern_tower = true;
      state.inventory.beaconOil = Math.max(0, (state.inventory.beaconOil || 0) - 1);
      state.quests.beacon_watch.status = 'completed';
      state.renown += 2;
      state.factions.wardens += 2;
      note('The Lantern Tower burns again. Roads feel shorter when people can see each other.');
    }
    if (payload.encounterId === 'road_ambush') {
      state.renown += 1;
    }
  }

  function saveGame() {
    localStorage.setItem(C.saveKey, JSON.stringify(state));
    flash('Campaign saved.');
  }

  function loadGame() {
    const raw = localStorage.getItem(C.saveKey);
    if (!raw) { flash('No saved campaign found.'); return; }
    try {
      const loaded = JSON.parse(raw);
      state = loaded;
      setMode(state.mode || 'world');
      addLog('The road opens where you left it.');
      renderAll();
    } catch (err) {
      console.error(err);
      flash('Could not load the campaign.');
    }
  }

  function newGame() {
    state = defaultState();
    revealAround(state.world.q, state.world.r);
    setMode('world');
    renderAll();
  }

  function bindEvents() {
    dom.worldCanvas.addEventListener('click', onWorldCanvasClick);
    dom.newBtn.addEventListener('click', () => {
      state.modal = {
        title: 'New Campaign',
        body: '<p>Start a fresh journey through the Grey March?</p>',
        choices: [
          { label: 'Start fresh', action: newGame, variant: 'good' },
          { label: 'Cancel', action: () => {} }
        ]
      };
      renderModal();
    });
    dom.saveBtn.addEventListener('click', saveGame);
    dom.loadBtn.addEventListener('click', loadGame);
    dom.townExitBtn.addEventListener('click', leaveTown);
    dom.townMovePad.querySelectorAll('button[data-dir]').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.dataset.dir;
        const map = { n:[0,-1], s:[0,1], e:[1,0], w:[-1,0] };
        dom.townMovePad?.querySelectorAll('button[data-dir]').forEach(btn => {
  btn.addEventListener('click', () => {
    const dir = btn.dataset.dir;
    const map = {
      n: [0, -1],
      s: [0, 1],
      e: [1, 0],
      w: [-1, 0]
    };

    const step = map[dir];
    if (!step) return;

    moveTown(step[0], step[1]);
  });
});
      });
    });
    window.addEventListener('keydown', (ev) => {
      if (state.mode === 'town') {
        if (ev.key === 'ArrowUp') moveTown(0, -1);
        if (ev.key === 'ArrowDown') moveTown(0, 1);
        if (ev.key === 'ArrowLeft') moveTown(-1, 0);
        if (ev.key === 'ArrowRight') moveTown(1, 0);
      }
    });
    window.addEventListener('resize', () => state && renderAll());
  }

  function init() {
    bindEvents();
    if ('serviceWorker' in navigator) { navigator.serviceWorker.register('./sw.js').catch(() => {}); }
    newGame();
  }

  init();
})();
