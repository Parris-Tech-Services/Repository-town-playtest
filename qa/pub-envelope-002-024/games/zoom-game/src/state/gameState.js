// Game state management for zoom levels

export const ZoomLevel = {
  WORLD: 'world',
  TOWN: 'town',
  ENCOUNTER: 'encounter'
};

const initialState = {
  currentZoom: ZoomLevel.WORLD,
  currentPosition: { x: 0, y: 0 },
  currentTownId: null,
  currentEncounterId: null
};

export function createGameState() {
  let state = { ...initialState };

  function zoomTo(level) {
    state.currentZoom = level;
  }

  function moveTo(position) {
    state.currentPosition = position;
  }

  function enterTown(townId) {
    state.currentZoom = ZoomLevel.TOWN;
    state.currentTownId = townId;
  }

  function enterEncounter(encounterId) {
    state.currentZoom = ZoomLevel.ENCOUNTER;
    state.currentEncounterId = encounterId;
  }

  function exitEncounter() {
    state.currentZoom = ZoomLevel.TOWN;
    state.currentEncounterId = null;
  }

  function exitTown() {
    state.currentZoom = ZoomLevel.WORLD;
    state.currentTownId = null;
  }

  function getState() {
    return { ...state };
  }

  return {
    zoomTo,
    moveTo,
    enterTown,
    enterEncounter,
    exitEncounter,
    exitTown,
    getState
  };
}
