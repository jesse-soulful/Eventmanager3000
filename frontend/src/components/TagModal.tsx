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
        color: tag.color,
      });
    }
  }, [tag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold gradient-text mb-4">
          {tag ? 'Edit Tag' : 'Create Tag'}
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
                placeholder="#8B5CF6"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
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

