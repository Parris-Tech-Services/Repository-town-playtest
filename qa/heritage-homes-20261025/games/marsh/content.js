window.CONTENT = {
  title: 'Grey March: Lanterns of Sanctum',
  version: '0.1.0',
  worldName: 'The Grey March',
  saveKey: 'grey-march-combined-save-v1',
  renownGoal: 10,
  timeLimitDays: 14,
  factions: {
    wardens: { id: 'wardens', name: 'Wardens of the Green March', color: '#81b875' },
    gilt: { id: 'gilt', name: 'Gilt Caravan Guild', color: '#d9b260' },
    veil: { id: 'veil', name: 'Ashen Veil', color: '#9d7adb' }
  },
  terrainDefs: {
    plains: { name: 'Plains', color: '#cdbf87', move: 1, risk: 0.12 },
    road: { name: 'Road', color: '#bea373', move: 1, risk: 0.06 },
    forest: { name: 'Forest', color: '#5f7f4d', move: 2, risk: 0.2 },
    hills: { name: 'Hills', color: '#90704f', move: 2, risk: 0.16 },
    swamp: { name: 'Swamp', color: '#57604a', move: 3, risk: 0.24 },
    ruins: { name: 'Ruins', color: '#7a6d63', move: 2, risk: 0.18 },
    river: { name: 'Ford', color: '#678ca8', move: 2, risk: 0.14 }
  },
  items: {
    ration: { id: 'ration', name: 'Ration', type: 'supply', value: 1 },
    tonic: { id: 'tonic', name: 'Field Tonic', type: 'consumable', value: 6, heal: 5 },
    charm: { id: 'charm', name: 'Roadside Charm', type: 'quest', value: 8 },
    ledger: { id: 'ledger', name: 'Lantern Ledger', type: 'quest', value: 0 },
    beaconOil: { id: 'beaconOil', name: 'Beacon Oil', type: 'quest', value: 0 },
    ferryKey: { id: 'ferryKey', name: 'Ferry Cache Key', type: 'quest', value: 0 },
    ashRelic: { id: 'ashRelic', name: 'Ash Relic', type: 'quest', value: 0 },
    silverLeaf: { id: 'silverLeaf', name: 'Silver Leaf', type: 'trade', value: 5 },
    blackSalt: { id: 'blackSalt', name: 'Black Salt', type: 'trade', value: 4 },
    lanternGlass: { id: 'lanternGlass', name: 'Lantern Glass', type: 'trade', value: 7 },
    shrineBell: { id: 'shrineBell', name: 'Shrine Bell Clapper', type: 'quest', value: 0 },
    guildSeal: { id: 'guildSeal', name: 'Guild Seal', type: 'quest', value: 0 },
    satchel: { id: 'satchel', name: 'Courier Satchel', type: 'quest', value: 0 }
  },
  partyArchetypes: {
    fighter: {
      id: 'fighter', name: 'Mara Thorn', role: 'Fighter', color: '#cf7e5a',
      maxHp: 34, ac: 17, init: 1, speed: 4, attackBonus: 6,
      basic: { name: 'Slash', range: 1, damage: [1, 8, 3] },
      special: { name: 'Shield Bash', range: 1, damage: [1, 6, 2], effect: 'stun', desc: 'Deal damage and stun for 1 round.' }
    },
    rogue: {
      id: 'rogue', name: 'Kest Vane', role: 'Rogue', color: '#67a7d9',
      maxHp: 26, ac: 15, init: 4, speed: 5, attackBonus: 7,
      basic: { name: 'Throw Knife', range: 4, damage: [1, 6, 4] },
      special: { name: 'Backstab', range: 1, damage: [2, 6, 3], effect: 'bleed', desc: 'Heavy melee strike that causes bleed.' }
    },
    cleric: {
      id: 'cleric', name: 'Sister Hale', role: 'Cleric', color: '#b8c97b',
      maxHp: 28, ac: 16, init: 0, speed: 4, attackBonus: 5,
      basic: { name: 'Radiant Bolt', range: 4, damage: [1, 8, 3] },
      special: { name: 'Healing Word', range: 4, heal: [1, 6, 4], desc: 'Restore health to an ally.' }
    },
    wizard: {
      id: 'wizard', name: 'Ivo Glass', role: 'Wizard', color: '#b497e8',
      maxHp: 22, ac: 13, init: 2, speed: 4, attackBonus: 6,
      basic: { name: 'Fire Bolt', range: 5, damage: [1, 10, 3] },
      special: { name: 'Arc Burst', range: 3, damage: [1, 8, 2], splash: 1, desc: 'Damage target and nearby foes.' }
    }
  },
  enemies: {
    raider: { id: 'raider', name: 'Road Raider', maxHp: 16, ac: 13, init: 1, speed: 4, attackBonus: 4, damage: [1, 6, 2], ai: 'rush', glyph: 'r' },
    hound: { id: 'hound', name: 'Ash Hound', maxHp: 12, ac: 12, init: 3, speed: 5, attackBonus: 4, damage: [1, 6, 1], ai: 'flank', glyph: 'h' },
    acolyte: { id: 'acolyte', name: 'Veil Acolyte', maxHp: 14, ac: 12, init: 2, speed: 4, attackBonus: 4, damage: [1, 8, 1], ai: 'ranged', glyph: 'a', range: 4 },
    bruiser: { id: 'bruiser', name: 'Guild Bruiser', maxHp: 20, ac: 14, init: 0, speed: 3, attackBonus: 5, damage: [1, 8, 2], ai: 'rush', glyph: 'b' },
    cantor: { id: 'cantor', name: 'Ash Cantor', maxHp: 24, ac: 14, init: 2, speed: 4, attackBonus: 6, damage: [1, 10, 2], ai: 'ranged', glyph: 'c', range: 5 }
  },
  encounterMaps: {
    cellar: {
      w: 8, h: 8,
      rows: [
        '........',
        '..##....',
        '..##.^..',
        '........',
        '.^....#.',
        '...#....',
        '........',
        '........'
      ]
    },
    road: {
      w: 8, h: 8,
      rows: [
        '........',
        '...#....',
        '..^.....',
        '........',
        '.....#..',
        '........',
        '..#.....',
        '........'
      ]
    },
    tower: {
      w: 8, h: 8,
      rows: [
        '....#...',
        '..##.#..',
        '...^....',
        '.#......',
        '......#.',
        '...^....',
        '..#.....',
        '........'
      ]
    },
    shrine: {
      w: 8, h: 8,
      rows: [
        '........',
        '...^....',
        '..#.#...',
        '........',
        '...#....',
        '........',
        '.^......',
        '........'
      ]
    }
  },
  region: {
    width: 8,
    height: 7,
    start: { q: 1, r: 4 },
    tiles: [
      'hhhpffhh',
      'hfpprfhh',
      'fppprprh',
      'fprrppph',
      'prrppfrh',
      'pprpprrh',
      'hhpprshh'
    ]
  },
  settlements: [
    { id: 'hearthwick', name: 'Hearthwick', q: 1, r: 4, kind: 'village', desc: 'A warm road village of smoke, hens, and low stone walls.' },
    { id: 'sanctum', name: 'Sanctum', q: 4, r: 3, kind: 'town', desc: 'A lamp-lit town built around an old archive and a guarded square.' },
    { id: 'gloamferry', name: 'Gloam Ferry', q: 5, r: 5, kind: 'river-port', desc: 'A sullen ferry stop of wet wood, rope, and whispered bargains.' },
    { id: 'brindlewatch', name: 'Brindlewatch', q: 3, r: 1, kind: 'watchtown', desc: 'A hill watch with a half-kept beacon and soldiers short on sleep.' }
  ],
  sites: [
    { id: 'old_bell_shrine', name: 'Old Bell Shrine', q: 2, r: 5, kind: 'shrine', desc: 'A weathered roadside shrine with a silenced bell.' },
    { id: 'lantern_tower', name: 'Lantern Tower', q: 6, r: 2, kind: 'tower', desc: 'A lonely tower used to signal caravans through the mist.' },
    { id: 'ashen_ruin', name: 'Ashen Ruin', q: 6, r: 4, kind: 'ruin', desc: 'Blackened stones where the Veil keeps returning.' },
    { id: 'reed_ford', name: 'Reed Ford', q: 4, r: 6, kind: 'ford', desc: 'A cold crossing marked by split reeds and broken cart tracks.' }
  ],
  towns: {
    hearthwick: {
      id: 'hearthwick', width: 17, height: 11, start: { x: 2, y: 5 },
      rows: [
        '#################',
        '#..G....=....S..#',
        '#.......=.......#',
        '#..T....=....M..#',
        '#.......=.......#',
        '#=======+=======#',
        '#.......=.......#',
        '#..H....=....P..#',
        '#.......=.......#',
        '#...............#',
        '#################'
      ],
      legends: {
        G: { name: 'Gate', type: 'exit' },
        T: { name: 'Crooked Lantern Inn', type: 'building', scene: 'hearthwick_inn' },
        S: { name: 'Roadside Shrine', type: 'building', scene: 'hearthwick_shrine' },
        M: { name: 'Mud Market', type: 'building', scene: 'hearthwick_market' },
        H: { name: 'Mayor\'s Hall', type: 'building', scene: 'hearthwick_hall' },
        P: { name: 'Pig Yard', type: 'building', scene: 'hearthwick_yard' }
      },
      npcs: [
        { id: 'rowan_pike', x: 4, y: 7, glyph: 'R' },
        { id: 'tessa_reed', x: 3, y: 3, glyph: 'T' },
        { id: 'sister_elira', x: 14, y: 1, glyph: 'E' }
      ]
    },
    sanctum: {
      id: 'sanctum', width: 19, height: 13, start: { x: 2, y: 6 },
      rows: [
        '###################',
        '#..G.....=...A....#',
        '#........=........#',
        '#..T.....=....M...#',
        '#........=........#',
        '#========+========#',
        '#........=........#',
        '#..C.....=....L...#',
        '#........=........#',
        '#..W.....=....S...#',
        '#........=........#',
        '#.................#',
        '###################'
      ],
      legends: {
        G: { name: 'North Gate', type: 'exit' },
        T: { name: 'Lantern Cup Tavern', type: 'building', scene: 'sanctum_tavern' },
        A: { name: 'Archive Annex', type: 'building', scene: 'sanctum_archive' },
        M: { name: 'Guild Exchange', type: 'building', scene: 'sanctum_exchange' },
        C: { name: 'Chapel Court', type: 'building', scene: 'sanctum_chapel' },
        L: { name: 'Lamp House', type: 'building', scene: 'sanctum_lamp' },
        W: { name: 'West Watch', type: 'building', scene: 'sanctum_watch' },
        S: { name: 'South Steps', type: 'exit' }
      },
      npcs: [
        { id: 'yselle_quill', x: 14, y: 1, glyph: 'Y' },
        { id: 'captain_bram', x: 3, y: 9, glyph: 'B' },
        { id: 'nyra_voss', x: 15, y: 3, glyph: 'N' },
        { id: 'innkeep_morrow', x: 3, y: 3, glyph: 'M' }
      ]
    },
    gloamferry: {
      id: 'gloamferry', width: 17, height: 11, start: { x: 2, y: 5 },
      rows: [
        '#################',
        '#..G....=....D..#',
        '#.......=.......#',
        '#..T....=....W..#',
        '#.......=.......#',
        '#=======+=======#',
        '#.......=.......#',
        '#..F....=....S..#',
        '#.......=.......#',
        '#~~~~~~~~~~~~~~~#',
        '#################'
      ],
      legends: {
        G: { name: 'Road Gate', type: 'exit' },
        D: { name: 'Dock Office', type: 'building', scene: 'gloam_dock' },
        T: { name: 'Wet Rope Tavern', type: 'building', scene: 'gloam_tavern' },
        W: { name: 'Warehouse', type: 'building', scene: 'gloam_warehouse' },
        F: { name: 'Ferry Slip', type: 'building', scene: 'gloam_ferry' },
        S: { name: 'South Mooring', type: 'exit' }
      },
      npcs: [
        { id: 'corven_reed', x: 3, y: 7, glyph: 'C' },
        { id: 'dockmaster_ira', x: 13, y: 1, glyph: 'I' },
        { id: 'veska_dane', x: 13, y: 7, glyph: 'V' }
      ]
    },
    brindlewatch: {
      id: 'brindlewatch', width: 17, height: 11, start: { x: 2, y: 5 },
      rows: [
        '#################',
        '#..G....=....B..#',
        '#.......=.......#',
        '#..T....=....A..#',
        '#.......=.......#',
        '#=======+=======#',
        '#.......=.......#',
        '#..Y....=....S..#',
        '#.......=.......#',
        '#...............#',
        '#################'
      ],
      legends: {
        G: { name: 'Gate', type: 'exit' },
        B: { name: 'Beacon Stairs', type: 'building', scene: 'brindle_beacon' },
        T: { name: 'Watch Mess', type: 'building', scene: 'brindle_mess' },
        A: { name: 'Armoury', type: 'building', scene: 'brindle_armoury' },
        Y: { name: 'Yard', type: 'building', scene: 'brindle_yard' },
        S: { name: 'South Slope', type: 'exit' }
      },
      npcs: [
        { id: 'serah_cole', x: 13, y: 1, glyph: 'S' },
        { id: 'quartermaster_olin', x: 13, y: 3, glyph: 'O' },
        { id: 'scout_fera', x: 3, y: 7, glyph: 'F' }
      ]
    }
  },
  npcs: {
    rowan_pike: { id: 'rowan_pike', name: 'Rowan Pike', town: 'hearthwick', role: 'Mayor', faction: 'wardens' },
    tessa_reed: { id: 'tessa_reed', name: 'Tessa Reed', town: 'hearthwick', role: 'Innkeeper', faction: 'gilt' },
    sister_elira: { id: 'sister_elira', name: 'Sister Elira', town: 'hearthwick', role: 'Road Priest', faction: 'wardens' },
    yselle_quill: { id: 'yselle_quill', name: 'Yselle Quill', town: 'sanctum', role: 'Archivist', faction: 'wardens' },
    captain_bram: { id: 'captain_bram', name: 'Captain Bram Kestrel', town: 'sanctum', role: 'Guard Captain', faction: 'wardens' },
    nyra_voss: { id: 'nyra_voss', name: 'Nyra Voss', town: 'sanctum', role: 'Guild Factor', faction: 'gilt' },
    innkeep_morrow: { id: 'innkeep_morrow', name: 'Morrow Fen', town: 'sanctum', role: 'Tavern Keeper', faction: 'gilt' },
    corven_reed: { id: 'corven_reed', name: 'Corven Reed', town: 'gloamferry', role: 'Ferryman', faction: 'gilt' },
    dockmaster_ira: { id: 'dockmaster_ira', name: 'Ira Pell', town: 'gloamferry', role: 'Dockmaster', faction: 'gilt' },
    veska_dane: { id: 'veska_dane', name: 'Veska Dane', town: 'gloamferry', role: 'Smuggler', faction: 'veil' },
    serah_cole: { id: 'serah_cole', name: 'Serah Cole', town: 'brindlewatch', role: 'Beacon Warden', faction: 'wardens' },
    quartermaster_olin: { id: 'quartermaster_olin', name: 'Quartermaster Olin', town: 'brindlewatch', role: 'Quartermaster', faction: 'gilt' },
    scout_fera: { id: 'scout_fera', name: 'Fera Lark', town: 'brindlewatch', role: 'Scout', faction: 'wardens' }
  },
  quests: {
    cellar_cult: {
      id: 'cellar_cult', name: 'Ash Beneath the Cup', giver: 'innkeep_morrow',
      summary: 'Something under Sanctum\'s tavern keeps drawing cloaked visitors at dusk.',
      reward: { gold: 12, renown: 2, faction: { wardens: 1, veil: -1 } }
    },
    lost_ledger: {
      id: 'lost_ledger', name: 'The Missing Lantern Ledger', giver: 'yselle_quill',
      summary: 'Recover the ledger taken from Sanctum\'s archive before the Guild buries the trail.',
      reward: { gold: 10, renown: 2, faction: { wardens: 1, gilt: -1 } }
    },
    beacon_watch: {
      id: 'beacon_watch', name: 'The Sleeping Beacon', giver: 'serah_cole',
      summary: 'Carry oil and clear the Lantern Tower so the March can signal again.',
      reward: { gold: 9, renown: 2, faction: { wardens: 2 } }
    },
    ferry_cache: {
      id: 'ferry_cache', name: 'Keys in the Mud', giver: 'corven_reed',
      summary: 'Find the stolen key and settle who really owns the cache at Gloam Ferry.',
      reward: { gold: 8, renown: 2, faction: { gilt: 1 } }
    },
    bell_shrine: {
      id: 'bell_shrine', name: 'A Bell for the Road', giver: 'sister_elira',
      summary: 'Recover the missing shrine bell clapper from the Old Bell Shrine and decide where it belongs.',
      reward: { gold: 6, renown: 1, faction: { wardens: 1 } }
    }
  },
  rumours: [
    'Tessa swears Sanctum\'s tavern has more visitors after midnight than before sunset.',
    'The beacon above Brindlewatch has been dark too long, and raiders know it.',
    'A ferryman lost a key, but the key may have belonged to smugglers first.',
    'Someone from the Archive keeps buying black salt and pretending it\'s for cleaning.',
    'The old bell shrine still rings in dreams, even without its clapper.'
  ]
};
