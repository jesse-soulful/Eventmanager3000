import { ModuleType } from './constants';
import { StaffRole } from './staffRoles';

/**
 * Maps each module type to the staff roles that can be assigned in that module
 */
export const MODULE_STAFF_ROLES: Record<ModuleType, StaffRole[]> = {
  // Event-scoped modules
  [ModuleType.ARTISTS]: [], // No staff assignments for artists module
  [ModuleType.PRODUCTION]: [
    StaffRole.PRODUCTION_MANAGER,
    StaffRole.STAGE_MANAGER,
    StaffRole.SOUND_TECHNICIAN,
    StaffRole.LIGHTING_TECHNICIAN,
  ],
  [ModuleType.FOOD_BEVERAGE]: [
    StaffRole.BAR_MANAGER,
    StaffRole.BARTENDER,
    StaffRole.CATERING_MANAGER,
  ],
  [ModuleType.COMMUNICATION_MARKETING]: [], // Custom assignments allowed
  [ModuleType.SPONSORS]: [], // Custom assignments allowed
  // Global modules
  [ModuleType.VENDORS_SUPPLIERS]: [],
  [ModuleType.MATERIALS_STOCK]: [],
  [ModuleType.STAFF_POOL]: [],
};

/**
 * Get staff roles for a specific module type
 */
export function getStaffRolesForModule(moduleType: ModuleType): StaffRole[] {
  return MODULE_STAFF_ROLES[moduleType] || [];
}

/**
 * Check if a module supports staff assignments
 */
export function moduleSupportsStaffAssignments(moduleType: ModuleType): boolean {
  // All event-scoped modules except ARTISTS support staff assignments
  return moduleType !== ModuleType.ARTISTS && 
         moduleType !== ModuleType.VENDORS_SUPPLIERS &&
         moduleType !== ModuleType.MATERIALS_STOCK &&
         moduleType !== ModuleType.STAFF_POOL;
}

