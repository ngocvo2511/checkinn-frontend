import test from 'node:test';
import assert from 'node:assert/strict';
import {hotelApi} from '../lib/api/hotels.ts';
async function mocked(fetcher,run){const old=globalThis.fetch;globalThis.fetch=fetcher;try{await run();}finally{globalThis.fetch=old;}}
test('canonical text remains literal across hotel, room, policy, FAQ, city and amenity adapters',async()=>{
 for(const text of ['"Quoted text"','"\\"Nested quotes\\""','null','undefined','Tiếng Việt 🌊\nDòng hai','<script>literal text</script>','{"text":"literal"}']){
  const hotel={textEncoding:'PLAIN_V1',id:'hotel',name:text,description:text,contactEmail:text,contactPhone:text,city:{name:text,parentName:text},address:{street:text,city:text,country:'VN'},policies:[{title:text,category:text,content:text}],faqs:[{question:text,answer:text}],amenityCategories:[{title:text,items:[{title:text}]}],roomTypes:[{textEncoding:'PLAIN_V1',id:'room',name:text,description:text,bedType:text}]};
  await mocked(async url=>Response.json(String(url).includes('/hotels/')?hotel:{textEncoding:'PLAIN_V1',id:'room',name:text,description:text,bedType:text,capacity:{adults:2,children:0,bedType:text}}),async()=>{
   const result=await hotelApi.getHotelById('hotel');assert.equal(result.name,text);assert.equal(result.description,text);assert.equal(result.city.name,text);assert.equal(result.city.parentName,text);assert.equal(result.policies[0].content,text);assert.equal(result.policies[0].title,text);assert.equal(result.faqs[0].question,text);assert.equal(result.amenityCategories[0].items[0].title,text);assert.equal(result.roomTypes[0].name,text);assert.equal(result.roomTypes[0].description,text);
   const room=await hotelApi.getRoomTypeById('room');assert.equal(room.name,text);assert.equal(room.description,text);assert.equal(room.bedType,text);assert.equal(room.capacity.bedType,text);
  });
 }
});

test('actual nulls and empty optional text remain distinct from literal null/undefined strings',async()=>{
 await mocked(async()=>Response.json({id:'hotel',name:'Fixture',description:null,contactPhone:null,policies:[{title:'',category:'',content:null}],roomTypes:[]}),async()=>{const hotel=await hotelApi.getHotelById('hotel');assert.equal(hotel.description,null);assert.equal(hotel.contactPhone,null);assert.equal(hotel.policies[0].title,'');assert.equal(hotel.policies[0].content,null);});
});
test('structured-address compatibility is bounded and never decodes text inside the address',async()=>{
 const address={street:'"Quoted street"',city:'null',country:'VN',latitude:12,longitude:108};
 for(const value of [address,JSON.stringify(address),JSON.stringify(JSON.stringify(address))])await mocked(async()=>Response.json({textEncoding:'PLAIN_V1',id:'hotel',name:'"Literal name"',address:value,roomTypes:[]}),async()=>{const hotel=await hotelApi.getHotelById('hotel');assert.deepEqual(hotel.address,address);assert.equal(hotel.name,'"Literal name"');});
});

test('legacy generated-mapper responses decode exactly one proven encoding layer and keep manual text literal',async()=>{
 for(const text of ['"Quoted text"','null','undefined','Tiếng Việt 🌊']){
  const old={id:'hotel',name:JSON.stringify(text),description:JSON.stringify(text),city:{name:JSON.stringify(text)},amenityCategories:[{title:text,items:[{title:text}]}],policies:[{content:text}],roomTypes:[{id:'room',name:JSON.stringify(text),description:text}]};
  await mocked(async url=>Response.json(String(url).includes('/hotels/')?old:{id:'room',name:JSON.stringify(text),description:text}),async()=>{
   const hotel=await hotelApi.getHotelById('hotel');assert.equal(hotel.name,text);assert.equal(hotel.description,text);assert.equal(hotel.city.name,text);assert.equal(hotel.amenityCategories[0].items[0].title,text);assert.equal(hotel.policies[0].content,text);assert.equal(hotel.roomTypes[0].name,text);assert.equal(hotel.roomTypes[0].description,text);
   const room=await hotelApi.getRoomTypeById('room');assert.equal(room.name,text);assert.equal(room.description,text);
  });
 }
});
test('unrecognized text encoding fails instead of guessing its string meaning',async()=>{
 await mocked(async()=>Response.json({id:'hotel',name:'Fixture',textEncoding:'FUTURE_UNKNOWN'}),async()=>assert.rejects(hotelApi.getHotelById('hotel'),e=>e.code==='INVALID_RESPONSE'));
});
