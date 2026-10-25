import { buildInterior } from './interior.js';

// Genuine multi-room visitor accommodation. Not an empty generic shop.
export const HOTEL_ROOM_COUNT=4;
export function buildHotelInterior(site,makeLabel){
  const rooms=[{
    name:'Reception and breakfast lounge',w:12,d:10,
    props:[['counter','Reception desk',{do:'info',title:'Railway Hotel check-in',
      text:'Book a room at the hotel reception, then sleep in your allocated guest bed.'}],
      ['cafeTable','Breakfast table'],['sofa','Guest lounge'],['bookshelf','Visitor information']]
  }];
  for(let i=1;i<=HOTEL_ROOM_COUNT;i++)rooms.push({
    name:'Guest room '+i,w:8,d:8,
    props:[['bed','Sleep in room '+i,{do:'sleep',room:i}],
      ['wardrobe','Clothes wardrobe'],['lamp','Bedside light'],['chair','Guest chair']]
  });
  return buildInterior({coordinate:'I8',repo:'railway-hotel-public',name:site.name,
    int:{layout:'row',floor:0xa88c6e,walls:0xe7d9c3,doors:0x775337,light:0xffe4b1,
      rooms}},makeLabel);
}
