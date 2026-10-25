import React from 'react';
import { encounters } from '../data/maps';

export default function Encounter({ gameState, onExitEncounter }) {
  const state = gameState.getState();
  const encounter = encounters.find(e => e.id === state.currentEncounterId);
  if (!encounter) return <div>Encounter not found</div>;

  return (
    <div>
      <h3>Encounter: {encounter.name}</h3>
      <p>{encounter.description}</p>
      <button onClick={onExitEncounter}>End Encounter</button>
    </div>
  );
}
