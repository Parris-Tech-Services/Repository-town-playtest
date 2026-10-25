// Fictional Merged Branch pilot. SI-derived units, not an as-built installation.
import { pilotReport } from './electrical-pilot.js';
export const PUB_DESIGN = Object.freeze({cisternL:6, refillLmin:3, hotTankL:160, heaterKW:3.6, lpgKWhKg:12.8, burnerKW:18, upsKWh:.12, networkKW:.04});
export function pubUtilities(life) {
  const state = life.civic.pubUtilities ||= {version:1, waterValve:true, sewerOpen:true, breaker:true, upstreamInternet:true, lpgValve:true, lpgKg:90, cisternL:6, hotC:60, coldC:3, upsKWh:.12, greaseKg:0, binsKg:0, recyclingKg:0, oilL:0, roofRunoffL:0, rainMmHour:0, waterL:0, sewageL:0, tradeWasteL:0, electricityKWh:0, gasKg:0, meals:0, overlay:'off', log:[]};
  state.emergencyMinutes ??= 90;
  state.coldExposureMinutes ??= 0;
  state.foodQuarantined ??= false;
  state.extractionOn ??= true;
  return state;
}
export function validPubUtilities(s){
 if(!s||typeof s!=='object'||Array.isArray(s)||s.version!==1)return false;
 for(const key of ['waterValve','sewerOpen','breaker','upstreamInternet','lpgValve'])if(typeof s[key]!=='boolean')return false;
 for(const key of ['lpgKg','cisternL','hotC','coldC','upsKWh','greaseKg','binsKg','recyclingKg','oilL','waterL','sewageL','tradeWasteL','electricityKWh','gasKg','meals'])if(!Number.isFinite(s[key])||s[key]<0||s[key]>1e12)return false;
 for(const key of ['emergencyMinutes','coldExposureMinutes','roofRunoffL','rainMmHour'])if(s[key]!==undefined&&(!Number.isFinite(s[key])||s[key]<0||s[key]>1e12))return false;
 for(const key of ['foodQuarantined','extractionOn'])if(s[key]!==undefined&&typeof s[key]!=='boolean')return false;
 if(s.emergencyMinutes>90)return false;
 return s.cisternL<=6&&s.upsKWh<=.12&&s.hotC<=100&&s.coldC<=100&&['off','electricity','water','sewer','gas','internet','waste'].includes(s.overlay)&&Array.isArray(s.log)&&s.log.length<=20&&s.log.every(x=>typeof x==='string'&&x.length<1000);
}
export function pubStatus(life) {
  const s=pubUtilities(life), pilot=pilotReport(life)?.siteById['B:pub'];
  // A backup inverter only serves essentials; it cannot run full bistro cooking.
  const power=s.breaker && (pilot?pilot.mains:life.gridPowered('industry'));
  const backup=s.breaker && !!pilot?.backup;
  const water=s.waterValve && life.civic.supply.waterOk!==false;
  return {power,backup,water,internet:s.upstreamInternet&&(power||backup||s.upsKWh>1e-8),sewer:s.sewerOpen,hot:s.hotC>=45,cold:s.coldC<=5,gas:s.lpgValve&&s.lpgKg>0};
}
export function pubKitchenReady(life){
 const s=pubUtilities(life),p=pubStatus(life);
 return p.power&&p.water&&p.hot&&p.sewer&&p.cold&&!s.foodQuarantined&&s.extractionOn&&p.gas&&s.lpgKg>=18/6/12.8&&s.greaseKg<20&&s.binsKg<80;
}
export function tickPubUtilities(life,minutes) {
  if(!Number.isFinite(minutes)||minutes<=0)return;
  const s=pubUtilities(life), d=PUB_DESIGN;
  // Bounded substeps keep heating/UPS transitions stable during time acceleration.
  for(let m=0;m<minutes;m+=.5){const dt=Math.min(.5,minutes-m),h=dt/60,p=pubStatus(life);
    if(p.water){const refill=Math.min(d.cisternL-s.cisternL,d.refillLmin*dt);s.cisternL+=refill;s.waterL+=refill;}
    // Accumulated warm storage remains unsafe after recooling; explicit disposal required.
    if(s.coldC>5){s.coldExposureMinutes+=dt;if(s.coldExposureMinutes>=120)s.foodQuarantined=true;}
    if(p.power)s.emergencyMinutes=Math.min(90,s.emergencyMinutes+dt*.25);
    else s.emergencyMinutes=Math.max(0,s.emergencyMinutes-dt);
    const heater=p.power&&s.hotC<60?d.heaterKW:0;
    s.roofRunoffL=(s.roofRunoffL||0)+Math.max(0,Number(s.rainMmHour)||0)*252*.9*h;
    s.hotC=Math.max(18,Math.min(60,s.hotC+heater*h/(d.hotTankL*.001163)-(s.hotC-18)*dt/1440));
    // Battery-backed essentials can run the cold room for their limited rated autonomy.
    s.coldC= (p.power||p.backup) ? Math.max(3,s.coldC-dt*.15) : 24-(24-s.coldC)*Math.exp(-dt/180);
    if(p.power){s.electricityKWh+=(1.2+.3+d.networkKW+heater)*h;s.upsKWh=Math.min(d.upsKWh,s.upsKWh+.06*h);}
    else s.upsKWh=Math.max(0,s.upsKWh-d.networkKW*h);
  }
}
function record(s,message){s.log.unshift(message);s.log=s.log.slice(0,20);return message;}
export function pubAction(life,action){
  const s=pubUtilities(life),p=pubStatus(life),d=PUB_DESIGN;
  if(action==='water-drink'){
    if(!p.water)return record(s,'Free drinking water unavailable: potable mains isolated. Alcohol service must stop until safe drinking water is available.');
    s.waterL+=.25;return record(s,'Free drinking water served: 0.25 L potable water consumed.');
  }
  if(action==='discard-food'){
    if(!p.cold)return record(s,'Restore refrigeration below 5 °C before restocking.');
    const stock=life.place?.('pub')?.stock;
    let removed=0;
    if(stock)for(const key of ['lamb','veg','pie','pub_parmy','pub_roast','pub_pie','pub_chips']){removed+=Math.max(0,stock[key]||0);stock[key]=0;}
    s.foodQuarantined=false;s.coldExposureMinutes=0;
    return record(s,'Unsafe cold stock discarded ('+removed+' inventory units). Normal deliveries and food preparation must replenish saleable stock.');
  }
  if(action==='extraction'){s.extractionOn=!s.extractionOn;return record(s,'Kitchen extraction '+(s.extractionOn?'running':'failed: cooking interlock active')+'.');}
  if(action==='flush'){
    if(!p.sewer)return record(s,'Toilet out of service: sewer connection isolated.');
    if(s.cisternL<3)return record(s,'Not enough stored cistern water. Wait for mains refill.');
    s.cisternL-=3;s.sewageL+=3;return record(s,'Half flush: 3 L from cistern to sanitary drain and town sewer.');
  }
  if(action==='wash'){
    if(!p.water||!p.hot||!p.sewer)return record(s,'Hand washing unavailable: warm potable water and a working drain are required.');
    s.waterL+=2;s.sewageL+=2;s.hotC=18+(s.hotC-18)*(158/160);return record(s,'Hands washed with warm water, soap and a single-use towel; 2 L drained to sewer.');
  }
  if(action==='meal'){
    const kg=d.burnerKW*(10/60)/d.lpgKWhKg;
    if(!pubKitchenReady(life))return record(s,'Kitchen unavailable: check power/extraction, water, hot water, cold room, LPG, drains, grease and waste capacity.');
    s.lpgKg-=kg;s.gasKg+=kg;s.waterL+=8;s.tradeWasteL+=8;s.greaseKg+=.08;s.binsKg+=.3;s.recyclingKg+=.05;s.oilL+=.03;s.meals++;s.hotC=18+(s.hotC-18)*152/160;
    return record(s,'One demonstration meal prepared: LPG consumed, extraction powered, wash-up routed through grease arrestor. Not a stock purchase or food-safety certification.');
  }
  if(action==='glass'){
    if(!p.power||!p.water||!p.sewer||!p.hot)return record(s,'Glasswasher unavailable: power, hot water and drainage required.');
    s.waterL+=3;s.tradeWasteL+=3;s.electricityKWh+=.1;s.hotC=18+(s.hotC-18)*157/160;return record(s,'Glasswasher cycle: 3 L, 0.1 kWh; trade wastewater to pre-treatment.');
  }
  if(action==='network')return record(s,p.internet?'Router and NBN endpoint powered; upstream link available. EFTPOS simulation online.':'Internet/VoIP/EFTPOS offline. Local backup cannot repair an upstream outage.');
  const toggles={water:'waterValve',power:'breaker',sewer:'sewerOpen',gas:'lpgValve',internet:'upstreamInternet'};
  if(toggles[action]){s[toggles[action]]=!s[toggles[action]];return record(s,action+' service '+(s[toggles[action]]?'available':'isolated')+' (simulation test).');}
  if(action==='collect'){s.binsKg=0;s.recyclingKg=0;s.oilL=0;return record(s,'Recorded a contracted waste, recycling and used-oil collection (manual scenario).');}
  if(action==='grease'){s.greaseKg=0;return record(s,'Recorded licensed contractor grease-arrestor pump-out (manual scenario).');}
  return 'Unknown pub utility action.';
}
