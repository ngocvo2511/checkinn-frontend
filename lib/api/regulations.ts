const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const MIN_VALUE = 0;
const MAX_VALUE = 999999.99;

export interface Regulation {
  regulationKey: string;
  name: string;
  value: string;
  description?: string;
  active: boolean;
  version: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export const validateRegulationValue = (value: string): ValidationError | null => {
  if (!value || value.trim() === '') {
    return { field: 'value', message: 'Giá trị không được để trống' };
  }

  const trimmedValue = value.trim();
  const numValue = Number(trimmedValue);

  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmedValue) || !Number.isFinite(numValue)) {
    return { field: 'value', message: 'Giá trị phải là một số hợp lệ' };
  }

  if (numValue < MIN_VALUE) {
    return { field: 'value', message: `Giá trị không được âm (tối thiểu: ${MIN_VALUE})` };
  }

  if (numValue > MAX_VALUE) {
    return { field: 'value', message: `Giá trị không được vượt quá ${MAX_VALUE}` };
  }

  return null;
};

export const validateRegulation = (regulation: Regulation): ValidationError | null => {
  if (!regulation.name || regulation.name.trim() === '') {
    return { field: 'name', message: 'Tên quy định không được để trống' };
  }

  return validateRegulationValue(regulation.value);
};

export interface RegulationSnapshot {
  regulationKey: string;
  regulationName: string;
  version: number;
  sourceUser?: string;
  appliedAt: string;
  snapshotData: string;
}

const buildHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

export const regulationsApi = {
  getRegulations: async (token?: string): Promise<Regulation[]> => {
    const response = await request('/api/regulations', {
      headers: buildHeaders(token),
    });

    const data:unknown=await readJson(response);
    if(!Array.isArray(data) || !data.every(isRegulation))throw new RegulationApiError(null);
    return data;
  },

  saveRegulation: async (key: string, regulation: Regulation, token?: string): Promise<Regulation> => {
    if(key!==regulation.regulationKey || validateRegulation(regulation))throw new RegulationApiError(400);
    const response = await request(`/api/regulations/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: buildHeaders(token),
      body: JSON.stringify(regulation),
    });

    const data:unknown=await readJson(response);
    if(!isRegulation(data) || data.regulationKey!==key)throw new RegulationApiError(null);
    return data;
  },

  getSnapshots: async (token?: string): Promise<RegulationSnapshot[]> => {
    const response = await request('/api/regulations/snapshots', {
      headers: buildHeaders(token),
    });

    const data:unknown=await readJson(response);
    if(!Array.isArray(data) || !data.every(isSnapshot))throw new RegulationApiError(null);
    return data;
  },
};

export class RegulationApiError extends Error {
  readonly status:number|null;
  constructor(status:number|null) {
    super(status===409?'Quy định đã được thay đổi. Hãy tải lại dữ liệu trước khi lưu.'
      :status===401?'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      :status===403?'Bạn không có quyền quản lý quy định.'
      :status===400?'Dữ liệu quy định không hợp lệ.'
      :'Không thể tải hoặc lưu quy định. Vui lòng thử lại.');
    this.name='RegulationApiError';this.status=status;
  }
}
async function request(path:string,options:RequestInit):Promise<Response> {
  try {
    const response=await fetch(API_BASE_URL+path,{...options,signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new RegulationApiError(response.status);
    return response;
  }catch(error){throw error instanceof RegulationApiError?error:new RegulationApiError(null);}
}
async function readJson(response:Response):Promise<unknown> {
  try{return await response.json();}catch{throw new RegulationApiError(null);}
}
function isRegulation(value:unknown):value is Regulation {
  if(!value || typeof value!=='object')return false;
  const row=value as Regulation;
  return typeof row.regulationKey==='string' && row.regulationKey.length>0 && typeof row.name==='string'
    && typeof row.value==='string' && typeof row.active==='boolean' && Number.isInteger(row.version) && row.version>0
    && (row.description==null || typeof row.description==='string');
}
function isSnapshot(value:unknown):value is RegulationSnapshot {
  if(!value || typeof value!=='object')return false;
  const row=value as RegulationSnapshot;
  return typeof row.regulationKey==='string' && typeof row.regulationName==='string' && Number.isInteger(row.version)
    && row.version>0 && typeof row.appliedAt==='string' && typeof row.snapshotData==='string'
    && (row.sourceUser==null || typeof row.sourceUser==='string');
}
