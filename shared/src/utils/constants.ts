export enum ModuleType {
  ARTISTS = 'ARTISTS',
  VENDORS = 'VENDORS',
  MATERIALS = 'MATERIALS',
  FOOD_BEVERAGE = 'FOOD_BEVERAGE',
  SPONSORS = 'SPONSORS',
  MARKETING = 'MARKETING'
}

export const MODULE_DISPLAY_NAMES: Record<ModuleType, string> = {
  [ModuleType.ARTISTS]: 'Artists',
  [ModuleType.VENDORS]: 'Vendors',
  [ModuleType.MATERIALS]: 'Materials',
  [ModuleType.FOOD_BEVERAGE]: 'Food & Beverages',
  [ModuleType.SPONSORS]: 'Sponsors & Partners',
  [ModuleType.MARKETING]: 'Marketing & Communication'
};

export const MODULE_COLORS: Record<ModuleType, string> = {
  [ModuleType.ARTISTS]: '#8B5CF6',
  [ModuleType.VENDORS]: '#3B82F6',
  [ModuleType.MATERIALS]: '#10B981',
  [ModuleType.FOOD_BEVERAGE]: '#F59E0B',
  [ModuleType.SPONSORS]: '#EF4444',
  [ModuleType.MARKETING]: '#EC4899'
};

