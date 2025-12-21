import { useState, useEffect } from 'react';
import { Users, Link as LinkIcon } from 'lucide-react';
import { lineItemsApi, modulesApi } from '../lib/api';
import type { Event, ModuleType } from '@event-management/shared';
import { ModuleType as ModuleTypeEnum, MODULE_DISPLAY_NAMES, EVENT_SCOPED_MODULES, moduleSupportsStaffAssignments, getStaffRolesForModule, STAFF_ROLE_DISPLAY_NAMES } from '@event-management/shared';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';

interface EventStaffOverviewProps {
  event: Event;
}

interface StaffAssignment {
  staffId: string;
  staffName: string;
  role: string;
  moduleType: ModuleType;
  subItem?: any;
}

export function EventStaffOverview({ event }: EventStaffOverviewProps) {
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (event) {
      loadStaffAssignments();
    }
  }, [event]);

  const loadStaffAssignments = async () => {
    setLoading(true);
    try {
      const assignments: StaffAssignment[] = [];
      
      // Get event metadata
      const eventMetadata = typeof event.metadata === 'string' 
        ? JSON.parse(event.metadata) 
        : (event.metadata || {});

      // Check all event-scoped modules for staff assignments
      for (const moduleType of EVENT_SCOPED_MODULES) {
        if (!moduleSupportsStaffAssignments(moduleType)) continue;
        
        const moduleRoles = getStaffRolesForModule(moduleType);
        
        for (const role of moduleRoles) {
          const staffIdKey = `${moduleType.toLowerCase()}_${role.toLowerCase()}_staffId`;
          const staffId = eventMetadata[staffIdKey];
          
          if (staffId) {
            try {
              const staffResponse = await lineItemsApi.getById(staffId);
              const staff = staffResponse.data;
              const subItems = (staff as any).subLineItems || [];
              
              // Find the sub-item for this assignment
              const assignmentSubItem = subItems.find((subItem: any) => {
                const subMetadata = typeof subItem.metadata === 'string' 
                  ? JSON.parse(subItem.metadata) 
                  : (subItem.metadata || {});
                return subItem.eventId === event.id && 
                       subMetadata.moduleType === moduleType && 
                       subMetadata.role === role;
              });
              
              assignments.push({
                staffId: staff.id,
                staffName: staff.name,
                role: STAFF_ROLE_DISPLAY_NAMES[role],
                moduleType,
                subItem: assignmentSubItem,
              });
            } catch (error) {
              console.error(`Failed to load staff for ${moduleType}/${role}:`, error);
            }
          }
        }
      }

      // Also check event details staff (promotor, artist liaison, technical)
      const eventDetailsRoles = [
        { key: 'promotorStaffId', role: 'Promotor', moduleType: 'Event Details' },
        { key: 'artistLiaisonStaffId', role: 'Artist Liaison', moduleType: 'Event Details' },
        { key: 'technicalStaffId', role: 'Technical Contact', moduleType: 'Event Details' },
      ];

      for (const { key, role, moduleType: moduleName } of eventDetailsRoles) {
        const staffId = eventMetadata[key];
        if (staffId) {
          try {
            const staffResponse = await lineItemsApi.getById(staffId);
            const staff = staffResponse.data;
            const subItems = (staff as any).subLineItems || [];
            
            const assignmentSubItem = subItems.find((subItem: any) => {
              const subMetadata = typeof subItem.metadata === 'string' 
                ? JSON.parse(subItem.metadata) 
                : (subItem.metadata || {});
              return subItem.eventId === event.id && 
                     subMetadata.role === role;
            });
            
            assignments.push({
              staffId: staff.id,
              staffName: staff.name,
              role,
              moduleType: moduleName as any,
              subItem: assignmentSubItem,
            });
          } catch (error) {
            console.error(`Failed to load staff for ${key}:`, error);
          }
        }
      }

      setStaffAssignments(assignments);
    } catch (error) {
      console.error('Failed to load staff assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-4 text-gray-400">Loading staff assignments...</div>
      </div>
    );
  }

  if (staffAssignments.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-gray-100">Staff Assignments</h3>
        </div>
        <p className="text-sm text-gray-400">No staff assigned to this event yet.</p>
      </div>
    );
  }

  // Group by module
  const groupedByModule = staffAssignments.reduce((acc, assignment) => {
    const moduleName = typeof assignment.moduleType === 'string' 
      ? assignment.moduleType 
      : MODULE_DISPLAY_NAMES[assignment.moduleType];
    if (!acc[moduleName]) {
      acc[moduleName] = [];
    }
    acc[moduleName].push(assignment);
    return acc;
  }, {} as Record<string, StaffAssignment[]>);

  return (
    <div className="card mb-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-primary-400" />
        <h3 className="text-lg font-semibold text-gray-100">Staff Assignments</h3>
      </div>
      <div className="space-y-6">
        {Object.entries(groupedByModule).map(([moduleName, assignments]) => (
          <div key={moduleName}>
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wider">{moduleName}</h4>
            <div className="space-y-2">
              {assignments.map((assignment, idx) => (
                <div key={`${assignment.staffId}-${idx}`} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-gray-800/70 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to="/staff-pool"
                        className="text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        {assignment.staffName}
                      </Link>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-sm text-gray-300">{assignment.role}</span>
                    </div>
                    {assignment.subItem && (
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        {assignment.subItem.plannedCost && (
                          <span>Planned: <span className="text-blue-400 font-medium">{formatCurrency(assignment.subItem.plannedCost)}</span></span>
                        )}
                        {assignment.subItem.actualCost && (
                          <span>Actual: <span className="text-emerald-400 font-medium">{formatCurrency(assignment.subItem.actualCost)}</span></span>
                        )}
                      </div>
                    )}
                  </div>
                  {assignment.moduleType && typeof assignment.moduleType === 'string' && !assignment.moduleType.includes('Event Details') && (
                    <Link
                      to={`/events/${event.id}/${(assignment.moduleType as string).toLowerCase().replace(/_/g, '-')}`}
                      className="text-primary-400 hover:text-primary-300 transition-colors ml-2 flex-shrink-0"
                      title="Go to module"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



