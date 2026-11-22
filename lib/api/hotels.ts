import {uploadMedia as writeMedia,deleteMedia as removeMedia,selectThumbnail,deleteDraft,previewMedia} from './media-write.ts';
import {updateHotelContent} from './hotel-content.ts';
import {getHotelVerificationDocuments,uploadHotelVerificationDocuments} from './hotel-documents.ts';
import { readJson, readArray, ReadApiError } from './read-request.ts';
import { ApiRequestError, bookingFetch, responseError, transportError } from './request-error.ts';
import type { City } from './cities';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

/** Compatibility only for an expected structured address, never for free text. */
const legacyAddressObject=<T>(value:T):T|Record<string,unknown>=>{
  let parsed:unknown=value;
  for(let depth=0;depth<2&&typeof parsed==='string';depth++){
    try{parsed=JSON.parse(parsed);}catch{return value;}
    if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))return parsed as Record<string,unknown>;
  }
  return value;
};

/** Old generated mappers JSON-encoded these specific scalar fields once. */
const mapperText=<T>(value:T,encoding:unknown):T|string|null=>{
  if(encoding==='PLAIN_V1')return value;
  if(encoding!==undefined&&encoding!==null)throw new ReadApiError('INVALID_RESPONSE');
  if(typeof value==='string'){
    try{const decoded:unknown=JSON.parse(value);if(decoded===null||typeof decoded==='string')return decoded;}catch{/* Legacy raw text stays literal. */}
  }
  return value;
};

// Legacy wire mapping; read callers retain their existing payload checks.
// Assertions here describe the existing DTO boundary, not runtime validation.
const cleanHotelData = (value: unknown): Hotel => {
  const hotel = value as Hotel;
  let cleanedAddress = legacyAddressObject(hotel.address);
  if (cleanedAddress && typeof cleanedAddress === 'object' && !Array.isArray(cleanedAddress)) {
    cleanedAddress = {
      ...cleanedAddress,
      latitude: cleanedAddress.latitude != null ? Number(cleanedAddress.latitude) : undefined,
      longitude: cleanedAddress.longitude != null ? Number(cleanedAddress.longitude) : undefined,
    };
  }

  return {
    ...hotel,
    address: cleanedAddress,
    name: mapperText(hotel.name,hotel.textEncoding),
    description: mapperText(hotel.description,hotel.textEncoding),
    contactEmail: mapperText(hotel.contactEmail,hotel.textEncoding),
    contactPhone: mapperText(hotel.contactPhone,hotel.textEncoding),
    city: hotel.city ? {
      ...hotel.city,
      name: mapperText(hotel.city.name,hotel.textEncoding),
      parentName: mapperText(hotel.city.parentName,hotel.textEncoding),
    } : undefined,
    policies: hotel.policies?.map((p) => ({
      ...p,
      title: p.title,
      category: p.category,
      content: p.content,
    })),
    faqs: hotel.faqs?.map((f) => ({
      ...f,
      question: f.question,
      answer: f.answer,
    })),
    amenityCategories: hotel.amenityCategories?.map((cat) => ({
      ...cat,
      title: cat.title,
      items: cat.items?.map((item) => ({
        ...item,
        title: item.title,
      })),
    })),
    roomTypes: hotel.roomTypes?.map((rt) => ({
      ...rt,
      name: mapperText(rt.name,rt.textEncoding),
      description: typeof rt.description === "string" ? rt.description : undefined,
      bedType: rt.bedType,
    })),
  } as Hotel;
};

// Preserve legacy room text normalization without changing response acceptance.
const cleanRoomTypeData = (value: unknown): RoomType => {
  const roomType = value as RoomType;
  return {
    ...roomType,
    name: mapperText(roomType.name,roomType.textEncoding),
    description: typeof roomType.description === "string" ? roomType.description : undefined,
    bedType: roomType.bedType,
    capacity: roomType.capacity ? {
      ...roomType.capacity,
      bedType: roomType.capacity.bedType,
    } : undefined,
  } as RoomType;
};

export interface HotelAddress {
  street: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  coordinateSource?: string;
}

export type { City } from './cities';

export interface MediaAsset {
  id: string;
  url: string;
  type?: string;
  targetId?: string;
  targetType?: 'HOTEL'|'ROOM_TYPE';
  isThumbnail?: boolean;
  sortOrder?: number;
  displayOrder?: number;
}

