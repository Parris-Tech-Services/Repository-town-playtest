// Fictional, fixed household relations; keep original 99 worker IDs, names and homes.
// Spouses retain individual jobs, money, timetables and needs, share an actual house.
export const ORIGINAL_WORKERS=99;
export const EXPANSION_WORKERS=72;
export const MARRIED_COUPLES=55;
const SURNAMES=Object.freeze(['Hart','Turner','Bennett','Cole','Donovan','Brooks','Fleming','Ward','Carter','Morris','Young','Mason','Gibson','Wells','Mercer','Collins','Wright','Doyle','McKenzie','Archer','Ellis','West','Morgan','Palmer','Taylor','Olsen','Briggs','Dawson','Griffin','Hughes','Pearson','Reed','Forbes','Wallace','Harris','Blake','Carroll','Henderson','Douglas','Murray','Lawson','Cooper','Byrne','Kelly','Hawkins','Mitchell','Watson','Reynolds','Parker','Abbott','Mills','Gordon','Spencer','Sullivan','Perry']);
const MEETINGS=['at the regional show','while volunteering at a library fundraising day','at a sporting club meeting',
 'at a community garden working bee','during a town music night','while helping flood-response volunteers',
 'at a farm-gate market','at a trades demonstration day','at a charity book sale','at a repair café event'];
export function createMarriages(villagers){
 const marriages=[];
 for(let k=0;k<MARRIED_COUPLES;k++){
   const a=villagers[k],b=villagers[ORIGINAL_WORKERS+k];
   if(!a||!b||a.home.coordinate!==b.home.coordinate)throw new Error('Marriage requires shared home '+k);
   const surname=SURNAMES[k],year=2008+k%16;
   const story=a.name+' and '+b.name+' met '+MEETINGS[k%MEETINGS.length]+
    ', married in '+year+', and share their home at '+a.home.coordinate+
    '. '+a.name+' works as '+a.job+'; '+b.name+' works as '+b.job+
    '. They have different work shifts but share bills, household tasks, a kitchen and a double bed.';
   for(const [self,other,gender] of [[a,b,k%2?'male':'female'],[b,a,k%2?'female':'male']]){
     self.maritalStatus='married';self.spouseId=other.id;self.spouseName=other.name;
     self.gender=gender;self.familyName=surname;self.marriageYear=year;
     self.relationshipBackstory=story;self.householdOccupants=2;
   }
   marriages.push({address:a.home.coordinate,ids:[a.id,b.id],names:[a.name,b.name],
     surname,marriedYear:year,backstory:story,doubleBed:true});
 }
 for(const v of villagers)if(v.maritalStatus!=='married'){
   v.maritalStatus='single';v.householdOccupants=1;
 }
 return marriages;
}
export function reconcileSpouseHouseholds(villagers){
 // JSON saves serialize the same household/pantry twice, so relink after restore.
 for(let k=0;k<MARRIED_COUPLES;k++){
   const a=villagers[k],b=villagers[ORIGINAL_WORKERS+k];
   if(a&&b&&a.home.coordinate===b.home.coordinate){
     b.household=a.household;b.larder=a.larder;
   }
 }
}
export function householdMembers(villagers,coordinate){
 const residents=villagers.filter(v=>v.home.coordinate===coordinate);
 return {coordinate,residents:residents.map(v=>({id:v.id,name:v.name,job:v.job,
     married:v.maritalStatus==='married',spouse:v.spouseName||null,
     backstory:v.relationshipBackstory||null})),
   sharedDoubleBed:residents.length===2&&residents[0].spouseId===residents[1].id};
}
