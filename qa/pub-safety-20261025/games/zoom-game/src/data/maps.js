// Core map data structures

export const worldMap = {
  size: 1000, // size in hexes or units
  tiles: [], // map tiles, terrain, features
};

export const towns = [
  {
    id: 1,
    name: "Sanctum",
    position: { x: 100, y: 150 },
    map: [
      "+-----------+",
      "| ? ? ? ? ? |",
      "| ? @ ? ? ? |",
      "| ? ? ? ? ? |",
      "+-----------+"
    ]
  },
  // more towns here
];

export const encounters = [
  {
    id: 1,
    name: "Goblin Ambush",
    description: "A group of goblins attack from the trees.",
    sceneData: {
      // encounter-specific data
    }
  }
  // more encounters
];
