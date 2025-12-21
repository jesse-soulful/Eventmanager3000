import { useState, useEffect } from 'react';
import { Users, Edit2, X } from 'lucide-react';
import { eventsApi, lineItemsApi } from '../lib/api';
import type { Event, ModuleType } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum, StaffRole, STAFF_ROLE_DISPLAY_NAMES } from '@event-management/shared';
import { getStaffRolesForModule, moduleSupportsStaffAssignments, MODULE_DISPLAY_NAMES } from '@event-management/shared';
import { StaffSelector } from './StaffSelector';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';

interface ModuleStaffAssignmentsProps {
  event: Event;
  moduleType: ModuleType;
  onUpdate: () => void;
}

export function ModuleStaffAssignments({ event, moduleType, onUpdate }: ModuleStaffAssignmentsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [staffAssignments, setStaffAssignments] = useState<Record<string, { id: string; name: string; phone?: string; email?: string } | null>>({});
  const [assignmentSubItems, setAssignmentSubItems] = useState<Record<string, any>>({});

  const moduleRoles = getStaffRolesForModule(moduleType);
  const supportsStaff = moduleSupportsStaffAssignments(moduleType);

  useEffect(() => {
    if (event && supportsStaff) {
      loadStaffAssignments();
    }
  }, [event, moduleType, supportsStaff]);

  const loadStaffAssignments = async () => {
    if (!event.metadata) return;
    
    try {
      const metadata = typeof event.metadata === 'string' 
        ? JSON.parse(event.metadata) 
        : (event.metadata || {});
      
      // Load staff assignments from event metadata
      const assignments: Record<string, { id: string; name: string; phone?: string; email?: string } | null> = {};
      
      // For modules with predefined roles, check metadata
      for (const role of moduleRoles) {
        const staffIdKey = `${moduleType.toLowerCase()}_${role.toLowerCase()}_staffId`;
        const staffId = metadata[staffIdKey];
        if (staffId) {
          try {
            const staffResponse = await lineItemsApi.getById(staffId);
            const staff = staffResponse.data;
            const staffMetadata = (staff.metadata as any) || {};
            assignments[role] = {
              id: staff.id,
              name: staff.name,
              phone: staffMetadata.phone,
              email: staffMetadata.email,
            };
            
            // Load sub-item for this assignment
            const subItems = (staff as any).subLineItems || [];
            const assignmentSubItem = subItems.find((subItem: any) => 
              subItem.eventId === event.id && 
              (subItem.metadata && typeof subItem.metadata === 'object' 
                ? subItem.metadata.moduleType === moduleType && subItem.metadata.role === role
                : false)
            );
            if (assignmentSubItem) {
              setAssignmentSubItems(prev => ({ ...prev, [role]: assignmentSubItem }));
            }
          } catch (error) {
            console.error(`Failed to load staff for ${role}:`, error);
          }
        } else {
          assignments[role] = null;
        }
      }
      
      setStaffAssignments(assignments);
    } catch (error) {
      console.error('Failed to load staff assignments:', error);
    }
  };

  const handleCreateStaff = async (name: string, phone?: string, email?: string): Promise<{ id: string; name: string; phone?: string; email?: string }> => {
    const response = await lineItemsApi.create({
      moduleType: ModuleTypeEnum.STAFF_POOL,
      eventId: event.id,
      name,
      description: '',
      metadata: {
        email: email || '',
        phone: phone || '',
        canWorkAs: [],
      },
    });
    
    return {
      id: response.data.id,
      name: response.data.name,
      phone: (response.data.metadata as any)?.phone,
      email: (response.data.metadata as any)?.email,
    };
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const currentMetadata = typeof event.metadata === 'string' 
        ? JSON.parse(event.metadata) 
        : (event.metadata || {});
      
      // Update metadata with staff assignments
      const updatedMetadata = { ...currentMetadata };
      
      for (const role of moduleRoles) {
        const staffIdKey = `${moduleType.toLowerCase()}_${role.toLowerCase()}_staffId`;
        const previousStaffId = currentMetadata[staffIdKey];
        const staff = staffAssignments[role];
        updatedMetadata[staffIdKey] = staff?.id || null;

        // Remove old assignment if staff was removed
        if (previousStaffId && !staff) {
          try {
            const previousStaffLineItemResponse = await lineItemsApi.getById(previousStaffId);
            const previousStaffLineItem = previousStaffLineItemResponse.data;
            const existingSubItems = (previousStaffLineItem as any).subLineItems || [];

            const assignmentToRemove = existingSubItems.find((subItem: any) => {
              const subMetadata = typeof subItem.metadata === 'string' 
                ? JSON.parse(subItem.metadata) 
                : (subItem.metadata || {});
              return subItem.eventId === event.id && 
                     subMetadata.moduleType === moduleType && 
                     subMetadata.role === role;
            });

            if (assignmentToRemove) {
              await lineItemsApi.delete(assignmentToRemove.id);
            }
          } catch (error) {
            console.error(`Failed to remove event assignment for ${role}:`, error);
          }
        }
      }
      
      // Note: metadata cannot be updated via UpdateEventInput
      // This would require a different approach or backend support

      // Create new assignment sub-items in Staff Pool
      for (const role of moduleRoles) {
        const staff = staffAssignments[role];
        if (staff) {
          try {
            const staffLineItemResponse = await lineItemsApi.getById(staff.id);
            const staffLineItem = staffLineItemResponse.data;
            const existingSubItems = (staffLineItem as any).subLineItems || [];

            const existingAssignment = existingSubItems.find((subItem: any) => {
              const subMetadata = typeof subItem.metadata === 'string' 
                ? JSON.parse(subItem.metadata) 
                : (subItem.metadata || {});
              return subItem.eventId === event.id && 
                     subMetadata.moduleType === moduleType && 
                     subMetadata.role === role;
            });

            if (!existingAssignment) {
              const eventStartDate = event.startDate instanceof Date ? event.startDate.toISOString() : event.startDate;
              const eventEndDate = event.endDate instanceof Date ? event.endDate.toISOString() : event.endDate;
              
              await lineItemsApi.create({
                moduleType: ModuleTypeEnum.STAFF_POOL,
                eventId: event.id,
                parentLineItemId: staff.id,
                name: `${event.name} - ${MODULE_DISPLAY_NAMES[moduleType]} - ${STAFF_ROLE_DISPLAY_NAMES[role]}`,
                description: `Assigned as ${STAFF_ROLE_DISPLAY_NAMES[role]} for ${MODULE_DISPLAY_NAMES[moduleType]} in ${event.name}`,
                metadata: {
                  role,
                  moduleType,
                  eventName: event.name,
                  eventStartDate,
                  eventEndDate,
                },
              });
            }
          } catch (error) {
            console.error(`Failed to create event assignment for ${role}:`, error);
          }
        }
      }

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to save staff assignments:', error);
      alert('Failed to save staff assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!supportsStaff) {
    return null;
  }


  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Staff Assignments</h3>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-secondary btn-sm flex items-center gap-1"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {moduleRoles.length > 0 ? (
            moduleRoles.map((role) => (
              <StaffSelector
                key={role}
                label={STAFF_ROLE_DISPLAY_NAMES[role]}
                role={role}
                value={staffAssignments[role] || null}
                onSelect={(staff) => {
                  setStaffAssignments(prev => ({ ...prev, [role]: staff }));
                }}
                onCreateNew={handleCreateStaff}
              />
            ))
          ) : (
            <p className="text-sm text-gray-500">No predefined roles for this module. Staff can be assigned manually in Staff Pool.</p>
          )}
          <div className="flex gap-2 justify-end pt-2 border-t">
            <button
              onClick={() => {
                setIsEditing(false);
                loadStaffAssignments(); // Reset to saved state
              }}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn btn-primary btn-sm"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {moduleRoles.length === 0 ? (
            <p className="text-sm text-gray-500">No staff assignments configured for this module.</p>
          ) : (
            moduleRoles.map((role) => {
              const staff = staffAssignments[role];
              const subItem = assignmentSubItems[role];
              return (
                <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700">{STAFF_ROLE_DISPLAY_NAMES[role]}:</span>
                      {staff ? (
                        <Link
                          to={`/staff-pool`}
                          className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                        >
                          {staff.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">Not assigned</span>
                      )}
                    </div>
                    {staff && (staff.phone || staff.email) && (
                      <div className="text-xs text-gray-500">
                        {staff.phone && <span>{staff.phone}</span>}
                        {staff.phone && staff.email && <span className="mx-1">•</span>}
                        {staff.email && <span>{staff.email}</span>}
                      </div>
                    )}
                    {subItem && (
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        {subItem.plannedCost && (
                          <span>Planned: {formatCurrency(subItem.plannedCost)}</span>
                        )}
                        {subItem.actualCost && (
                          <span>Actual: {formatCurrency(subItem.actualCost)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

