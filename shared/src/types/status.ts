import { ModuleType } from '../utils/constants';

export interface Status {
  id: string;
  moduleType: ModuleType;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStatusInput {
  moduleType: ModuleType;
  name: string;
  color: string;
  order: number;
  isDefault?: boolean;
}

export interface UpdateStatusInput {
  name?: string;
  color?: string;
  order?: number;
  isDefault?: boolean;
}


