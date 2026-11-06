import React from 'react';
import './LayerStyles.css';

export default function RegionLayer({ regionId, onZoomOut, onSelectScene }) {
  const regionsData = {
    1: { name: 'Forest Region', locations: ['Oak Grove', 'Pine Ridge', 'Maple Swamp'] },
    2: { name: 'Mountain Region', locations: ['Frost Peak', 'Stone Pass', 'Eagle’s Nest'] },
  };
  const region = regionsData[regionId];

  return (
    <div className="layer region-layer">
      <h2>Region: {region.name}</h2>
      <button onClick={onZoomOut}>Zoom out to World</button>
      <div className="locations">
        {region.locations.map((loc, index) => (
          <div key={index} className="location-node" onClick={onSelectScene}>
            {loc}
          </div>
        ))}
      </div>
    </div>
  );
}
