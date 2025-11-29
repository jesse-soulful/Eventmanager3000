import { useState, useEffect } from 'react';
import type { Category } from '@event-management/shared';

interface CategoryModalProps {
  category?: Category | null;
  onClose: () => void;
  onSave: (data: { name: string; color: string }) => void;
}

export function CategoryModal({ category, onClose, onSave }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    color: '#10B981',
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        color: category.color,
      });
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold gradient-text mb-4">
          {category ? 'Edit Category' : 'Create Category'}
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
                placeholder="#10B981"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {category ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


