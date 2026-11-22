import type {
  LikeState, PlaceRating, PostInput, ReportGroup, ReportReason, ReportTargetType,
  SocialComment, SocialPage, SocialPost, UploadedMedia,
} from '../../types/social.ts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const BASE = `${API_BASE_URL}/api/social`;

export type SocialErrorCode =
  | 'VALIDATION' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'RATE_LIMITED'
  | 'UNAVAILABLE' | 'NETWORK' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'UNKNOWN';

const MESSAGES: Record<SocialErrorCode, string> = {
  VALIDATION: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.',
  UNAUTHORIZED: 'Vui lòng đăng nhập để tiếp tục.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  NOT_FOUND: 'Nội dung không còn tồn tại.',
  CONFLICT: 'Nội dung vừa thay đổi. Hãy tải lại rồi thử lại.',
  RATE_LIMITED: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
  UNAVAILABLE: 'Dịch vụ đang tạm gián đoạn. Vui lòng thử lại sau.',
  NETWORK: 'Không thể kết nối. Vui lòng thử lại.',
  TIMEOUT: 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.',
  INVALID_RESPONSE: 'Dữ liệu trả về không hợp lệ. Vui lòng thử lại.',
  UNKNOWN: 'Không thể xử lý yêu cầu lúc này.',
};

const FIELD_MESSAGES: Record<string, string> = {
  body: 'Nội dung chưa hợp lệ.',
  rating: 'Điểm đánh giá chưa hợp lệ.',
  placeId: 'Địa điểm đã chọn không tồn tại.',
  mediaIds: 'Ảnh không hợp lệ hoặc đã được dùng cho bài khác.',
  file: 'Ảnh không hợp lệ. Chỉ nhận JPEG, PNG hoặc WebP tối đa 5 MB.',
  note: 'Ghi chú chưa hợp lệ.',
  q: 'Từ khóa tìm kiếm chưa hợp lệ.',
  cursor: 'Không thể tải trang tiếp theo. Hãy tải lại.',
  limit: 'Số lượng mỗi trang chưa hợp lệ.',
};

export class SocialApiError extends Error {
  readonly code: SocialErrorCode;
  readonly status: number;
  readonly fields: Record<string, string>;
  constructor(code: SocialErrorCode, status = 0, fields: Record<string, string> = {}) {
    super(Object.values(fields)[0] ?? MESSAGES[code]);
    this.name = 'SocialApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

const STATUS_CODES: Record<number, SocialErrorCode> = {
  400: 'VALIDATION', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'CONFLICT',
  413: 'VALIDATION', 429: 'RATE_LIMITED', 502: 'UNAVAILABLE', 503: 'UNAVAILABLE', 504: 'TIMEOUT',
};

/** Server messages are English and may change; only the field names are trusted, and shown in Vietnamese. */
async function toError(response: Response): Promise<SocialApiError> {
  const fields: Record<string, string> = {};
  try {
    const body: unknown = await response.json();
    const raw = body && typeof body === 'object' ? (body as { fields?: unknown }).fields : null;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      for (const key of Object.keys(raw)) if (FIELD_MESSAGES[key]) fields[key] = FIELD_MESSAGES[key];
    }
  } catch { /* An empty or non-JSON error body still maps by status. */ }
  return new SocialApiError(STATUS_CODES[response.status] ?? (response.status >= 500 ? 'UNAVAILABLE' : 'UNKNOWN'), response.status, fields);
}

interface RequestOptions {
  method?: string;
  token?: string | null;
  json?: unknown;
  form?: FormData;
  timeoutMs?: number;
}

async function send(path: string, { method = 'GET', token, json, form, timeoutMs = 15000 }: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json !== undefined) headers['Content-Type'] = 'application/json';
  try {
    return await fetch(`${BASE}${path}`, {
      method, headers, cache: 'no-store',
      body: form ?? (json !== undefined ? JSON.stringify(json) : undefined),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const timedOut = error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name);
    throw new SocialApiError(timedOut ? 'TIMEOUT' : 'NETWORK');
  }
}

async function parse<T>(response: Response, valid: (data: unknown) => boolean): Promise<T> {
  if (!response.ok) throw await toError(response);
  let data: unknown;
  try { data = await response.json(); } catch { throw new SocialApiError('INVALID_RESPONSE', response.status); }
  if (!valid(data)) throw new SocialApiError('INVALID_RESPONSE', response.status);
  return data as T;
}

/**
 * Public reads work without a token. A stale token must not block browsing, so a 401
 * is retried once anonymously; the caller simply gets the anonymous view.
 */
async function publicRead<T>(path: string, token: string | null | undefined, valid: (data: unknown) => boolean): Promise<T> {
  const first = await send(path, { token });
  if (first.status === 401 && token) return parse<T>(await send(path), valid);
  return parse<T>(first, valid);
}

const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

function isPost(value: unknown): boolean {
  return isObject(value) && isText(value.id) && typeof value.body === 'string' && isObject(value.author) && isText(value.author.id)
    && value.source === 'COMMUNITY' && value.verified === false && Array.isArray(value.media)
    && (value.rating === null || (Number.isInteger(value.rating) && (value.rating as number) >= 1 && (value.rating as number) <= 5))
    && Number.isInteger(value.likeCount) && Number.isInteger(value.commentCount) && isText(value.createdAt);
}

function isComment(value: unknown): boolean {
  return isObject(value) && isText(value.id) && isText(value.postId) && typeof value.body === 'string'
    && isObject(value.author) && isText(value.author.id) && isText(value.createdAt);
}

function isPageOf(item: (value: unknown) => boolean) {
  return (value: unknown) => isObject(value) && Array.isArray(value.items) && value.items.every(item)
    && (value.nextCursor === null || isText(value.nextCursor));
}

const isLikeState = (value: unknown) => isObject(value) && Number.isInteger(value.likeCount) && typeof value.likedByMe === 'boolean';

function query(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== null && value !== undefined && value !== '') search.set(key, String(value));
  const text = search.toString();
  return text ? `?${text}` : '';
}

