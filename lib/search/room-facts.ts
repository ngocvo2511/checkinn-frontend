import type {CapacityDto} from '../api/hotels.ts';
export interface RoomFactSource {name?:unknown;description?:unknown;basePrice?:unknown;pricePerNight?:unknown;totalRooms?:unknown;roomAmount?:unknown;availableRooms?:unknown;capacity?:unknown;bedType?:unknown;roomSize?:unknown;amenities?:unknown;}
export interface EditableCapacity {adults:number|null;children:number|null;bedType:string|null;roomSize:number|null;breakfastIncluded:boolean|null;breakfastQuantity:number|null;}
export interface RoomEditState {name:string;description:string;basePrice:number|null;roomAmount:number|null;capacity:EditableCapacity;}
const integer=(value:unknown,min:number):number|null=>typeof value==='number'&&Number.isInteger(value)&&value>=min&&value<=2147483647?value:null;
const price=(value:unknown):number|null=>typeof value==='number'&&Number.isFinite(value)&&value>0?value:null;
const capacityObject=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
/** AvailableRooms is a dated observation, never a configured inventory fallback. */
export function roomFacts(room:RoomFactSource){
 const capacity=capacityObject(room.capacity),adults=integer(capacity.adults,1),children=integer(capacity.children,0);
 const basePrice=price(room.basePrice!==undefined?room.basePrice:room.pricePerNight);
 const totalRooms=integer(room.totalRooms!==undefined?room.totalRooms:room.roomAmount,1);
 const capacityKnown=adults!==null&&children!==null;
 return {price:basePrice,totalRooms,adults,children,capacityKnown,hasRequiredDetails:basePrice!==null&&totalRooms!==null&&capacityKnown};
}
export function roomEditState(room:RoomFactSource):RoomEditState {
 const facts=roomFacts(room),raw=capacityObject(room.capacity);
 const bed=raw.bedType!==undefined?raw.bedType:room.bedType,size=raw.roomSize!==undefined?raw.roomSize:room.roomSize;
 return {name:typeof room.name==='string'?room.name:'',description:typeof room.description==='string'?room.description:'',basePrice:facts.price,roomAmount:facts.totalRooms,
  capacity:{adults:facts.adults,children:facts.children,bedType:typeof bed==='string'?bed:null,roomSize:integer(size,0),breakfastIncluded:typeof raw.breakfastIncluded==='boolean'?raw.breakfastIncluded:null,breakfastQuantity:integer(raw.breakfastQuantity,0)}};
}
export interface RoomUpdatePatch {name?:string;description?:string;basePrice?:number;roomAmount?:number;capacity?:CapacityDto;amenities?:string[];}
/** Partial top-level updates preserve unknown values and unrelated concurrent edits. */
export function roomUpdatePatch(room:RoomFactSource,next:RoomEditState,amenities:string[]):RoomUpdatePatch {
 const original=roomEditState(room),patch:RoomUpdatePatch={};
 if(next.name!==original.name){if(!next.name.trim())throw new Error('Tên phòng không được để trống');patch.name=next.name;}
 if(next.description!==original.description)patch.description=next.description;
 if(!Object.is(next.basePrice,original.basePrice)){if(price(next.basePrice)===null)throw new Error('Giá phòng phải lớn hơn 0');patch.basePrice=next.basePrice!;}
 if(!Object.is(next.roomAmount,original.roomAmount)){
  if(original.roomAmount===null)throw new Error('Số lượng phòng chưa được xác minh; không thể tự gán số lượng mới');
  const value=integer(next.roomAmount,1);if(value===null)throw new Error('Số lượng phòng phải là số nguyên lớn hơn 0');
  if(value<original.roomAmount)throw new Error(`Số lượng phòng không thể giảm xuống dưới ${original.roomAmount}`);patch.roomAmount=value;
 }
 if((Object.keys(original.capacity) as Array<keyof EditableCapacity>).some(key=>!Object.is(original.capacity[key],next.capacity[key]))){
  const adults=integer(next.capacity.adults,1),children=integer(next.capacity.children,0);
  if(adults===null||children===null)throw new Error('Nhập đủ sức chứa người lớn và trẻ em hợp lệ');
  if(next.capacity.roomSize!==null&&integer(next.capacity.roomSize,0)===null)throw new Error('Diện tích phải là số nguyên không âm');
  if(next.capacity.breakfastQuantity!==null&&integer(next.capacity.breakfastQuantity,0)===null)throw new Error('Số suất bữa sáng phải là số nguyên không âm');
  if(next.capacity.breakfastIncluded!==null&&typeof next.capacity.breakfastIncluded!=='boolean')throw new Error('Thông tin bữa sáng không hợp lệ');
  patch.capacity={...next.capacity,adults,children};
 }
 const before=Array.isArray(room.amenities)?room.amenities:[];
 if(before.length!==amenities.length||before.some((value,index)=>value!==amenities[index]))patch.amenities=[...amenities];
 return patch;
}
