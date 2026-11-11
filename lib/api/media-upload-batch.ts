import {MediaWriteError} from './media-write.ts';

/** One wizard submission. Once a write fails, inspect the persisted draft before more uploads. */
export class MediaUploadBatch {
 private running=false;
 private complete=false;
 blocked=false;
 async run<T>(entries:readonly T[],upload:(entry:T,index:number)=>Promise<unknown>):Promise<void>{
  if(this.blocked)throw new MediaWriteError(null);
  if(this.running)throw new MediaWriteError(409);
  if(this.complete)return;
  this.running=true;
  try{
   for(const [index,entry] of [...entries].entries())await upload(entry,index);
   this.complete=true;
  }catch(error){this.blocked=true;throw error;}
  finally{this.running=false;}
 }
}
