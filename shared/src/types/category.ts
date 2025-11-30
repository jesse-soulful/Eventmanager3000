import { ModuleType } from '../utils/constants';

export interface Category {
  id: string;
  moduleType: ModuleType;
  name: string;
  description?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryInput {
  eventId?: string; // Optional - null/undefined means global metadata
  moduleType: ModuleType;
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  color?: string;
}


