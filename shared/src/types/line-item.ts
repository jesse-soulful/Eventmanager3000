import { Status } from './status';
import { Category } from './category';
import { Tag } from './tag';

export interface BaseLineItem {
  id: string;
  moduleId: string;
  eventId: string;
  name: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  status: Status;
  category?: Category;
  tags: Tag[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// LineItem as returned from API (matches Prisma schema)
export interface LineItem {
  id: string;
  moduleType: string;
  eventId: string;
  name: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  plannedCost?: number;
  actualCost?: number;
  metadata?: Record<string, any> | string;
  parentLineItemId?: string;
  parentLineItem?: LineItem;
  subLineItems?: LineItem[];
  statusId?: string;
  status?: Status;
  categoryId?: string;
  category?: Category;
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLineItemInput {
  moduleType: string;
  eventId: string;
  name: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  plannedCost?: number;
  actualCost?: number;
  statusId: string;
  categoryId?: string;
  tagIds?: string[];
  parentLineItemId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateLineItemInput {
  name?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  plannedCost?: number;
  actualCost?: number;
  statusId?: string;
  categoryId?: string;
  tagIds?: string[];
  parentLineItemId?: string;
  metadata?: Record<string, any>;
}

export interface SubLineItemType {
  id: string;
  moduleType: string;
  eventId?: string | null; // Optional - null means global metadata
  name: string;
  description?: string;
  isDefault: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubLineItemTypeInput {
  moduleType: string;
  eventId?: string; // Optional - null/undefined means global metadata
  name: string;
  description?: string;
  isDefault?: boolean;
  order?: number;
}

export interface UpdateSubLineItemTypeInput {
  name?: string;
  description?: string;
  isDefault?: boolean;
  order?: number;
}