export interface CapacityDto {
  adults: number;
  children: number;
  bedType?: string | null;
  roomSize?: number | null;
  breakfastIncluded?: boolean | null;
  breakfastQuantity?: number | null;
}

export interface PolicyResponse {
  title?: string;      // Legacy field for backward compatibility
  category?: string;   // New field using predefined categories
  content: string;
}

export interface QuestionResponse {
  question: string;
  answer: string;
}

export interface AmenityItemResponse {
  id: string;
  title: string;
}

export interface AmenityResponse {
  id: string;
  title: string;
  items: AmenityItemResponse[];
}

export interface AmenityCategoryOption {
  type: string;
}

export interface RoomType {
  textEncoding?: "PLAIN_V1";
  id: string;
  name: string;
  description?: string;
  maxOccupancy?: number;
  bedType?: string;
  roomSize?: number;
  pricePerNight?: number;
  basePrice?: number;
  availableRooms?: number;
  capacity?: CapacityDto;
  amenities?: string[];
  isActive?: boolean;
  totalRooms?: number | null;
  roomAmount?: number;
  mediaAssets?: MediaAsset[];
}

export type HotelApprovalStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Hotel {
  textEncoding?: "PLAIN_V1";
  accommodationType?: import("./accommodation-types").AccommodationType | null;
  accommodationTypeLabel?: string | null;
  id: string;
  /** Absent/null on public catalog responses; present on owner/admin views. */
  ownerId?: string | null;
  cityId: string;
  name: string;
  description?: string;
  starRating?: number;
  address: HotelAddress;
  isActive: boolean;
  approvedStatus: HotelApprovalStatus | string;
  city?: City;
  createdAt: string;
  updatedAt: string;
  roomTypes?: RoomType[];
  mediaAssets?: MediaAsset[];
  lowestPrice?: number;
  policies?: PolicyResponse[];
  faqs?: QuestionResponse[];
  amenityCategories?: AmenityResponse[];
  amenities?: AmenityResponse[]; // legacy name for amenityCategories
  contactEmail?: string;
  contactPhone?: string;
}

export interface RoomOffer {
  roomTypeId: string;
  quantity: number;
  unitPrice: number;
  totalPerNight: number;
  availableRooms: number | null;
  checkIn: string | null;
  checkOut: string | null;
  checkedAt: string | null;
}

export interface SearchHotelsParams {
  amenityCodes?: string[];
  accommodationTypes?: string[];
  cityId?: string;
  cityName?: string;
  provinceId?: string;
  adults?: number;
  children?: number;
  hotelName?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  rooms?: number;
  minPrice?: number;
  maxPrice?: number;
}

/** One bounded attempt (deadline covers the body); never retried; errors are typed and never echo raw bodies. */
const hotelRequest = async (url: string, init: RequestInit): Promise<Response> => {
  const response = await bookingFetch(url, init);
  if (!response.ok) throw await responseError(response);
  return response;
};

const hotelJson = async (response: Response): Promise<unknown> => {
  try { return await response.json(); }
  catch (error) {
    if (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name)) throw transportError(error);
    throw new ApiRequestError(response.status, 'INVALID_RESPONSE', 'Dữ liệu trả về không hợp lệ. Vui lòng thử lại.');
  }
};

const jsonHeaders = (extra: Record<string, string> = {}): Record<string, string> => ({ 'Content-Type': 'application/json', ...extra });

const validSearchHotel = (h: Hotel): boolean =>
  typeof h.id === 'string' && typeof h.name === 'string' &&
  typeof h.isActive === 'boolean' && typeof h.approvedStatus === 'string' &&
  (h.roomTypes == null || (Array.isArray(h.roomTypes) && h.roomTypes.every((r: RoomType) => r && typeof r.id === 'string')));

const cleanSearchHotels = (data: unknown): Hotel[] => {
  try { return readArray<Hotel>(data, validSearchHotel).map(cleanHotelData); }
  catch { throw new ReadApiError('INVALID_RESPONSE'); }
};

