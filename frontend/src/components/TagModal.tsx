import { useState, useEffect } from 'react';
import type { Tag } from '@event-management/shared';

interface TagModalProps {
  tag?: Tag | null;
  onClose: () => void;
  onSave: (data: { name: string; color: string }) => void;
}

export function TagModal({ tag, onClose, onSave }: TagModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    color: '#8B5CF6',
  });

  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name,
        color: tag.color || '#10B981',
      });
    }
  }, [tag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay modal-animate-overlay" onClick={onClose}>
      <div className="modal-content modal-animate-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {tag ? 'Edit Tag' : 'Create Tag'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="modal-body flex-1 overflow-y-auto min-h-0">
            <div className="space-y-4">
              <div className="form-group">
                <label className="label">
                  Name <span className="required-indicator">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="label">
                  Color <span className="required-indicator">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="w-16 h-10 rounded border border-gray-600/50 bg-gray-900/80 cursor-pointer"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                  <input
                    type="text"
                    className="input flex-1"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#8B5CF6"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {tag ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


