import React from 'react';
import { towns } from '../data/maps';
import { ZoomLevel } from '../state/gameState';

export default function TownMap({ gameState, onExitTown, onEnterEncounter }) {
  const state = gameState.getState();
  const town = towns.find(t => t.id === state.currentTownId);
  if (!town) return <div>Town not found</div>;

  function handleEncounter() {
    onEnterEncounter(1); // For demo, enter first encounter
  }

  return (
    <div>
      <h3>Town Map: {town.name}</h3>
      <pre>{town.map.join('\n')}</pre>
      <button onClick={handleEncounter}>Start Encounter</button>
      <button onClick={onExitTown}>Exit Town</button>
    </div>
  );
}
