import { ModuleType } from '../utils/constants';

export type StatusItemType = 'main' | 'sub';

export interface Status {
  id: string;
  moduleType: ModuleType;
  name: string;
  color: string;
  order: number;
  isDefault: boolean;
  itemType: StatusItemType; // 'main' for main line items, 'sub' for sub-line items
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStatusInput {
  eventId?: string; // Optional - null/undefined means global metadata
  moduleType: ModuleType;
  name: string;
  color: string;
  order: number;
  isDefault?: boolean;
  itemType?: StatusItemType; // Defaults to 'main' if not provided
}

export interface UpdateStatusInput {
  name?: string;
  color?: string;
  order?: number;
  isDefault?: boolean;
  itemType?: StatusItemType;
}


