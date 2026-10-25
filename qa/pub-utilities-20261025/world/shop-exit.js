// A civic building's exterior door faces the street. North-side buildings
// face +z; south-side industry and utilities face -z. Spawn beyond the
// auto-enter sensor, with a clear player-sized footprint and the doorway BEHIND
// the player. The view direction matters as much as the collision-safe spawn:
// yaw 0 looks toward -z, while yaw Math.PI looks toward +z.
export function civicExitPose(site, colliders, radius = 0.46) {
  if (!site || !site.door || !Number.isFinite(site.door.x) || !Number.isFinite(site.door.z))
    throw new TypeError('Civic exit requires a door position');
  const side = site.side === 'south' ? -1 : 1;
  const collides = (x,z) => (colliders||[]).some(c=>{
    const cx=Math.max(c.x0,Math.min(c.x1,x)),cz=Math.max(c.z0,Math.min(c.z1,z));
    return (x-cx)**2+(z-cz)**2 < radius**2;
  });
  // Footpath distance also keeps the player beyond the auto-enter door sensor.
  // Choose outward-facing yaw on both sides rather than looking back at the door.
  const outwardYaw = side > 0 ? Math.PI : 0;
  for(const offset of [3.2,4.2,5.2,6.2,7.2,8.2,9.2,10.2]){
    const z=site.door.z+side*offset;
    for(const xoff of [0,-1.6,1.6,-3.2,3.2]){
      const x=site.door.x+xoff;
      if(!collides(x,z))return {x,z,yaw:outwardYaw};
    }
  }
  // Never return a collision-intersecting point. The caller can use the
  // safe town-centre respawn rather than trap the user inside geometry.
  return null;
}
