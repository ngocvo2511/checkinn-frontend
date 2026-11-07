import test from 'node:test';
import assert from 'node:assert/strict';
import {roomFacts,roomEditState,roomUpdatePatch} from '../lib/search/room-facts.ts';
const room={name:'Synthetic room',description:'Original',basePrice:200000,totalRooms:2,amenities:[],capacity:{adults:2,children:0,bedType:null,roomSize:null,breakfastIncluded:null,breakfastQuantity:null}};
test('capacity absence/partial/invalid values stay unknown while explicit zero children is known',()=>{
 assert.equal(roomFacts(room).capacityKnown,true);assert.equal(roomFacts(room).children,0);
 for(const capacity of [null,{}, {adults:2},{adults:0,children:0},{adults:2,children:null},{adults:1.5,children:0},{adults:'2',children:0}]){const facts=roomFacts({...room,capacity});assert.equal(facts.capacityKnown,false);assert.equal(facts.hasRequiredDetails,false);}
});
test('configured stock/price have canonical precedence and never come from observed availability',()=>{
 assert.equal(roomFacts({...room,totalRooms:null,roomAmount:8,availableRooms:5}).totalRooms,null);
 assert.equal(roomFacts({availableRooms:5}).totalRooms,null);assert.equal(roomFacts({roomAmount:3}).totalRooms,3);
 assert.equal(roomFacts({...room,basePrice:null,pricePerNight:999}).price,null);assert.equal(roomFacts({pricePerNight:200}).price,200);
 for(const value of [0,-1,NaN,Infinity,'200'])assert.equal(roomFacts({...room,basePrice:value}).price,null);
});
test('description-only edit sends only changed text and preserves unknown optional metadata',()=>{
 const form=roomEditState(room);form.description='Changed';assert.deepEqual(roomUpdatePatch(room,form,[]),{description:'Changed'});
 assert.equal(form.capacity.breakfastIncluded,null);assert.equal(form.capacity.roomSize,null);assert.equal(room.capacity.breakfastIncluded,null);
 const unknown={...room,basePrice:null,totalRooms:null,availableRooms:5,capacity:null};const edit=roomEditState(unknown);edit.description='Unrelated';assert.deepEqual(roomUpdatePatch(unknown,edit,[]),{description:'Unrelated'});
});
test('explicit owner capacity review preserves all six fields and real false/zero values',()=>{
 const initial={...room,capacity:{...room.capacity,roomSize:0,breakfastIncluded:false,breakfastQuantity:0}};
 const form=roomEditState(initial);form.capacity.bedType='"Quoted bed"';const patch=roomUpdatePatch(initial,form,[]);
 assert.deepEqual(patch.capacity,{adults:2,children:0,bedType:'"Quoted bed"',roomSize:0,breakfastIncluded:false,breakfastQuantity:0});assert.equal(patch.basePrice,undefined);assert.equal(patch.roomAmount,undefined);
 const legacy={...room,capacity:null};const reviewed=roomEditState(legacy);reviewed.capacity.adults=3;reviewed.capacity.children=1;
 assert.deepEqual(roomUpdatePatch(legacy,reviewed,[]).capacity,{adults:3,children:1,bedType:null,roomSize:null,breakfastIncluded:null,breakfastQuantity:null});
});
test('changed invalid values retain validation and unknown stock cannot be assigned from the edit form',()=>{
 for(const edit of [s=>s.name='',s=>s.basePrice=0,s=>s.roomAmount=1,s=>s.roomAmount=2.5,s=>s.capacity.children=null,s=>s.capacity.adults=0,s=>s.capacity.roomSize=-1]){const form=roomEditState(room);edit(form);assert.throws(()=>roomUpdatePatch(room,form,[]));}
 const unknown={...room,totalRooms:null};const form=roomEditState(unknown);form.roomAmount=5;assert.throws(()=>roomUpdatePatch(unknown,form,[]),/chưa được xác minh/);
});
test('no-op save and untouched canonical null description produce no mutation',()=>{
 assert.deepEqual(roomUpdatePatch(room,roomEditState(room),[]),{});
 const source={...room,description:null};assert.deepEqual(roomUpdatePatch(source,roomEditState(source),[]),{});
});
