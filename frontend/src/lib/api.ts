import axios from 'axios';
import type {
  Event,
  CreateEventInput,
  UpdateEventInput,
  LineItem,
  CreateLineItemInput,
  UpdateLineItemInput,
  Status,
  CreateStatusInput,
  UpdateStatusInput,
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  Tag,
  CreateTagInput,
  UpdateTagInput,
  FinanceSummary,
  FinanceLineItem,
  FinanceFilters,
  ModuleType,
  SubLineItemType,
  CreateSubLineItemTypeInput,
  UpdateSubLineItemTypeInput,
  Comment,
  CreateCommentInput,
  UpdateCommentInput,
  User,
  UpdateUserInput,
} from '@event-management/shared';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      // Only redirect if not already on login/signup page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Events
export const eventsApi = {
  getAll: () => api.get<Event[]>('/events'),
  getById: (id: string) => api.get<Event>(`/events/${id}`),
  create: (data: CreateEventInput) => api.post<Event>('/events', data),
  update: (id: string, data: UpdateEventInput) => api.put<Event>(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  uploadBanner: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('banner', file);
    return api.post<{ bannerImageUrl: string }>(`/events/${id}/banner`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteBanner: (id: string) => api.delete(`/events/${id}/banner`),
};

// Line Items
export const lineItemsApi = {
  getByEvent: (eventId: string) => api.get<LineItem[]>(`/line-items/event/${eventId}`),
  getById: (id: string) => api.get<LineItem>(`/line-items/${id}`),
  create: (data: CreateLineItemInput) => api.post<LineItem>('/line-items', data),
  update: (id: string, data: UpdateLineItemInput) => api.put<LineItem>(`/line-items/${id}`, data),
  delete: (id: string) => api.delete(`/line-items/${id}`),
};

// Modules
export const modulesApi = {
  getLineItems: (eventId: string, moduleType: ModuleType) =>
    api.get<LineItem[]>(`/modules/${eventId}/${moduleType}`),
  getGlobalModuleLineItems: (moduleType: ModuleType, eventId?: string) => {
    const url = `/modules/global/${moduleType}${eventId ? `?eventId=${eventId}` : ''}`;
    return api.get<LineItem[]>(url);
  },
};

// Statuses (global metadata - no eventId required)
export const statusesApi = {
  getByModule: (moduleType: ModuleType, itemType?: 'main' | 'sub') => {
    const url = `/statuses/${moduleType}${itemType ? `?itemType=${itemType}` : ''}`;
    return api.get<Status[]>(url);
  },
  create: (data: CreateStatusInput) => {
    console.log('🔵 statusesApi.create called with:', data);
    const result = api.post<Status>('/statuses', data);
    result.then(res => {
      console.log('🔵 statusesApi.create response:', res.data);
    }).catch(err => {
      console.error('🔵 statusesApi.create error:', err);
    });
    return result;
  },
  update: (id: string, data: UpdateStatusInput) => api.put<Status>(`/statuses/${id}`, data),
  delete: (id: string) => api.delete(`/statuses/${id}`),
};

// Categories (global metadata - no eventId required)
export const categoriesApi = {
  getByModule: (moduleType: ModuleType) =>
    api.get<Category[]>(`/categories/${moduleType}`),
  create: (data: CreateCategoryInput) => api.post<Category>('/categories', data),
  update: (id: string, data: UpdateCategoryInput) => api.put<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Tags (global metadata - no eventId required)
export const tagsApi = {
  getByModule: (moduleType: ModuleType) =>
    api.get<Tag[]>(`/tags/${moduleType}`),
  create: (data: CreateTagInput) => api.post<Tag>('/tags', data),
  update: (id: string, data: UpdateTagInput) => api.put<Tag>(`/tags/${id}`, data),
  delete: (id: string) => api.delete(`/tags/${id}`),
};

// Finance
export const financeApi = {
  // Event-scoped methods (backward compatibility)
  getSummary: (eventId: string) => api.get<FinanceSummary>(`/finance/${eventId}`),
  getLineItems: (eventId: string) => api.get<FinanceLineItem[]>(`/finance/${eventId}/line-items`),
  // Cross-event methods with filters
  getCrossEventSummary: (filters?: FinanceFilters) => {
    const params = new URLSearchParams();
    if (filters?.eventIds && filters.eventIds.length > 0) {
      params.append('eventIds', filters.eventIds.join(','));
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate.toISOString());
    }
    if (filters?.moduleTypes && filters.moduleTypes.length > 0) {
      params.append('moduleTypes', filters.moduleTypes.join(','));
    }
    if (filters?.includeSubItems !== undefined) {
      params.append('includeSubItems', filters.includeSubItems.toString());
    }
    const queryString = params.toString();
    return api.get<FinanceSummary>(`/finance${queryString ? `?${queryString}` : ''}`);
  },
  getCrossEventLineItems: (filters?: FinanceFilters) => {
    const params = new URLSearchParams();
    if (filters?.eventIds && filters.eventIds.length > 0) {
      params.append('eventIds', filters.eventIds.join(','));
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate.toISOString());
    }
    if (filters?.moduleTypes && filters.moduleTypes.length > 0) {
      params.append('moduleTypes', filters.moduleTypes.join(','));
    }
    if (filters?.includeSubItems !== undefined) {
      params.append('includeSubItems', filters.includeSubItems.toString());
    }
    const queryString = params.toString();
    return api.get<FinanceLineItem[]>(`/finance/line-items${queryString ? `?${queryString}` : ''}`);
  },
};

// Sub-Line Item Types (global metadata - no eventId required)
export const subLineItemTypesApi = {
  getByModule: (moduleType: ModuleType, categoryId?: string) => {
    const params = categoryId ? `?categoryId=${categoryId}` : '';
    return api.get<SubLineItemType[]>(`/sub-line-item-types/${moduleType}${params}`);
  },
  create: (data: CreateSubLineItemTypeInput) => api.post<SubLineItemType>('/sub-line-item-types', data),
  update: (id: string, data: UpdateSubLineItemTypeInput) => api.put<SubLineItemType>(`/sub-line-item-types/${id}`, data),
  delete: (id: string) => api.delete(`/sub-line-item-types/${id}`),
};

// Comments
export const commentsApi = {
  getByLineItem: (lineItemId: string) => api.get<Comment[]>(`/comments/line-item/${lineItemId}`),
  create: (data: CreateCommentInput) => api.post<Comment>('/comments', data),
  update: (id: string, data: UpdateCommentInput) => api.put<Comment>(`/comments/${id}`, data),
  delete: (id: string) => api.delete(`/comments/${id}`),
};

// Documents
export const documentsApi = {
  upload: (lineItemId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('documents', file);
    });
    return api.post(`/documents/line-item/${lineItemId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getByLineItem: (lineItemId: string) => api.get(`/documents/line-item/${lineItemId}`),
  delete: (lineItemId: string, documentIndex: number) => api.delete(`/documents/line-item/${lineItemId}/${documentIndex}`),
};

// Users (admin only)
export const usersApi = {
  getAll: () => api.get<User[]>('/users'),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  update: (id: string, data: UpdateUserInput) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  // Profile management (own profile)
  updateProfile: (data: { name?: string | null; image?: string | null }) => api.put<User>('/users/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => 
    api.put<{ success: boolean; message: string }>('/users/profile/password', data),
  uploadProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append('picture', file);
    return api.post<{ image: string }>('/users/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

