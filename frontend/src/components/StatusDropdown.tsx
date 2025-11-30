import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Status } from '@event-management/shared';

interface StatusDropdownProps {
  statuses: Status[];
  currentStatus: Status | null | undefined;
  onStatusChange: (statusId: string | null) => Promise<void>;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function StatusDropdown({
  statuses,
  currentStatus,
  onStatusChange,
  size = 'md',
  disabled = false,
}: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleStatusSelect = async (statusId: string | null) => {
    if (disabled || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await onStatusChange(statusId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    return status?.color || '#6B7280';
  };

  const sizeClasses = {
    sm: 'text-xs px-3 py-0.5 min-w-[80px]',
    md: 'text-xs px-3 py-1 min-w-[100px]',
    lg: 'text-sm px-4 py-1.5 min-w-[120px]',
  };

  const currentStatusColor = currentStatus ? getStatusColor(currentStatus.id) : '#9CA3AF';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isUpdating}
        className={`inline-flex items-center justify-center gap-1.5 rounded-full text-white font-medium transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1 whitespace-nowrap ${
          sizeClasses[size]
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
          isUpdating ? 'opacity-70' : ''
        }`}
        style={{ backgroundColor: currentStatusColor }}
      >
        <span>{currentStatus?.name || 'No Status'}</span>
        {!disabled && (
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-60 overflow-auto">
          <button
            type="button"
            onClick={() => handleStatusSelect(null)}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
              !currentStatus ? 'bg-gray-50 font-medium' : ''
            }`}
          >
            <span className="text-gray-500">No Status</span>
          </button>
          {statuses.map((status) => (
            <button
              key={status.id}
              type="button"
              onClick={() => handleStatusSelect(status.id)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                currentStatus?.id === status.id ? 'bg-gray-50 font-medium' : ''
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <span>{status.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
