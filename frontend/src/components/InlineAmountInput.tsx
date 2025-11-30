import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { formatCurrency, formatNumber } from '../lib/utils';

interface InlineAmountInputProps {
  value: number | null | undefined;
  onSave: (value: number | null) => Promise<void>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  prefix?: string;
  color?: 'blue' | 'green' | 'gray';
}

export function InlineAmountInput({
  value,
  onSave,
  placeholder = '0.00',
  className = '',
  disabled = false,
  prefix = '$',
  color = 'gray',
}: InlineAmountInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
      setEditValue(value?.toFixed(2) || '');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const trimmedValue = editValue.trim();
      let numValue: number | null = null;
      
      if (trimmedValue !== '') {
        numValue = parseFloat(trimmedValue);
        if (isNaN(numValue)) {
          // Invalid number, revert
          setIsEditing(false);
          setIsSaving(false);
          return;
        }
      }
      
      await onSave(numValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save amount:', error);
      // Revert on error
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    gray: 'text-gray-900',
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-500">{prefix}</span>
        <input
          ref={inputRef}
          type="number"
          step="0.01"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className={`w-24 px-2 py-0.5 text-sm border border-primary-500 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 ${className}`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="text-green-600 hover:text-green-800 disabled:opacity-50"
          title="Save"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          className="text-red-600 hover:text-red-800 disabled:opacity-50"
          title="Cancel"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`text-sm font-semibold hover:bg-gray-100 px-2 py-1 rounded transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${colorClasses[color]} ${className}`}
    >
      {value !== null && value !== undefined 
        ? prefix === '$' 
          ? formatCurrency(value)
          : `${prefix}${formatNumber(value)}`
        : '-'}
    </button>
  );
}
