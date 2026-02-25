/**
 * API 统一响应格式
 */

/**
 * 成功响应
 */
export interface ApiResponse<T = any> {
  success: true
  data: T
}

/**
 * 错误响应
 */
export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    details?: any
  }
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
