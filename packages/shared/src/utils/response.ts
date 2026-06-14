export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export function successResponse<T>(
  message: string,
  data: T,
  meta?: ApiResponse<T>['meta']
): ApiResponse<T> {
  return { success: true, message, data, meta };
}

export function errorResponse(message: string): ApiResponse<null> {
  return { success: false, message, data: null };
}
