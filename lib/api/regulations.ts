const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8090';
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
  const numValue = parseFloat(trimmedValue);

  if (isNaN(numValue)) {
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
    const response = await fetch(`${API_BASE_URL}/api/regulations`, {
      headers: buildHeaders(token),
    });

    if (!response.ok) {
      throw new Error('Unable to fetch regulations');
    }

    return response.json();
  },

  saveRegulation: async (key: string, regulation: Regulation, token?: string): Promise<Regulation> => {
    const response = await fetch(`${API_BASE_URL}/api/regulations/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: buildHeaders(token),
      body: JSON.stringify(regulation),
    });

    if (!response.ok) {
      throw new Error('Unable to save regulation');
    }

    return response.json();
  },

  getSnapshots: async (token?: string): Promise<RegulationSnapshot[]> => {
    const response = await fetch(`${API_BASE_URL}/api/regulations/snapshots`, {
      headers: buildHeaders(token),
    });

    if (!response.ok) {
      throw new Error('Unable to fetch regulation snapshots');
    }

    return response.json();
  },
};