type MatchedHotel=Hotel & {matchedOffer:RoomOffer};
interface ReviewFacts {hotelId:string;totalReviews:number;averageRating:number|null;}
export interface HotelOfferPageParams extends SearchHotelsParams {
  page?:number;size?:number;sort?:string;starRatings?:number[];guestRatings?:number[];amenities?:string[];
}
export interface HotelOfferPage {
  content:Array<MatchedHotel & {reviews:ReviewFacts}>;page:number;size:number;sort:string;
  totalElements:number;totalPages:number;availableAmenities:string[];
}
function parseOfferRows(data:unknown,params:SearchHotelsParams):MatchedHotel[] {
    return readArray<{hotel: Hotel; offer: RoomOffer}>(data, row => {
      const o = row.offer;
      return row.hotel && validSearchHotel(row.hotel) && o && typeof o.roomTypeId === 'string' &&
        Number.isInteger(o.quantity) && o.quantity === (params.rooms ?? 1) && o.quantity > 0 && Number.isFinite(o.unitPrice) && o.unitPrice > 0 &&
        Number.isFinite(o.totalPerNight) && Math.abs(o.totalPerNight - o.unitPrice * o.quantity) < 0.000001 &&
        (o.availableRooms === null || (Number.isInteger(o.availableRooms) && o.availableRooms >= o.quantity)) &&
        (params.checkIn ? o.checkIn === params.checkIn && o.checkOut === params.checkOut && typeof o.checkedAt === 'string' && o.availableRooms !== null : o.checkIn === null && o.checkOut === null && o.availableRooms === null);
    }).map(row => ({...cleanSearchHotels([row.hotel])[0], matchedOffer: row.offer}));
}

