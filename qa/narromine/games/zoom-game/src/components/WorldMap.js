import React, { useState } from 'react';
import { worldMap, towns } from '../data/maps';
import { ZoomLevel } from '../state/gameState';

export default function WorldMap({ gameState, onEnterTown }) {
  // Simplified rendering of a large map
  const [position, setPosition] = useState(gameState.getState().currentPosition);

  function handleMove(dx, dy) {
    const newPos = { x: position.x + dx, y: position.y + dy };
    setPosition(newPos);
    gameState.moveTo(newPos);
  }

  function checkNearbyTown() {
    // Check for towns near current position
    for (let town of towns) {
      const dist = Math.hypot(town.position.x - position.x, town.position.y - position.y);
      if (dist < 20) { // threshold
        onEnterTown(town.id);
        break;
      }
    }
  }

  return (
    <div>
      <h3>World Map (Simplified)</h3>
      <div>Position: ({position.x}, {position.y})</div>
      <button onClick={() => {handleMove(0,1); checkNearbyTown();}}>Move Down</button>
      <button onClick={() => {handleMove(0,-1); checkNearbyTown();}}>Move Up</button>
      <button onClick={() => {handleMove(-1,0); checkNearbyTown();}}>Move Left</button>
      <button onClick={() => {handleMove(1,0); checkNearbyTown();}}>Move Right</button>
      <div>Towns nearby:
        <ul>
          {towns.filter(t => Math.hypot(t.position.x - position.x, t.position.y - position.y) < 50).map(t => (
            <li key={t.id}>{t.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
