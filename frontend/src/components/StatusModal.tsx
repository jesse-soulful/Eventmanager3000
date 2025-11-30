import React, { useState, useEffect, useRef } from 'react';
import type { Status, StatusItemType } from '@event-management/shared';

interface StatusModalProps {
  status?: Status | null;
  itemType?: StatusItemType;
  onClose: () => void;
  onSave: (data: { name: string; color: string; isDefault: boolean; order: number; itemType: StatusItemType }) => void;
}

export function StatusModal({ status, itemType = 'main', onClose, onSave }: StatusModalProps) {
  // Lock itemType - it should NEVER change after initial render for new statuses
  const lockedItemType = useRef<StatusItemType>(itemType);
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    isDefault: false,
    order: 0,
    itemType: itemType as StatusItemType,
  });

  useEffect(() => {
    console.log('🔄 StatusModal useEffect:', { status: !!status, itemType, lockedItemType: lockedItemType.current });
    if (status) {
      lockedItemType.current = status.itemType;
      setFormData({
        name: status.name,
        color: status.color,
        isDefault: status.isDefault,
        order: status.order,
        itemType: status.itemType,
      });
    } else {
      // For new statuses, lock the itemType from props
      lockedItemType.current = itemType;
      setFormData(prev => ({ ...prev, itemType: lockedItemType.current }));
    }
  }, [status, itemType]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittedRef = useRef<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // FORCE use locked itemType for new statuses (ignore formData.itemType if it changed)
    const finalItemType = status ? formData.itemType : lockedItemType.current;
    
    // Validate itemType is valid
    if (finalItemType !== 'main' && finalItemType !== 'sub') {
      console.error('❌ INVALID itemType:', finalItemType);
      alert('Invalid item type. Please select either Main or Sub.');
      return;
    }
    
    const submitKey = `${formData.name}-${finalItemType}`;
    
    console.log('📝 StatusModal handleSubmit called:', { 
      finalItemType, 
      formDataItemType: formData.itemType,
      lockedItemType: lockedItemType.current,
      propsItemType: itemType,
      name: formData.name, 
      submitKey 
    });
    
    // AGGRESSIVE duplicate prevention
    if (isSubmitting) {
      console.warn('❌ BLOCKED: Already submitting');
      return;
    }
    
    if (submittedRef.current === submitKey) {
      console.warn('❌ BLOCKED: Duplicate form submission:', submitKey);
      return;
    }
    
    // Mark as submitting IMMEDIATELY
    setIsSubmitting(true);
    submittedRef.current = submitKey;
    
    // Use a small delay to ensure state is set before calling onSave
    await new Promise(resolve => setTimeout(resolve, 10));
    
    try {
      console.log('📝 StatusModal submitting ONCE:', { itemType: finalItemType, name: formData.name, submitKey });
      console.log('📝 Calling onSave with FINAL itemType:', finalItemType);
      
      // Create a clean copy with LOCKED itemType
      const cleanData = {
        name: formData.name,
        color: formData.color,
        isDefault: formData.isDefault,
        order: formData.order,
        itemType: finalItemType as 'main' | 'sub', // Use locked itemType
      };
      
      console.log('📝 Clean data being passed (with locked itemType):', cleanData);
      onSave(cleanData);
    } catch (error) {
      console.error('❌ Error in StatusModal submit:', error);
      submittedRef.current = '';
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold gradient-text mb-4">
          {status ? 'Edit Status' : 'Create Status'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Color *</label>
            <div className="flex gap-2">
              <input
                type="color"
                className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
              <input
                type="text"
                className="input flex-1"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#3B82F6"
              />
            </div>
          </div>
          <div>
            <label className="label">Item Type *</label>
            <select
              className="input"
              value={formData.itemType}
              onChange={(e) => {
                const newItemType = e.target.value as StatusItemType;
                console.log('🔄 ItemType changed in dropdown:', newItemType);
                setFormData({ ...formData, itemType: newItemType });
              }}
              disabled={!!status} // Can't change itemType when editing
            >
              <option value="main">Main Line Item (General statuses)</option>
              <option value="sub">Sub-Line Item (To-do list statuses)</option>
            </select>
            <p className="text-xs mt-1 text-gray-500">
              Current itemType: <strong>{formData.itemType}</strong> (from props: {itemType})
            </p>
            {status && (
              <p className="text-xs mt-1 text-gray-500">Item type cannot be changed after creation</p>
            )}
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            />
            <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
              Set as default status
            </label>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (status ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


