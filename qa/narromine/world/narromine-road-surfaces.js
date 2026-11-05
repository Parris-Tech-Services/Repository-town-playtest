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

// Kerb returns: where two streets meet at an angle, real kerbs turn the corner on a curve rather
// than meeting square. For each pair of neighbouring arms at a junction, fill the square corner
// between the two road edges with a circular fillet (radius KERB_RETURN_RADIUS, the usual size of an
// urban kerb return), as a fan of small convex triangles from the corner point.
export const KERB_RETURN_RADIUS = 9;
export function kerbReturns(streets, radius = KERB_RETURN_RADIUS) {
  const nodes = new Map(), key = ([x, z]) => Math.round(x * 2) + ',' + Math.round(z * 2);
  streets.forEach((st, si) => st.pts.forEach((p, i) => {
    const k = key(p); if (!nodes.has(k)) nodes.set(k, { p, arms: [] });
    const n = nodes.get(k);
    for (const j of [i - 1, i + 1]) if (j >= 0 && j < st.pts.length) {
      const q = st.pts[j], dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz);
      if (l > 1) n.arms.push({ si, ux: dx / l, uz: dz / l, a: Math.atan2(dz, dx), hw: (st.width || 7) / 2, kind: st.kind, len: l });
    }
  }));
  const out = [];
  for (const { p, arms } of nodes.values()) {
    if (new Set(arms.map(a => a.si)).size < 2) continue;          // a bend in one street, not a junction
    arms.sort((x, y) => x.a - y.a);
    for (let i = 0; i < arms.length; i++) {
      const A = arms[i], B = arms[(i + 1) % arms.length];
      let th = B.a - A.a; if (th <= 0) th += Math.PI * 2;
      if (th < 0.35 || th > 2.8) continue;                          // nearly parallel or straight through
      // Edge of A on B's side and edge of B on A's side; their intersection is the square corner C.
      const nA = [-A.uz, A.ux], nB = [B.uz, -B.ux];
      const pA = [p[0] + nA[0] * A.hw, p[1] + nA[1] * A.hw], pB = [p[0] + nB[0] * B.hw, p[1] + nB[1] * B.hw];
      const det = A.ux * B.uz - A.uz * B.ux; if (Math.abs(det) < 1e-6) continue;
      const t = ((pB[0] - pA[0]) * B.uz - (pB[1] - pA[1]) * B.ux) / det;
      const C = [pA[0] + A.ux * t, pA[1] + A.uz * t];
      const r = Math.min(radius, A.len * 0.45 * Math.tan(th / 2), B.len * 0.45 * Math.tan(th / 2));
      if (r < 1) continue;
      const L = r / Math.tan(th / 2);
      const T1 = [C[0] + A.ux * L, C[1] + A.uz * L], T2 = [C[0] + B.ux * L, C[1] + B.uz * L];
      const bx = A.ux + B.ux, bz = A.uz + B.uz, bl = Math.hypot(bx, bz) || 1, h = r / Math.sin(th / 2);
      const O = [C[0] + bx / bl * h, C[1] + bz / bl * h];
      const a1 = Math.atan2(T1[1] - O[1], T1[0] - O[0]); let a2 = Math.atan2(T2[1] - O[1], T2[0] - O[0]);
      let da = a2 - a1; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      const steps = Math.max(3, Math.ceil(Math.abs(da) / 0.26)), arc = [];
      for (let k = 0; k <= steps; k++) { const ang = a1 + da * k / steps; arc.push([O[0] + Math.cos(ang) * r, O[1] + Math.sin(ang) * r]); }
      const kind = priority(A.kind) <= priority(B.kind) ? A.kind : B.kind;
      for (let k = 1; k < arc.length; k++) {
        const tri = [C, arc[k - 1], arc[k]];
        // counter-clockwise like roadQuad
        const s2 = (tri[1][0] - tri[0][0]) * (tri[2][1] - tri[0][1]) - (tri[1][1] - tri[0][1]) * (tri[2][0] - tri[0][0]);
        out.push({ pts: s2 < 0 ? [tri[0], tri[2], tri[1]] : tri, kind });
      }
    }
  }
  return out;
}

