import {addPubExteriorServices} from './pub-plant.js';
// PUB-CODE/RTPUB-002 & RTPUB-024: a single source for the modelled pub's building envelope.
// Dimensions are GAME UNITS (1 unit is treated as 1 metre for the design exercise).
// This is not a surveyed cadastral plan, development consent, NCC certificate, or structural design.
export const PUB_ENVELOPE = Object.freeze({
  id: 'B:pub', address: 'N8-S',
  widthM: 14, depthM: 18, modelledStoreys: 1,
  groundLevelM: 0, wallHeightM: 4.6, roofEaveM: 4.85, roofPeakM: 5.95,
  interior: Object.freeze({leftX: -7, rightX: 7, frontZ: 6, rearZ: -12, centreZ: -3}),
  facade: Object.freeze({leftX: -7, rightX: 7, frontZ: 7, rearZ: -11, centreZ: -2}),
  // Interior rooms are separate game scenes. Translating by +1 along z aligns the
  // front wall, back wall, both side walls, windows and centreline with the town facade.
  interiorToFacadeZ: 1,
  frontageDoor: Object.freeze({widthM: 2.1, sillM: 0, headM: 2.5}),
  frontWindows: Object.freeze({centresX: Object.freeze([-4, 4]), widthM: 4.6, sillM: .9, headM: 3.2}),
  sideWindows: Object.freeze({rearZ: -1.5, frontZ: 2.5, sillM: 1.4, headM: 2.9}),
  serviceRoofOnly: true, habitableUpperFloor: false, upperWindows: 0, stairs: 0, lift: 0,
  originalConstructionYear: null, actualSiteBoundariesApproved: false,
  roofStructureCertified: false, weatherproofingCertified: false,
  externalFireSeparationAssessed: false, adjoiningLotsChecked: false,
});
export function pubFacadeCoordinate(localInteriorZ) {
  if(!Number.isFinite(localInteriorZ)) throw new TypeError('Pub coordinate must be finite');
  return localInteriorZ + PUB_ENVELOPE.interiorToFacadeZ;
}
export function pubEnvelopeFit({lotWidthM=26,lotDepthM=46}={}) {
  const e=PUB_ENVELOPE;
  if(!(lotWidthM>0&&lotDepthM>0))throw new RangeError('Invalid lot dimensions');
  return Object.freeze({
    modelledWithinNominalLot:e.widthM<=lotWidthM&&e.depthM<=lotDepthM,
    nominalSideSpaceEachM:(lotWidthM-e.widthM)/2,
    nominalFrontSpaceM:lotDepthM/2-e.facade.frontZ,
    nominalRearSpaceM:e.facade.rearZ+lotDepthM/2,
    cadastralBoundaryVerified:false, adjoiningFireSeparationVerified:false
  });
}
// The named pieces allow geometry assertions without treating render meshes as
// surveyed walls or approved structural elements.
export function buildPubFacade(b, {GLASS=0x9fd3ea,DARK=0x33363b,WOOD=0x8a6545}={}) {
  const e=PUB_ENVELOPE, F=e.facade.frontZ, B=e.facade.rearZ, C=e.facade.centreZ;
  const wall=0x8a6a4e,brick=0xb47d61,roof=0x3a2a22,trim=0xd4b391;
  const t=.24, high=e.wallHeightM, pane=e.frontWindows;
  const panels=[];
  const piece=(name,color,w,h,d,x,y,z) => {
    b.box(color,w,h,d,x,y,z);
    panels.push(Object.freeze({name,w,h,d,x,y,z}));
  };
  // Front: a real visual doorway and *clear* glazed window openings, not
  // windows laid on top of an opaque 14x18x7m cuboid.
  for(const x of pane.centresX){
    piece('front-sill',wall,6,pane.sillM,t,x,pane.sillM/2,F);
    piece('front-glass',GLASS,pane.widthM,pane.headM-pane.sillM,.045,x,
      (pane.sillM+pane.headM)/2,F+.07);
  }
  for(const x of [-6.65,-1.35,1.35,6.65])piece('front-mullion',wall,.7,high-pane.sillM,t,x,(high+pane.sillM)/2,F);
  piece('front-upper-spandrel',wall,e.widthM,high-pane.headM,t,0,(high+pane.headM)/2,F);
  piece('door-header',wall,e.frontageDoor.widthM,pane.headM-e.frontageDoor.headM,t,
    0,(pane.headM+e.frontageDoor.headM)/2,F);
  piece('front-door-leaf',0x2a1e18,2.0,2.42,.075,0,1.21,F+.12);
  piece('front-door-glass',GLASS,.62,.85,.04,0,1.82,F+.165);
  for(const x of [-1.07,1.07])piece('door-jamb',WOOD,.12,2.5,.20,x,1.25,F+.12);
  // Side windows occupy the same projected openings as highStreetShell()
  // after applying the interior->town z translation.
  const sw=e.sideWindows;
  const leftDepth=sw.rearZ-B,rightDepth=F-sw.frontZ;
  for(const x of [-e.widthM/2,e.widthM/2]){
    piece('rear-side-wall',wall,t,high,leftDepth,x,high/2,(B+sw.rearZ)/2);
    piece('front-side-wall',wall,t,high,rightDepth,x,high/2,(sw.frontZ+F)/2);
    piece('side-sill',wall,t,sw.sillM,sw.frontZ-sw.rearZ,x,sw.sillM/2,(sw.frontZ+sw.rearZ)/2);
    piece('side-upper-spandrel',wall,t,high-sw.headM,sw.frontZ-sw.rearZ,x,
      (high+sw.headM)/2,(sw.frontZ+sw.rearZ)/2);
    piece('side-glass',GLASS,.045,sw.headM-sw.sillM,sw.frontZ-sw.rearZ,
      x+Math.sign(x)*.07,(sw.sillM+sw.headM)/2,(sw.frontZ+sw.rearZ)/2);
  }
  piece('rear-wall',wall,5.95,high,t,-4.025,high/2,B);
  piece('rear-wall',wall,5.95,high,t,4.025,high/2,B);
  piece('rear-exit-header',wall,2.1,high-2.5,t,0,(high+2.5)/2,B);
  piece('rear-exit-door',0x3f514d,2.0,2.4,.08,0,1.2,B-.12);
  addPubExteriorServices(b);
  // One low, non-occupied hipped roof and continuous parapet, not a false
  // upper storey or second row of illuminated windows.
  piece('roof-capping',roof,14.6,.24,18.6,0,4.86,C);
  b.pyramid(roof,14.6,e.roofPeakM-e.roofEaveM,18.6,0,
    (e.roofPeakM+e.roofEaveM)/2,C);
  panels.push(Object.freeze({name:'nonhabitable-roof',maxY:e.roofPeakM}));
  piece('front-parapet',trim,14.25,.20,.28,0,4.47,F+.04);
  for(const x of [-6.4,6.4])for(const y of [1,2.2,3.4]){
    piece('brick-quoins',brick,.56,.21,.12,x,y,F+.13);
  }
  piece('entry-mat',0xaba394,2.2,.025,.7,0,.013,F+.42);
  // Facade-era ornament and pub frontage furniture remain at ground level.
  b.block(DARK,.1,3.0,.1,6.4,0,F+1.2);
  piece('sign-bracket',DARK,1.2,.08,.08,5.9,3.25,F+1.2);
  piece('hanging-pub-sign',0x2f5a3a,.9,1.1,.08,5.6,2.5,F+1.2);
  for(const x of [-5.2,-4.4])b.cyl(0x7a5030,.4,.95,x,.48,F+1);
  for(const x of [-2.8,3.2]){
    b.block(WOOD,1.8,.08,.8,x,.75,F+2.6);
    b.block(WOOD,1.8,.45,.3,x,0,F+2);
    b.block(WOOD,1.8,.45,.3,x,0,F+3.2);
  }
  return Object.freeze({w:e.widthM,d:e.depthM,front:F,back:B,height:high,
    storeys:e.modelledStoreys,hasUpperFloor:false,interiorOffsetZ:e.interiorToFacadeZ,
    pieces:Object.freeze(panels)});
}
