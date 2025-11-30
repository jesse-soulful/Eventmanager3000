import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface InlineTextInputProps {
  value: string | null | undefined;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  multiline?: boolean;
  maxLength?: number;
}

export function InlineTextInput({
  value,
  onSave,
  placeholder = 'Click to edit',
  className = '',
  disabled = false,
  multiline = false,
  maxLength,
}: InlineTextInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (!multiline && inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing, multiline]);

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
      setEditValue(value || '');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const trimmedValue = editValue.trim();
      await onSave(trimmedValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save text:', error);
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
    if (multiline) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    } else {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <div className="flex flex-col gap-1 w-full">
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            maxLength={maxLength}
            rows={3}
            className={`w-full px-2 py-1 text-sm border border-primary-500 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none ${className}`}
            placeholder={placeholder}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="text-green-600 hover:text-green-800 disabled:opacity-50 flex items-center gap-1"
              title="Save (Cmd/Ctrl+Enter)"
            >
              <Check className="w-3 h-3" />
              <span className="text-xs">Save</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="text-red-600 hover:text-red-800 disabled:opacity-50 flex items-center gap-1"
              title="Cancel (Esc)"
            >
              <X className="w-3 h-3" />
              <span className="text-xs">Cancel</span>
            </button>
            {maxLength && (
              <span className="text-xs text-gray-500 ml-auto">
                {editValue.length}/{maxLength}
              </span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          maxLength={maxLength}
          className={`px-2 py-0.5 text-sm border border-primary-500 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 ${className}`}
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

  const displayValue = value || placeholder;
  const isEmpty = !value || value.trim() === '';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`text-sm font-medium hover:bg-gray-100 px-2 py-1 rounded transition-colors w-full text-left ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${isEmpty ? 'text-gray-400 italic' : 'text-gray-900'} ${className}`}
      title={isEmpty ? `Click to ${placeholder.toLowerCase()}` : 'Click to edit'}
    >
      {isEmpty ? (
        <span className="flex items-center gap-1">
          <span>{displayValue}</span>
        </span>
      ) : (
        <span className="whitespace-pre-wrap break-words">{displayValue}</span>
      )}
    </button>
  );
}

