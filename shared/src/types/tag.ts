import { ModuleType } from '../utils/constants';

export interface Tag {
  id: string;
  moduleType: ModuleType;
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTagInput {
  moduleType: ModuleType;
  name: string;
  color?: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
}

