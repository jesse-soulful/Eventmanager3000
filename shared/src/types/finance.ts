import { ModuleType } from '../utils/constants';

export interface FinanceFilters {
  eventIds?: string[];
  startDate?: Date;
  endDate?: Date;
  moduleTypes?: ModuleType[];
  includeSubItems?: boolean;
}

export interface FinanceGrouping {
  groupBy?: ('event' | 'module' | 'category' | 'status' | 'lineItem')[];
}

export interface FinanceSummary {
  eventId?: string; // Optional for cross-event summaries
  totalEstimated: number; // Sum of plannedCost
  totalActual: number; // Sum of actualCost
  totalBudget: number; // Legacy: sum of totalPrice (fallback)
  totalSpent: number; // Legacy: status-based (for backward compatibility)
  totalCommitted: number; // Legacy: status-based (for backward compatibility)
  remaining: number;
  variance: number; // Difference between estimated and actual
  byModule: ModuleFinanceSummary[];
  byCategory: CategoryFinanceSummary[];
  byStatus: StatusFinanceSummary[];
  byEvent?: EventFinanceSummary[]; // For cross-event summaries
}

export interface EventFinanceSummary {
  eventId: string;
  eventName: string;
  startDate: Date;
  endDate: Date;
  totalEstimated: number;
  totalActual: number;
  variance: number;
  lineItemCount: number;
}

export interface ModuleFinanceSummary {
  moduleType: ModuleType;
  moduleName: string;
  budget: number; // Legacy
  spent: number; // Legacy
  committed: number; // Legacy
  remaining: number; // Legacy
  totalEstimated: number; // Sum of plannedCost
  totalActual: number; // Sum of actualCost
  variance: number; // Difference between estimated and actual
  lineItemCount: number;
}

export interface CategoryFinanceSummary {
  categoryId: string;
  categoryName: string;
  amount: number; // Legacy: totalPrice
  totalEstimated: number; // Sum of plannedCost
  totalActual: number; // Sum of actualCost
  variance: number;
  lineItemCount: number;
}

export interface StatusFinanceSummary {
  statusId: string;
  statusName: string;
  amount: number; // Legacy: totalPrice
  totalEstimated: number; // Sum of plannedCost
  totalActual: number; // Sum of actualCost
  variance: number;
  lineItemCount: number;
}

export interface FinanceLineItem {
  id: string;
  eventId: string;
  eventName?: string; // For cross-event views
  moduleType: ModuleType;
  moduleName: string;
  lineItemName: string;
  categoryName?: string;
  statusName?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number; // Legacy fallback
  plannedCost?: number; // Estimated cost
  actualCost?: number; // Actual cost
  variance?: number; // Difference between plannedCost and actualCost
  isSubLineItem: boolean; // Flag to distinguish sub-items
  parentLineItemId?: string; // Reference to parent if sub-item
  parentLineItemName?: string; // Parent name for display
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
