import { ModuleType } from '../utils/constants';

export interface FinanceSummary {
  eventId: string;
  totalBudget: number;
  totalSpent: number;
  totalCommitted: number;
  remaining: number;
  byModule: ModuleFinanceSummary[];
  byCategory: CategoryFinanceSummary[];
  byStatus: StatusFinanceSummary[];
}

export interface ModuleFinanceSummary {
  moduleType: ModuleType;
  moduleName: string;
  budget: number;
  spent: number;
  committed: number;
  remaining: number;
  lineItemCount: number;
}

export interface CategoryFinanceSummary {
  categoryId: string;
  categoryName: string;
  amount: number;
  lineItemCount: number;
}

export interface StatusFinanceSummary {
  statusId: string;
  statusName: string;
  amount: number;
  lineItemCount: number;
}

export interface FinanceLineItem {
  id: string;
  moduleType: ModuleType;
  moduleName: string;
  lineItemName: string;
  categoryName?: string;
  statusName: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
  date: Date;
}

