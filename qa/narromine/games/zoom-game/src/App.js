import React, { useState } from 'react';
import './App.css';

// Import layer components
import RegionLayer from './components/RegionLayer';
import DetailLayer from './components/DetailLayer';

// Layer states
const ZOOM_LEVELS = {
  WORLD: 'world',
  REGION: 'region',
  DETAIL: 'detail',
};

export default function App() {
  const [zoomLevel, setZoomLevel] = useState(ZOOM_LEVELS.WORLD);
  const [region, setRegion] = useState(null);
  const [sceneState, setSceneState] = useState({ itemFound: false });

  function handleRegionSelect(regionId) {
    setRegion(regionId);
    setZoomLevel(ZOOM_LEVELS.REGION);
  }

  function handleBackToWorld() {
    setZoomLevel(ZOOM_LEVELS.WORLD);
  }

  function handleBackToRegion() {
    setZoomLevel(ZOOM_LEVELS.REGION);
  }

  function handleZoomToDetail() {
    setZoomLevel(ZOOM_LEVELS.DETAIL);
  }

  function handleItemDiscovery() {
    setSceneState({ itemFound: true });
  }

  return (
    <div className="App">
      <h1>Multi-Layer Zoom Game</h1>
      <div className="layer-indicator">Current Layer: {zoomLevel}</div>
      <div className="breadcrumbs">Home &gt; {zoomLevel}</div>
      {zoomLevel === ZOOM_LEVELS.WORLD && (
        <div>
          <h2>World Map</h2>
          {/* Example regions */}
          <button onClick={() => handleRegionSelect(1)}>Forest Region</button>
          <button onClick={() => handleRegionSelect(2)}>Mountain Region</button>
        </div>
      )}
      {zoomLevel === ZOOM_LEVELS.REGION && (
        <RegionLayer regionId={region} onZoomOut={handleBackToWorld} onSelectScene={handleZoomToDetail} />
      )}
      {zoomLevel === ZOOM_LEVELS.DETAIL && (
        <DetailLayer onZoomOut={handleBackToRegion} sceneState={sceneState} onDiscover={handleItemDiscovery} />
      )}
    </div>
  );
}

import { createRoot } from 'react-dom/client';
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
