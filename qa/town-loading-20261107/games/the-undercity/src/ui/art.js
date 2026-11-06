// Decorative artwork only; no save or gameplay state access.
(() => {
 const scenes = {"The Bell-Cage": "chamber", "Lantern Court": "undercity-hero", "The Inkward": "archive", "Brinehook Quays": "waterway", "The Sootworks": "foundry", "The Moss Choir": "garden", "The Glass Arcade": "market", "The Forgotten Stairs": "chamber", "The Listening Edge": "undercity-hero", "The Office of Second Chances": "chamber", "The Quiet Ward": "chamber", "The Unspoken Tribunal": "archive", "The Watch House": "chamber", "The Tribunal": "archive", "The Ward": "chamber", "The Pale Rooms": "chamber"};
 function addArt(target, scene, className) {
  if (!target || target.querySelector('.world-art')) return;
  const img = document.createElement('img');
  img.src = './assets/art/' + scene + '.webp';
  img.alt = ''; img.className = 'world-art ' + className;
  img.width = 960; img.height = 640; img.decoding = 'async';
  if (className === 'map-art') img.loading = 'lazy';
  target.prepend(img);
 }
 function decorate() {
  const main = document.getElementById('main');
  if (!main) return;
  addArt(main.querySelector('.intro .skyline'), 'undercity-hero', 'intro-art');
  const hero = main.querySelector('.hero');
  const name = hero?.querySelector('h1')?.textContent.trim();
  if (scenes[name]) addArt(hero, scenes[name], 'district-art');
  for (const tile of main.querySelectorAll('.maptile')) {
   const scene = scenes[tile.querySelector('h3')?.textContent.trim()];
   if (scene) addArt(tile, scene, 'map-art');
  }
 }
 const main = document.getElementById('main');
 if (main) { new MutationObserver(decorate).observe(main, {childList:true}); decorate(); }
})();
