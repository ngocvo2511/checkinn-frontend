export type ReadErrorCode = 'VALIDATION' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'UPSTREAM' | 'NETWORK' | 'TIMEOUT' | 'INVALID_RESPONSE';

export class ReadApiError extends Error {
  readonly code: ReadErrorCode;
  readonly status?: number;
  constructor(code: ReadErrorCode, status?: number) {
    const messages: Record<ReadErrorCode, string> = {
      VALIDATION: 'Điều kiện tìm kiếm không hợp lệ.',
      UNAUTHORIZED: 'Vui lòng đăng nhập để tiếp tục.',
      FORBIDDEN: 'Bạn không có quyền truy cập dữ liệu này.',
      NOT_FOUND: 'Dữ liệu yêu cầu không còn tồn tại. Vui lòng tìm lại.',
      CONFLICT: 'Dữ liệu chưa sẵn sàng để kiểm tra. Vui lòng thử lại sau.',
      UPSTREAM: 'Không thể tải dữ liệu lúc này. Vui lòng thử lại.',
      NETWORK: 'Không thể kết nối. Vui lòng thử lại.',
      TIMEOUT: 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.',
      INVALID_RESPONSE: 'Dữ liệu trả về không hợp lệ. Vui lòng thử lại.',
    };
    super(messages[code]);
    this.name = 'ReadApiError';
    this.code = code;
    this.status = status;
  }
}

/** Bound both headers and body reads; never expose upstream error bodies. */
export async function readJson(url: string, timeoutOrOptions: number | RequestInit = 10000): Promise<unknown> {
  const timeoutMs = typeof timeoutOrOptions === 'number' ? timeoutOrOptions : 10000;
  const options = typeof timeoutOrOptions === 'number' ? {} : timeoutOrOptions;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' }, ...options, signal: controller.signal });
    if (!response.ok) {
      const code: ReadErrorCode = ({400:'VALIDATION',401:'UNAUTHORIZED',403:'FORBIDDEN',404:'NOT_FOUND',409:'CONFLICT',408:'TIMEOUT',504:'TIMEOUT'} as Record<number, ReadErrorCode>)[response.status] ?? 'UPSTREAM';
      throw new ReadApiError(code, response.status);
    }
    try { return await response.json(); }
    catch (error) {
      if (controller.signal.aborted || (error instanceof Error && ['AbortError','TimeoutError'].includes(error.name))) throw new ReadApiError('TIMEOUT');
      throw new ReadApiError('INVALID_RESPONSE');
    }
  } catch (error) {
    if (error instanceof ReadApiError) throw error;
    if (controller.signal.aborted || (error instanceof Error && ['AbortError','TimeoutError'].includes(error.name))) throw new ReadApiError('TIMEOUT');
    throw new ReadApiError('NETWORK');
  } finally { clearTimeout(timer); }
}

export function readArray<T>(data: unknown, valid: (item: T) => boolean): T[] {
  if (!Array.isArray(data) || !data.every(item => item && typeof item === 'object' && valid(item))) throw new ReadApiError('INVALID_RESPONSE');
  return data as T[];
}
