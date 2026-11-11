'use client';
import type {ReactNode} from 'react';
export function VerificationDocumentBoundary({loading,error,onRetry,children}:{loading:boolean;error:string|null;onRetry:()=>void;children:ReactNode}) {
 if(loading)return <p role="status">Đang tải hồ sơ tài liệu...</p>;
 if(error)return <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
  <p>{error}</p><p>Chưa thể xác định tài liệu đã tải lên.</p>
  <button type="button" onClick={onRetry} className="mt-3 rounded border border-amber-700 px-3 py-1">Thử tải lại hồ sơ</button>
 </div>;
 return <>{children}</>;
}
