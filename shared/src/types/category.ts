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

