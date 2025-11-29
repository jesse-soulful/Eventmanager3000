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

// Statuses
export const statusesApi = {
  getByModule: (eventId: string, moduleType: ModuleType) =>
    api.get<Status[]>(`/statuses/${eventId}/${moduleType}`),
  create: (data: CreateStatusInput) => api.post<Status>('/statuses', data),
  update: (id: string, data: UpdateStatusInput) => api.put<Status>(`/statuses/${id}`, data),
  delete: (id: string) => api.delete(`/statuses/${id}`),
};

// Categories
export const categoriesApi = {
  getByModule: (eventId: string, moduleType: ModuleType) =>
    api.get<Category[]>(`/categories/${eventId}/${moduleType}`),
  create: (data: CreateCategoryInput) => api.post<Category>('/categories', data),
  update: (id: string, data: UpdateCategoryInput) => api.put<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Tags
export const tagsApi = {
  getByModule: (eventId: string, moduleType: ModuleType) =>
    api.get<Tag[]>(`/tags/${eventId}/${moduleType}`),
  create: (data: CreateTagInput) => api.post<Tag>('/tags', data),
  update: (id: string, data: UpdateTagInput) => api.put<Tag>(`/tags/${id}`, data),
  delete: (id: string) => api.delete(`/tags/${id}`),
};

// Finance
export const financeApi = {
  getSummary: (eventId: string) => api.get<FinanceSummary>(`/finance/${eventId}`),
  getLineItems: (eventId: string) => api.get<FinanceLineItem[]>(`/finance/${eventId}/line-items`),
};

// Sub-Line Item Types
export const subLineItemTypesApi = {
  getByModule: (eventId: string, moduleType: ModuleType) =>
    api.get<SubLineItemType[]>(`/sub-line-item-types/${eventId}/${moduleType}`),
  create: (data: CreateSubLineItemTypeInput) => api.post<SubLineItemType>('/sub-line-item-types', data),
  update: (id: string, data: UpdateSubLineItemTypeInput) => api.put<SubLineItemType>(`/sub-line-item-types/${id}`, data),
  delete: (id: string) => api.delete(`/sub-line-item-types/${id}`),
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

