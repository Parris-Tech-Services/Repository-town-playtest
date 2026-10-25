// Pure fictional geographic and founding canon. Not a survey or a real town zoning/parcel map.
export const TOWN_ORIGIN=Object.freeze({
  name:'Repository Town',
  founder:'Reginald Arthur Repo',
  namesake:'Reginald Arthur Repo',
  foundingYear:1883,
  firstBuilding: Object.freeze({name:"Repo's Stores",year:1883,site:'G8-N'}),
  firstMayor: Object.freeze({name:'Reginald Arthur Repo',termStart:1909,termEnd:1914,knightedFictionallyIn:1927}),
  currentMayor2026:'Vern',
  site: Object.freeze({latitude:-32.2736,longitude:148.4084,datum:'EPSG:4326',fictional:true,surveyed:false}),
  bounds: Object.freeze({minX:-390,maxX:390,minZ:-190,maxZ:290}),
  historicPub: Object.freeze({id:'B:pub',built:null,firstTrade:null,originalName:null}),
});
export function gameMetresToCoordinates(x,z) {
 if(!Number.isFinite(x)||!Number.isFinite(z))throw new TypeError('finite game x and z required');
 const phi=TOWN_ORIGIN.site.latitude*Math.PI/180;
 return {latitude:TOWN_ORIGIN.site.latitude-z/111195,
 longitude:TOWN_ORIGIN.site.longitude+x/(111195*Math.cos(phi))};
}
export function townChronicleNotice() {
 return 'Repository Town, imagined near Minore in central-west NSW: '+TOWN_ORIGIN.site.latitude.toFixed(4)+', '+TOWN_ORIGIN.site.longitude.toFixed(4)+
 '. Founded in 1883 at Repo\'s Stores by Reginald Arthur Repo and Ellen Repo. Reginald was first fictional mayor from 1909; he was not called Sir until the fictional honour of 1927. '+
 'Built on Aboriginal Country with living Traditional Owner connections. Real parcel, rails, water and grid connections are not surveyed.';
}
