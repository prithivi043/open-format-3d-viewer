export interface ApiMeta {
  request_id: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorResponse {
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  detail?: unknown;
}
