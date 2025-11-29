import { ModuleType } from '../utils/constants';

export interface BaseModule {
  id: string;
  eventId: string;
  moduleType: ModuleType;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModuleWithLineItems extends BaseModule {
  lineItems: any[]; // Will be typed based on module type
}


