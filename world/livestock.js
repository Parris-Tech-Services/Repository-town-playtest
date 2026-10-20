const HERDS = Object.freeze({
  sheep: { species: 'sheep', count: 12, feed: 'hay', dailyRation: 3 },
  dairy: { species: 'cattle', count: 7, feed: 'hay', dailyRation: 4 },
  coop: { species: 'chicken', count: 16, feed: 'grain', dailyRation: 2 },
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function initialiseLivestock(life) {
  const herds = {};
  for (const [site, spec] of Object.entries(HERDS)) {
    herds[site] = {
      species: spec.species,
      feed: spec.feed,
      dailyRation: spec.dailyRation,
      animals: Array.from({ length: spec.count }, (_, id) => ({
        id: `${site}-${id + 1}`,
        ageYears: 1 + (id % 6),
        health: 100,
        condition: 75 + (id % 4) * 5,
      })),
    };
  }
  life.civic.livestock = { herds };
}

export function advanceLivestockDay(life) {
  const herds = life.civic.livestock?.herds || {};
  const waterShortage = (life.yesterday?.waterCutHours || 0) >= 6;
  for (const [site, herd] of Object.entries(herds)) {
    const farm = life.place(site);
    const supplied = Math.min(herd.dailyRation, Math.max(0, farm.stock[herd.feed] || 0));
    farm.stock[herd.feed] = Math.max(0, (farm.stock[herd.feed] || 0) - supplied);
    const ration = supplied / herd.dailyRation;
    for (const animal of herd.animals) {
      const oldHealth = animal.health;
      const feedChange = ration >= 1 ? 2 : -Math.ceil((1 - ration) * 10);
      animal.condition = clamp(animal.condition + (ration >= 1 ? 2 : -Math.ceil((1 - ration) * 8)), 0, 100);
      animal.health = clamp(animal.health + feedChange - (waterShortage ? 8 : 0), 0, 100);
      if (oldHealth >= 60 && animal.health < 60) {
        life.log(`Animal welfare concern at the ${farm.name}: ${animal.id} is unwell. Check feed, water and veterinary support.`);
      }
    }
  }
}

export function productiveHerdFraction(life, site) {
  const animals = life.civic.livestock?.herds?.[site]?.animals;
  if (!animals?.length) return 1;
  return animals.filter((animal) => animal.health >= 50 && animal.condition >= 30).length / animals.length;
}

export function herdReport(life, site) {
  const herd = life.civic.livestock?.herds?.[site];
  if (!herd) return null;
  const farm = life.place(site);
  const healthy = herd.animals.filter((animal) => animal.health >= 50 && animal.condition >= 30).length;
  return {
    species: herd.species,
    count: herd.animals.length,
    healthy,
    health: Math.round(herd.animals.reduce((sum, animal) => sum + animal.health, 0) / herd.animals.length),
    condition: Math.round(herd.animals.reduce((sum, animal) => sum + animal.condition, 0) / herd.animals.length),
    feed: herd.feed,
    feedStock: farm.stock[herd.feed] || 0,
  };
}
