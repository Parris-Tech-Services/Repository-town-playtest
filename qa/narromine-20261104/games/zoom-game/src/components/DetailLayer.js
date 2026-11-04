import React from 'react';
import './LayerStyles.css';

export default function DetailLayer({ onZoomOut, sceneState, onDiscover }) {
  return (
    <div className="layer detail-layer">
      <h2>Scene Details</h2>
      <button onClick={onZoomOut}>Zoom out to Region</button>
      <div className="scene-area">
        <div className="scene-placeholder">
          {sceneState.itemFound ? 'Item Collected!' : 'A mysterious artifact'}
        </div>
      </div>
      {!sceneState.itemFound && (
        <button onClick={onDiscover}>Discover Item</button>
      )}
    </div>
  );
}
