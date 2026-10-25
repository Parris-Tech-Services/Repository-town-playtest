// Run: node tests/building-exits.mjs
// Regression tests for world-facing exits on both sides of the street.
// No browser, external API or paid service needed.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const { civicExitPose } = await import('data:text/javascript;base64,' +
  Buffer.from(read('world/shop-exit.js')).toString('base64'));

const radius = 0.43;
const hits = (p, colliders) => colliders.some(c => {
  const x = Math.max(c.x0, Math.min(c.x1, p.x));
  const z = Math.max(c.z0, Math.min(c.z1, p.z));
  return (p.x - x) ** 2 + (p.z - z) ** 2 < radius ** 2;
});
for (const [side, outward] of [['north', 1], ['south', -1]]) {
  const site = { id: side, side, door: { x: 20, z: 10 } };
  const pose = civicExitPose(site, [], radius);
  assert(pose, side + ' exit must find a safe spot');
  assert.equal(pose.x, site.door.x);
  assert.equal(pose.z, site.door.z + outward * 3.2);
  // Player.forward() is (-sin(yaw), -cos(yaw)), not (sin(yaw), cos(yaw)).
  const forwardZ = -Math.cos(pose.yaw);
  assert(forwardZ * outward > 0.999, side + ' player must face AWAY from the building');
  assert((pose.z - site.door.z) * forwardZ > 3,
    side + ' player view must point toward the road, not the doorway');
  assert(Math.abs(pose.z - site.door.z) > 0.92 + radius,
    side + ' must stay outside the automatic re-entry zone');
  // Obstructed centreline: select a collision-safe footpath alternative,
  // still facing away from the door rather than towards it.
  const blocked = [{ x0: 19.5, x1: 20.5, z0: pose.z - 0.6, z1: pose.z + 0.6 }];
  const alternate = civicExitPose(site, blocked, radius);
  assert(alternate && !hits(alternate, blocked), side + ' alternate exit must be clear');
  assert(-Math.cos(alternate.yaw) * outward > 0.999,
    side + ' alternate exit must retain outward orientation');
}
assert.equal(civicExitPose({ side:'north',door:{x:0,z:0} },
  [{x0:-10,x1:10,z0:-30,z1:30}], radius), null, 'all blocked = no unsafe spawn');
assert.throws(() => civicExitPose({door:{x:0,z:NaN}}, []), TypeError);

// Walking through a doorway must preserve the direction the player was
// actually facing. The exit button uses the usual outward-facing default,
// while walking backwards retains the original yaw instead of snapping around.
const main = read('main.js');
// Two equivalent safe implementations are supported: pass the preserved yaw
// directly to place(), or place facing outward then restore yaw when needed.
// The test checks both branches, rather than freezing incidental syntax.
const housePlace = /player\.place\(l\.doorPos\.x,\s*l\.doorPos\.z\s*\+\s*4,\s*keepFacing\s*\?\s*yawInside\s*:\s*Math\.PI\)/;
const houseRestore = /player\.place\(l\.doorPos\.x,\s*l\.doorPos\.z\s*\+\s*4,\s*Math\.PI\)\s*;\s*if\s*\(keepFacing\)\s*player\.yaw\s*=\s*yawInside\s*;/;
assert.ok(housePlace.test(main) || houseRestore.test(main),
  'houses must face outward on button exits and preserve walking yaw on physical exits');
assert.match(main, /else leave\(true, true\)/,
  'walking through a physical door must preserve the player facing');
assert.match(main, /civicExitPose\(shop,/,
  'all civic buildings must use the shared safe exit pose');
console.log('PASS: north/south exits face away, remain collision-free and cannot immediately re-enter');
