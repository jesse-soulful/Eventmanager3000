export enum ModuleType {
  // Event-scoped modules
  ARTISTS = 'ARTISTS',
  PRODUCTION = 'PRODUCTION',
  FOOD_BEVERAGE = 'FOOD_BEVERAGE',
  COMMUNICATION_MARKETING = 'COMMUNICATION_MARKETING',
  SPONSORS = 'SPONSORS',
  // Global modules
  VENDORS_SUPPLIERS = 'VENDORS_SUPPLIERS',
  MATERIALS_STOCK = 'MATERIALS_STOCK',
  STAFF_POOL = 'STAFF_POOL',
}

export const MODULE_DISPLAY_NAMES: Record<ModuleType, string> = {
  // Event-scoped modules
  [ModuleType.ARTISTS]: 'Artists',
  [ModuleType.PRODUCTION]: 'Production',
  [ModuleType.FOOD_BEVERAGE]: 'Food & Beverages',
  [ModuleType.COMMUNICATION_MARKETING]: 'Communication & Marketing',
  [ModuleType.SPONSORS]: 'Sponsors & Partners',
  // Global modules
  [ModuleType.VENDORS_SUPPLIERS]: 'Vendors & Suppliers',
  [ModuleType.MATERIALS_STOCK]: 'Materials & Stock',
  [ModuleType.STAFF_POOL]: 'Staff Pool',
};

export const MODULE_COLORS: Record<ModuleType, string> = {
  // Event-scoped modules
  [ModuleType.ARTISTS]: '#8B5CF6',
  [ModuleType.PRODUCTION]: '#3B82F6',
  [ModuleType.FOOD_BEVERAGE]: '#F59E0B',
  [ModuleType.COMMUNICATION_MARKETING]: '#EC4899',
  [ModuleType.SPONSORS]: '#EF4444',
  // Global modules
  [ModuleType.VENDORS_SUPPLIERS]: '#3B82F6',
  [ModuleType.MATERIALS_STOCK]: '#10B981',
  [ModuleType.STAFF_POOL]: '#06B6D4',
};

// Event-scoped modules (only visible within event context)
export const EVENT_SCOPED_MODULES: ModuleType[] = [
  ModuleType.ARTISTS,
  ModuleType.PRODUCTION,
  ModuleType.FOOD_BEVERAGE,
  ModuleType.COMMUNICATION_MARKETING,
  ModuleType.SPONSORS,
];

// Global modules (visible in main navigation)
export const GLOBAL_MODULES: ModuleType[] = [
  ModuleType.VENDORS_SUPPLIERS,
  ModuleType.MATERIALS_STOCK,
  ModuleType.STAFF_POOL,
];

// Helper function to check if a module is event-scoped
export function isEventScopedModule(moduleType: ModuleType): boolean {
  return EVENT_SCOPED_MODULES.includes(moduleType);
}

// Helper function to check if a module is global
export function isGlobalModule(moduleType: ModuleType): boolean {
  return GLOBAL_MODULES.includes(moduleType);
}


