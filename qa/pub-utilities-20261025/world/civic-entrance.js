// A civic building's doorway is a WORLD transition, not a hole in its solid
// exterior collider. South-side doors face negative Z and need their trigger
// outside the building wall (the player's radius is 0.35m).
export function civicEntranceZone(place) {
  if(place?.side==='south')return {
    x0:place.door.x-1.0,x1:place.door.x+1.0,
    z0:place.door.z-1.55,z1:place.door.z+0.20
  };
  return {
    x0:place.door.x-0.93,x1:place.door.x+0.93,
    z0:place.door.z-0.12,z1:place.door.z+1.35
  };
}
export function atCivicEntrance(place,pos) {
  if(!place||!pos)return false;
  const b=civicEntranceZone(place);
  return pos.x>b.x0&&pos.x<b.x1&&pos.z>=b.z0&&pos.z<=b.z1;
}
export function closedCivicDoorPose(place,pos) {
  // Put the visitor OUTSIDE the entire sensor, not in a repeat-trigger loop.
  // Keep the direction they were facing so the rejection feels natural.
  return {x:pos.x,z:place.side==='south'?place.door.z-1.90:place.door.z+1.75};
}
