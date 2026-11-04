// Non-overlapping Narromine asphalt and footpath surfaces from real mapped centrelines.
// The old renderer placed coplanar road boxes over one another at every bend and
// intersection; full-width footpath boxes also sat under asphalt. That caused
// visible z-fighting and giant flashing road/footpath wedges when moving.
// Convex difference preserves precise oblique corners and never rasterises roads.
const EPS = 1e-7;
const AREA_EPS = 1e-5;
const GRID = 64;

const area = (pts) => Math.abs(pts.reduce((a, p, i) => {
  const q = pts[(i + 1) % pts.length];
  return a + p[0] * q[1] - q[0] * p[1];
}, 0)) * 0.5;
const bounds = (pts) => pts.reduce((b, [x, z]) => ({
  x0: Math.min(b.x0, x), x1: Math.max(b.x1, x),
  z0: Math.min(b.z0, z), z1: Math.max(b.z1, z),
}), { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity });
const overlaps = (a, b) => a.x0 < b.x1 - EPS && b.x0 < a.x1 - EPS &&
  a.z0 < b.z1 - EPS && b.z0 < a.z1 - EPS;

// Counter-clockwise in world [x,z], preserving the original extensions at
// segment ends for connected bends and branches.
export function roadQuad(ax, az, bx, bz, width) {
  const length = Math.hypot(bx - ax, bz - az);
  if (length < 0.05 || width <= 0) return null;
  const ux = (bx - ax) / length, uz = (bz - az) / length;
  const vx = -uz, vz = ux, hl = (length + width * 0.5) / 2, hw = width / 2;
  const cx = (ax + bx) / 2, cz = (az + bz) / 2;
  return [[cx - ux * hl - vx * hw, cz - uz * hl - vz * hw],
    [cx + ux * hl - vx * hw, cz + uz * hl - vz * hw],
    [cx + ux * hl + vx * hw, cz + uz * hl + vz * hw],
    [cx - ux * hl + vx * hw, cz - uz * hl + vz * hw]];
}

function clipHalfPlane(pts, a, b, keepInside) {
  if (!pts.length) return [];
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const signed = p => dx * (p[1] - a[1]) - dz * (p[0] - a[0]);
  const out = [];
  let prev = pts[pts.length - 1], dp = signed(prev);
  for (const cur of pts) {
    const dc = signed(cur), prevIn = keepInside ? dp >= -EPS : dp <= EPS;
    const curIn = keepInside ? dc >= -EPS : dc <= EPS;
    if (prevIn !== curIn) {
      const t = Math.max(0, Math.min(1, dp / (dp - dc)));
      out.push([prev[0] + (cur[0] - prev[0]) * t,
        prev[1] + (cur[1] - prev[1]) * t]);
    }
    if (curIn) out.push(cur);
    prev = cur; dp = dc;
  }
  return out;
}

// The exterior fragments are disjoint; the sole interior remainder advances
// to the next cutter half-plane. All fragments remain convex.
export function subtractConvex(subject, cutter) {
  if (!overlaps(bounds(subject), bounds(cutter))) return [subject];
  let remainder = subject;
  const pieces = [];
  for (let i = 0; i < cutter.length && remainder.length >= 3; i++) {
    const a = cutter[i], b = cutter[(i + 1) % cutter.length];
    const outside = clipHalfPlane(remainder, a, b, false);
    if (outside.length >= 3 && area(outside) > AREA_EPS) pieces.push(outside);
    remainder = clipHalfPlane(remainder, a, b, true);
  }
  return pieces;
}

class QuadIndex {
  constructor() { this.tiles = new Map(); this.quads = []; }
  cells(b) {
    const c = [];
    for (let x = Math.floor(b.x0 / GRID); x <= Math.floor(b.x1 / GRID); x++)
      for (let z = Math.floor(b.z0 / GRID); z <= Math.floor(b.z1 / GRID); z++) c.push(`${x},${z}`);
    return c;
  }
  add(quad) {
    const id = this.quads.length, b = bounds(quad);
    this.quads.push({ quad, b });
    for (const cell of this.cells(b)) {
      if (!this.tiles.has(cell)) this.tiles.set(cell, []);
      this.tiles.get(cell).push(id);
    }
  }
  find(quad) {
    const b = bounds(quad), ids = new Set();
    for (const cell of this.cells(b)) for (const id of this.tiles.get(cell) || []) ids.add(id);
    return [...ids].sort((a, b) => a - b).map(id => this.quads[id])
      .filter(entry => overlaps(b, entry.b)).map(entry => entry.quad);
  }
}

function priority(kind) {
  return ({ trunk: 8, primary: 7, secondary: 6, tertiary: 5,
    unclassified: 4, residential: 3, living_street: 2, service: 1, track: 0 })[kind] ?? 2;
}

export function buildDisjointRoadSurfaces(streets, { highway = null } = {}) {
  const segments = [];
  for (const street of streets) for (let i = 1; i < street.pts.length; i++) {
    const a = street.pts[i - 1], b = street.pts[i];
    const asphalt = roadQuad(...a, ...b, street.width);
    if (!asphalt) continue;
    const kerbed = /^(trunk|primary|secondary|tertiary|residential|unclassified)$/.test(street.kind);
    segments.push({ kind: street.kind, asphalt,
      footpath: kerbed ? roadQuad(...a, ...b, street.width + 5) : null,
      index: segments.length });
  }
  // Higher-order roads have priority at a junction, giving deterministic
  // materials without interpenetrating top surfaces.
  segments.sort((a, b) => priority(b.kind) - priority(a.kind) || a.index - b.index);
  const occupied = new QuadIndex();
  if (highway) occupied.add([
    [highway.x0, highway.z - highway.width / 2],
    [highway.x1, highway.z - highway.width / 2],
    [highway.x1, highway.z + highway.width / 2],
    [highway.x0, highway.z + highway.width / 2],
  ]);
  const asphalt = [], footpaths = [];
  const insert = (quad, dest, kind) => {
    let parts = [quad];
    for (const blocker of occupied.find(quad)) {
      parts = parts.flatMap(part => subtractConvex(part, blocker));
      if (!parts.length) break;
    }
    for (const pts of parts) if (area(pts) > AREA_EPS) dest.push({ pts, kind });
    // The union of original footprints is equivalent to all visible fragments.
    occupied.add(quad);
  };
  // Every street, including service streets, cuts through footpath footprints.
  for (const segment of segments) insert(segment.asphalt, asphalt, segment.kind);
  for (const segment of segments) if (segment.footpath) insert(segment.footpath, footpaths, segment.kind);
  return { asphalt, footpaths };
}
