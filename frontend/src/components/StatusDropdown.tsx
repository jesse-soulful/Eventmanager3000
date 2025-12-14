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
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
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
        <div className="absolute z-50 mt-1 w-48 bg-gray-800 rounded-lg shadow-2xl border border-gray-600 py-1 max-h-60 overflow-auto backdrop-blur-sm">
          <button
            type="button"
            onClick={() => handleStatusSelect(null)}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700/50 transition-colors rounded-md mx-1 ${
              !currentStatus ? 'bg-gray-700/30 font-medium' : 'text-gray-300'
            }`}
          >
            <span className={!currentStatus ? 'text-gray-200' : 'text-gray-400'}>No Status</span>
          </button>
          {statuses.map((status) => (
            <button
              key={status.id}
              type="button"
              onClick={() => handleStatusSelect(status.id)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700/50 transition-colors flex items-center gap-2 rounded-md mx-1 ${
                currentStatus?.id === status.id ? 'bg-gray-700/30 font-medium text-gray-100' : 'text-gray-300'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
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
