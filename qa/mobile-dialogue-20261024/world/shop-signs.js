import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Painted name boards for the high street: every sign is a strip in one canvas atlas and one
// merged mesh, so the whole street's lettering costs a single draw call.
// signs: [{ text, x, y, z, w, h, rotY = 0, bg = '#f3ead2', fg = '#2b2118', cross = false }]
// (x, y, z) is the board centre in town coordinates; it faces +z before rotY is applied.
const ROW = 96, WIDTH = 1024;
export function buildSignBoards(signs) {
  if (!signs.length || typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH; canvas.height = ROW * signs.length;
  const c = canvas.getContext('2d');
  const parts = signs.map((s, i) => {
    const used = Math.min(WIDTH, Math.round(ROW * (s.w / s.h)));
    const y0 = i * ROW;
    c.fillStyle = s.bg || '#f3ead2'; c.fillRect(0, y0, used, ROW);
    c.strokeStyle = s.fg || '#2b2118'; c.lineWidth = 5; c.strokeRect(6, y0 + 6, used - 12, ROW - 12);
    let left = 18;
    if (s.cross) {                            // the clinic's red cross, painted beside its name
      c.fillStyle = '#c62f2f'; const m = y0 + ROW / 2;
      c.fillRect(left + 20, m - 30, 20, 60); c.fillRect(left, m - 10, 60, 20); left += 76;
    }
    c.fillStyle = s.fg || '#2b2118'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const text = s.text.toUpperCase();
    let size = 58; c.font = `bold ${size}px Georgia, 'Times New Roman', serif`;
    while (size > 18 && c.measureText(text).width > used - left - 24) { size -= 2; c.font = `bold ${size}px Georgia, 'Times New Roman', serif`; }
    c.fillText(text, (left + used - 6) / 2, y0 + ROW / 2 + 3);
    const g = new THREE.PlaneGeometry(s.w, s.h);
    const uv = g.attributes.uv, v0 = 1 - (i + 1) / signs.length, v1 = 1 - i / signs.length, u1 = used / WIDTH;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * u1, v0 + uv.getY(k) * (v1 - v0));
    g.rotateY(s.rotY || 0);
    g.translate(s.x, s.y, s.z);
    return g;
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const mesh = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshLambertMaterial({ map: texture }));
  mesh.name = 'shop signs';
  return mesh;
}
