import type {MediaAsset} from './hotels.ts';
import {MediaWriteError} from './media-write.ts';

export function nextMediaOrder(assets:MediaAsset[]):number {
 return Math.max(-1,...assets.map(asset=>Number.isInteger(asset.sortOrder)?asset.sortOrder!:-1))+1;
}
export function appendMedia(assets:MediaAsset[],ack:MediaAsset):MediaAsset[]{
 return [...assets.map(asset=>ack.isThumbnail?{...asset,isThumbnail:false}:asset),ack];
}
export function selectMedia(assets:MediaAsset[],ack:MediaAsset):MediaAsset[]{
 return assets.map(asset=>asset.id===ack.id?{...asset,...ack}:{...asset,isThumbnail:false});
}
export function removeMedia(assets:MediaAsset[],id:string):MediaAsset[]{
 const order=assets.find(asset=>asset.id===id)?.sortOrder;
 return assets.filter(asset=>asset.id!==id).map(asset=>
  order!=null&&asset.sortOrder!=null&&asset.sortOrder>order?{...asset,sortOrder:asset.sortOrder-1}:asset);
}
export const mediaNeedsReload=(error:unknown):boolean=>!(error instanceof MediaWriteError)
 ||error.uncertain||error.status===404||error.status===409;
export const mediaErrorMessage=(error:unknown):string=>error instanceof MediaWriteError?error.message:new MediaWriteError(null).message;

export function orderMedia(assets:MediaAsset[]):MediaAsset[]{
 return [...assets].sort((a,b)=>Number(Boolean(b.isThumbnail))-Number(Boolean(a.isThumbnail))
  ||(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0));
}
