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
  ModuleType,
  SubLineItemType,
  CreateSubLineItemTypeInput,
  UpdateSubLineItemTypeInput,
  Comment,
  CreateCommentInput,
  UpdateCommentInput,
} from '@event-management/shared';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Events
export const eventsApi = {
  getAll: () => api.get<Event[]>('/events'),
  getById: (id: string) => api.get<Event>(`/events/${id}`),
  create: (data: CreateEventInput) => api.post<Event>('/events', data),
  update: (id: string, data: UpdateEventInput) => api.put<Event>(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
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
  getSummary: (eventId: string) => api.get<FinanceSummary>(`/finance/${eventId}`),
  getLineItems: (eventId: string) => api.get<FinanceLineItem[]>(`/finance/${eventId}/line-items`),
};

// Sub-Line Item Types (global metadata - no eventId required)
export const subLineItemTypesApi = {
  getByModule: (moduleType: ModuleType) =>
    api.get<SubLineItemType[]>(`/sub-line-item-types/${moduleType}`),
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