const id = (value: string) => encodeURIComponent(value);

export interface PageParams {
  cursor?: string | null;
  limit?: number;
}

export const socialApi = {
  feed: (params: PageParams & { placeId?: string | null } = {}, token?: string | null) =>
    publicRead<SocialPage<SocialPost>>(`/posts${query({ placeId: params.placeId, cursor: params.cursor, limit: params.limit })}`, token, isPageOf(isPost)),

  search: (q: string, params: PageParams = {}, token?: string | null) =>
    publicRead<SocialPage<SocialPost>>(`/posts/search${query({ q: q.trim(), cursor: params.cursor, limit: params.limit })}`, token, isPageOf(isPost)),

  post: (postId: string, token?: string | null) => publicRead<SocialPost>(`/posts/${id(postId)}`, token, isPost),

  comments: (postId: string, params: PageParams = {}, token?: string | null) =>
    publicRead<SocialPage<SocialComment>>(`/posts/${id(postId)}/comments${query({ cursor: params.cursor, limit: params.limit })}`, token, isPageOf(isComment)),

  placeRating: (placeId: string) =>
    publicRead<PlaceRating>(`/places/${id(placeId)}/rating`, null,
      value => isObject(value) && Number.isInteger(value.count) && (value.average === null || typeof value.average === 'number')),

  myPosts: async (token: string, params: PageParams = {}) =>
    parse<SocialPage<SocialPost>>(await send(`/me/posts${query({ cursor: params.cursor, limit: params.limit })}`, { token }), isPageOf(isPost)),

  /** One of the caller's own posts, including a hidden one. 404 for anyone else's post. */
  myPost: async (token: string, postId: string) =>
    parse<SocialPost>(await send(`/me/posts/${id(postId)}`, { token }), isPost),

  createPost: async (token: string, input: PostInput) =>
    parse<SocialPost>(await send('/posts', { method: 'POST', token, json: input }), isPost),

  updatePost: async (token: string, postId: string, input: PostInput) =>
    parse<SocialPost>(await send(`/posts/${id(postId)}`, { method: 'PUT', token, json: input }), isPost),

  deletePost: async (token: string, postId: string): Promise<void> => {
    const response = await send(`/posts/${id(postId)}`, { method: 'DELETE', token });
    if (!response.ok) throw await toError(response);
  },

  like: async (token: string, postId: string) =>
    parse<LikeState>(await send(`/posts/${id(postId)}/like`, { method: 'PUT', token }), isLikeState),

  unlike: async (token: string, postId: string) =>
    parse<LikeState>(await send(`/posts/${id(postId)}/like`, { method: 'DELETE', token }), isLikeState),

  addComment: async (token: string, postId: string, body: string) =>
    parse<SocialComment>(await send(`/posts/${id(postId)}/comments`, { method: 'POST', token, json: { body } }), isComment),

  deleteComment: async (token: string, commentId: string): Promise<void> => {
    const response = await send(`/comments/${id(commentId)}`, { method: 'DELETE', token });
    if (!response.ok) throw await toError(response);
  },

  report: async (token: string, targetType: ReportTargetType, targetId: string, reason: ReportReason, note?: string): Promise<void> => {
    const response = await send('/reports', { method: 'POST', token, json: { targetType, targetId, reason, note: note?.trim() || null } });
    if (!response.ok) throw await toError(response);
  },

  uploadPhoto: async (token: string, file: Blob, fileName = 'photo') => {
    const form = new FormData();
    form.append('file', file, fileName);
    return parse<UploadedMedia>(await send('/media', { method: 'POST', token, form, timeoutMs: 60000 }),
      value => isObject(value) && isText(value.id) && isText(value.url));
  },

  admin: {
    openReports: async (token: string, limit = 50) =>
      parse<ReportGroup[]>(await send(`/admin/reports${query({ limit })}`, { token }),
        value => Array.isArray(value) && value.every(group => isObject(group) && isText(group.targetId) && Array.isArray(group.reports))),

    closeReports: async (token: string, targetType: ReportTargetType, targetId: string, outcome: 'RESOLVED' | 'DISMISSED'): Promise<void> => {
      const response = await send('/admin/reports/close', { method: 'POST', token, json: { targetType, targetId, outcome } });
      if (!response.ok) throw await toError(response);
    },

    moderate: async (token: string, targetType: ReportTargetType, targetId: string, action: 'hide' | 'restore', reason?: string): Promise<void> => {
      const segment = targetType === 'POST' ? 'posts' : 'comments';
      const response = await send(`/admin/${segment}/${id(targetId)}/${action}`, { method: 'POST', token, json: { reason: reason?.trim() || null } });
      if (!response.ok) throw await toError(response);
    },
  },
};