export const hotelApi = {
  /** Canonical same-room offers from hotel-service. No fallback to client inventory. */
  async searchHotelOffers(params: SearchHotelsParams): Promise<Array<Hotel & { matchedOffer: RoomOffer }>> {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) for (const code of value) query.append(key,code);
      else if (value !== undefined && value !== '') query.set(key, String(value));
    }
    const data = await readJson(`${API_BASE_URL}/api/hotel/hotels/offers?${query}`);
    return parseOfferRows(data,params);
  },

  async searchHotelOfferPage(params:HotelOfferPageParams):Promise<HotelOfferPage> {
    const pageNumber=params.page??0,size=params.size??20,sort=params.sort??'DEFAULT';
    if(!Number.isSafeInteger(pageNumber)||pageNumber<0||pageNumber>2147483647||!Number.isSafeInteger(size)||size<1||size>50||!['DEFAULT','PRICE_ASC','PRICE_DESC','RATING_DESC'].includes(sort))throw new ReadApiError('VALIDATION');
    const query=new URLSearchParams();
    for(const [key,value] of Object.entries({...params,page:pageNumber,size,sort})){
      if(Array.isArray(value))for(const item of value)query.append(key,String(item));
      else if(value!==undefined&&value!=='')query.set(key,String(value));
    }
    const data=await readJson(`${API_BASE_URL}/api/hotel/hotels/offers/page?${query}`);
    if(!data||typeof data!=='object'||Array.isArray(data))throw new ReadApiError('INVALID_RESPONSE');
    const raw=data as {content:unknown;page:number;size:number;sort:string;totalElements:number;totalPages:number;availableAmenities:unknown};
    if(raw.page!==pageNumber||raw.size!==size||raw.sort!==sort||!Number.isSafeInteger(raw.totalElements)||raw.totalElements<0||raw.totalPages!==Math.ceil(raw.totalElements/size)||!Array.isArray(raw.availableAmenities)||!raw.availableAmenities.every(v=>typeof v==='string'&&v.trim()&&v.length<=255)||new Set(raw.availableAmenities).size!==raw.availableAmenities.length)throw new ReadApiError('INVALID_RESPONSE');
    const hotels=parseOfferRows(raw.content,params);
    if(hotels.length!==Math.min(size,Math.max(0,raw.totalElements-pageNumber*size))||new Set(hotels.map(h=>h.id)).size!==hotels.length)throw new ReadApiError('INVALID_RESPONSE');
    const rows=readArray<{hotel:Hotel;reviews:ReviewFacts}>(raw.content,row=>{
      const r=row.reviews;return !!r&&r.hotelId===row.hotel.id&&Number.isSafeInteger(r.totalReviews)&&r.totalReviews>=0&&(r.totalReviews===0?r.averageRating===null:typeof r.averageRating==='number'&&Number.isFinite(r.averageRating)&&r.averageRating>=0&&r.averageRating<=10);
    });
    return {...raw,availableAmenities:raw.availableAmenities as string[],content:hotels.map((hotel,index)=>({...hotel,reviews:rows[index].reviews}))};
  },

  /**
   * Search hotels by name
   */
  async searchHotelsByName(query: string): Promise<Hotel[]> {
    const data = await readJson(`${API_BASE_URL}/api/hotel/hotels/search?name=${encodeURIComponent(query)}`);
    return cleanSearchHotels(data);
  },

  /**
   * Search hotels by city
   */
  async searchHotelsByCity(cityId: string): Promise<Hotel[]> {
    const data = await readJson(`${API_BASE_URL}/api/hotel/hotels/city/${encodeURIComponent(cityId)}`);
    return cleanSearchHotels(data);
  },

  /**
   * Get hotel details by ID (public read, bounded by readJson)
   */
  async getHotelById(hotelId: string): Promise<Hotel> {
    return cleanHotelData(await readJson(`${API_BASE_URL}/api/hotel/hotels/${hotelId}`));
  },

  /** Read unpublished details only through the authenticated preview endpoint. */
  async getHotelPreview(hotelId: string, token: string): Promise<Hotel> {
    if (!token?.trim()) throw new Error('Vui lòng đăng nhập để xem khách sạn.');
    const response = await bookingFetch(`${API_BASE_URL}/api/hotel/hotels/${hotelId}/preview`,
      { method: 'GET', headers: jsonHeaders({ Authorization: `Bearer ${token}` }), cache: 'no-store' });
    if (!response.ok) throw new Error(`Không thể xem khách sạn: ${response.status}`);
    return cleanHotelData(await hotelJson(response));
  },

  /**
   * Get hotels by owner (requires authentication)
   */
  async getHotelsByOwner(token: string): Promise<Hotel[]> {
    const data = await readJson(`${API_BASE_URL}/api/hotel/hotels/owner`, { headers: jsonHeaders({ Authorization: `Bearer ${token}` }) });
    if (!Array.isArray(data)) throw new ReadApiError('INVALID_RESPONSE');
    return data.map((hotel) => cleanHotelData(hotel));
  },

  /**
   * Search hotels with advanced filters
   * Supports both city and province search
   */
  async searchHotels(params: SearchHotelsParams): Promise<Hotel[]> {
    return this.searchHotelOffers(params);
  },

  // Get pending hotels for approval (admin, requires JWT)
  getPendingHotels: async (): Promise<Hotel[]> => {
    const data = await readJson(`${API_BASE_URL}/api/hotel/hotels/pending`, { headers: jsonHeaders(authHeaders()) });
    if (!Array.isArray(data)) throw new ReadApiError('INVALID_RESPONSE');
    return data as Hotel[];
  },

  // Get pending hotel detail
  getPendingHotelDetail: async (hotelId: string): Promise<PendingHotelDetail> =>
    await readJson(`${API_BASE_URL}/api/hotel/hotels/pending/${hotelId}`, { headers: jsonHeaders(authHeaders()) }) as PendingHotelDetail,

  // Approve a hotel; callers rely on CONFLICT/FORBIDDEN ReadApiError codes.
  approveHotel: async (hotelId: string, revision: number): Promise<void> => {
    const response = await bookingFetch(`${API_BASE_URL}/api/hotel/hotels/${hotelId}/approve?revision=${revision}`, {
      method: 'PUT', headers: jsonHeaders(authHeaders()),
    });
    if (!response.ok) {
      throw new ReadApiError(response.status===409?'CONFLICT':response.status===403?'FORBIDDEN':'UPSTREAM',response.status);
    }
  },

  // Reject a hotel
  rejectHotel: async (hotelId: string, note: string): Promise<void> => {
    await hotelRequest(`${API_BASE_URL}/api/hotel/hotels/${hotelId}/reject`, {
      method: 'POST', headers: jsonHeaders(authHeaders()), body: JSON.stringify({ approve: false, note }),
    });
  },

  // Activate a hotel
  activateHotel: async (hotelId: string): Promise<void> => {
    await hotelRequest(`${API_BASE_URL}/api/hotel/hotels/${hotelId}/activate`, { method: 'PATCH', headers: jsonHeaders(authHeaders()) });
  },

  // Deactivate a hotel
  deactivateHotel: async (hotelId: string): Promise<void> => {
    await hotelRequest(`${API_BASE_URL}/api/hotel/hotels/${hotelId}/deactivate`, { method: 'PUT', headers: jsonHeaders(authHeaders()) });
  },

  // Update hotel information
  updateHotel: async (hotelId: string, data: {
    name: string;
    description: string;
    starRating: number;
    cityId: string;
    address: HotelAddress;
    contactEmail?: string;
    contactPhone?: string;
    businessLicenseNumber?: string;
    taxId?: string;
    operationLicenseNumber?: string;
    ownerIdentityNumber?: string;
  }): Promise<Hotel> => {
    const response = await hotelRequest(`${API_BASE_URL}/api/hotel/hotels/${hotelId}`, {
      method: 'PUT', headers: jsonHeaders(authHeaders()), body: JSON.stringify(data),
    });
    return cleanHotelData(await hotelJson(response));
  },

  updateAmenities: async (hotelId: string, amenityCategories: unknown[]): Promise<Hotel> =>
    cleanHotelData(await updateHotelContent(hotelId,'amenities',amenityCategories,authHeaders())),

  getAmenityCategories: async (): Promise<AmenityCategoryOption[]> => {
    const data=await readJson(`${API_BASE_URL}/api/hotel/hotels/amenities/categories`);
    return readArray<AmenityCategoryOption>(data,row=>typeof row.type==='string'&&!!row.type.trim()&&row.type.length<=255);
  },

  getPolicyCategories: async (): Promise<{type:string}[]> => {
    const data=await readJson(`${API_BASE_URL}/api/hotel/hotels/policies/categories`);
    return readArray<{type:string}>(data,row=>typeof row.type==='string'&&!!row.type.trim()&&row.type.length<=255);
  },

  updatePolicies: async (hotelId: string, policies: { title?: string; category?: string; content: string }[]): Promise<Hotel> =>
    cleanHotelData(await updateHotelContent(hotelId,'policies',policies,authHeaders())),

  updateQuestions: async (hotelId: string, faqs: { question: string; answer: string }[]): Promise<Hotel> =>
    cleanHotelData(await updateHotelContent(hotelId,'questions',faqs,authHeaders())),

  // Get all cities
  getCities: async (): Promise<City[]> => {
    const data = await readJson(`${API_BASE_URL}/api/hotel/cities`);
    if (!Array.isArray(data)) throw new ReadApiError('INVALID_RESPONSE');
    return data as City[];
  },

  // Upload media (image) for hotel or room
  uploadMedia: async (targetId:string,targetType:'HOTEL'|'ROOM_TYPE',file:File,isThumbnail=false,sortOrder=0):Promise<MediaAsset> =>
    writeMedia({targetId,targetType},file,isThumbnail,sortOrder,authHeaders()),

  // Private document requests share a deadline and never expose upstream errors.
  uploadHotelDocuments: async (hotelId: string, formData: FormData): Promise<Record<string, unknown>> =>
    uploadHotelVerificationDocuments(hotelId,formData,authHeaders()),

  getHotelDocuments: async (hotelId: string): Promise<HotelVerificationDocuments> =>
    getHotelVerificationDocuments(hotelId,authHeaders()),

  // Submit hotel for approval (DRAFT -> PENDING). The legacy direct route is tried only when the
  // Gateway route is absent (404), never after a timeout or an ambiguous failure.
  submitHotelApproval: async (hotelId: string): Promise<Hotel> => {
    // Single attempt: a 404 is a real "hotel not found", never a reason to replay the write on another route.
    const response = await bookingFetch(`${API_BASE_URL}/api/hotel/hotels/${hotelId}/submit-approval`,
      { method: 'POST', headers: jsonHeaders(authHeaders()) });
    if (!response.ok) throw await responseError(response);
    return await hotelJson(response) as Hotel;
  },

  // Delete draft hotel (DRAFT only)
  deleteDraftHotel: async (hotelId:string):Promise<void> => deleteDraft(hotelId,authHeaders()),

  getMediaPreview: async (targetId:string,targetType:'HOTEL'|'ROOM_TYPE'):Promise<MediaAsset[]> =>
    previewMedia({targetId,targetType},authHeaders()),

  deleteMedia: async (mediaId:string):Promise<void> => removeMedia(mediaId,authHeaders()),

  setThumbnail: async (mediaId:string,target?:{targetId:string;targetType:'HOTEL'|'ROOM_TYPE'}):Promise<MediaAsset> =>
    selectThumbnail(mediaId,authHeaders(),target),

  async getRoomTypePreview(roomTypeId: string, token: string): Promise<RoomType> {
    if (!token?.trim()) throw new Error('Vui lòng đăng nhập để xem loại phòng.');
    const response = await bookingFetch(`${API_BASE_URL}/api/hotel/api/v1/${roomTypeId}/preview`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!response.ok) throw new Error(`Không thể xem loại phòng: ${response.status}`);
    return cleanRoomTypeData(await hotelJson(response));
  },

  // Room Type APIs
  getRoomTypeById: async (roomTypeId: string): Promise<RoomType> =>
    cleanRoomTypeData(await readJson(`${API_BASE_URL}/api/hotel/api/v1/${roomTypeId}`, { headers: jsonHeaders(authHeaders()) })),

  createRoomType: async (data: {
    hotelId: string;
    name: string;
    basePrice: number;
    capacity: CapacityDto;
    roomAmount: number;
    description?: string;
    amenities?: string[];
  }): Promise<RoomType> => {
    const response = await hotelRequest(`${API_BASE_URL}/api/hotel/api/v1`, {
      method: 'POST', headers: jsonHeaders(authHeaders()), body: JSON.stringify(data),
    });
    return cleanRoomTypeData(await hotelJson(response));
  },

  updateRoomType: async (roomTypeId: string, data: {
    name?: string;
    basePrice?: number;
    capacity?: CapacityDto;
    amenities?: string[];
    isActive?: boolean;
    roomAmount?: number;
    description?: string;
  }): Promise<RoomType> => {
    const response = await hotelRequest(`${API_BASE_URL}/api/hotel/api/v1/${roomTypeId}`, {
      method: 'PUT', headers: jsonHeaders(authHeaders()), body: JSON.stringify(data),
    });
    return cleanRoomTypeData(await hotelJson(response));
  },

  activateRoomType: async (roomTypeId: string): Promise<void> => {
    await hotelRequest(`${API_BASE_URL}/api/hotel/api/v1/${roomTypeId}/activate`, { method: 'PUT', headers: jsonHeaders(authHeaders()) });
  },

  deactivateRoomType: async (roomTypeId: string): Promise<void> => {
    await hotelRequest(`${API_BASE_URL}/api/hotel/api/v1/${roomTypeId}/deactivate`, { method: 'PUT', headers: jsonHeaders(authHeaders()) });
  },
};

const authHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default hotelApi;

export interface Address {
  street: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface PendingHotel {
  id: string;
  name: string;
  description: string;
  starRating?: number;
  address: Address;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  approvedStatus: HotelApprovalStatus | string;
  owner: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
}

export interface PendingHotelDetail {
  accommodationTypeLabel?: string | null;
  revision: number;
  accommodationType?: import("./accommodation-types").AccommodationType | null;
  id: string;
  name: string;
  description: string;
  starRating?: number;
  address: Address;
  contactEmail: string;
  contactPhone: string;
  createdAt: string;
  approvedStatus: HotelApprovalStatus | string;
  owner: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  businessLicenseNumber?: string;
  taxId?: string;
  operationLicenseNumber?: string;
  ownerIdentityNumber?: string;
  businessLicenseUrl?: string;
  operationLicenseUrl?: string;
  ownerIdentityFrontUrl?: string;
  ownerIdentityBackUrl?: string;
  policies?: PolicyResponse[];
  amenityCategories?: AmenityResponse[];
  faqs?: Array<QuestionResponse & { id?: string }>;
  mediaAssets?: MediaAsset[];
}

export interface HotelVerificationDocuments {
  hotelId: string;
  approvedStatus: HotelApprovalStatus | string;
  rejectionReason?: string;
  businessLicenseNumber?: string;
  taxId?: string;
  operationLicenseNumber?: string;
  ownerIdentityNumber?: string;
  businessLicenseUrl?: string;
  operationLicenseUrl?: string;
  ownerIdentityFrontUrl?: string;
  ownerIdentityBackUrl?: string;
}

export type { ReviewStats } from './reviews';


/** Only hotel-specific coordinates may be presented as a hotel pin or distance origin. */
export function hotelCoordinates(address?: HotelAddress | null) {
  const validSource = address?.coordinateSource === 'OWNER_PROVIDED' || address?.coordinateSource === 'GEOCODED';
  if (!validSource || !Number.isFinite(address?.latitude) || !Number.isFinite(address?.longitude)
      || Math.abs(address!.latitude!) > 90 || Math.abs(address!.longitude!) > 180) return {};
  return { latitude: address!.latitude, longitude: address!.longitude };
}