export function sealedGaps(segments, maxGap = 7) {
  const out = [], idx = new QuadIndex();
  segments.forEach(sg => idx.add(sg.asphalt));
  const byQuad = new Map(segments.map(sg => [sg.asphalt, sg]));
  for (const s1 of segments) {
    const [ax, az] = s1.a, [bx, bz] = s1.b, len = Math.hypot(bx - ax, bz - az); if (len < 3) continue;
    const ux = (bx - ax) / len, uz = (bz - az) / len, nx = -uz, nz = ux;
    const probe = [[ax - 20, az - 20], [bx + 20, az - 20], [bx + 20, bz + 20], [ax - 20, bz + 20]];
    const b1 = bounds([s1.a, s1.b]), reach = [[b1.x0 - 20, b1.z0 - 20], [b1.x1 + 20, b1.z0 - 20], [b1.x1 + 20, b1.z1 + 20], [b1.x0 - 20, b1.z1 + 20]];
    for (const q of idx.find(reach)) {
      const s2 = byQuad.get(q); if (!s2 || s2.street === s1.street || s2.index < s1.index) continue;
      const [cx, cz] = s2.a, [dx, dz] = s2.b, l2 = Math.hypot(dx - cx, dz - cz); if (l2 < 3) continue;
      if (Math.abs(ux * (dx - cx) / l2 + uz * (dz - cz) / l2) < 0.9) continue;          // not side by side (> ~25°)
      const proj = (x, z) => [(x - ax) * ux + (z - az) * uz, (x - ax) * nx + (z - az) * nz];
      const [tc, oc] = proj(cx, cz), [td, od] = proj(dx, dz);
      const t0 = Math.max(0, Math.min(tc, td)), t1 = Math.min(len, Math.max(tc, td)); if (t1 - t0 < 3) continue;
      const off = (oc + od) / 2, side = Math.sign(off) || 1, gap = Math.abs(off) - (s1.width + s2.width) / 2;
      if (gap <= 0.2 || gap > maxGap) continue;
      const e1 = side * s1.width / 2, e2 = off - side * s2.width / 2;
      const P = (t, o) => [ax + ux * t + nx * o, az + uz * t + nz * o];
      let quad = [P(t0, e1), P(t1, e1), P(t1, e2), P(t0, e2)];
      if (area(quad) < AREA_EPS) continue;
      const sgn = quad.reduce((a, p, i) => { const r = quad[(i + 1) % 4]; return a + p[0] * r[1] - r[0] * p[1]; }, 0);
      if (sgn < 0) quad = quad.reverse();
      out.push({ pts: quad, kind: priority(s1.kind) <= priority(s2.kind) ? s1.kind : s2.kind });
    }
  }
  return out;
}

export function buildDisjointRoadSurfaces(streets, { highway = null } = {}) {
  const segments = [];
  for (const street of streets) for (let i = 1; i < street.pts.length; i++) {
    const a = street.pts[i - 1], b = street.pts[i];
    const asphalt = roadQuad(...a, ...b, street.width);
    if (!asphalt) continue;
    const kerbed = /^(trunk|primary|secondary|tertiary|residential|unclassified)$/.test(street.kind);
    segments.push({ kind: street.kind, asphalt, a, b, width: street.width, street,
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
  // Curved kerb returns at junctions (after the straight carriageways, before footpaths, so the
  // footpath is cut to the same curve).
  // Sealed gaps: two roads running side by side with under 7 m between their edges (a service road
  // beside a main street, as at Dandaloo Street by the Narromine Hotel) are one sealed surface in reality,
  // not two roads with a strip of footpath between them.
  for (const g of sealedGaps(segments)) insert(g.pts, asphalt, g.kind);
  // Drawn whole just below the carriageway (no fragmenting), but they still cut the footpaths.
  const fillets = kerbReturns(streets);
  for (const f of fillets) occupied.add(f.pts);
  for (const segment of segments) if (segment.footpath) insert(segment.footpath, footpaths, segment.kind);
  return { asphalt, footpaths, fillets };
}
