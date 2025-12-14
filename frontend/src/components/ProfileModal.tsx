import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../lib/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function ProfileModal({ isOpen, onClose, onUpdate }: ProfileModalProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setError(null);
      setSuccess(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('profile');
    }
  }, [isOpen, user]);

  if (!isOpen) {
    return null;
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await usersApi.updateProfile({ name: name.trim() || null });
      setSuccess('Profile updated successfully');
      setTimeout(() => {
        onUpdate?.();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setIsLoading(true);

    try {
      await usersApi.changePassword({
        currentPassword,
        newPassword,
      });
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    USER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    VIEWER: 'bg-gray-700 text-gray-400 border-gray-600',
  };

  const roleColor = user ? (roleColors[user.role] || roleColors.VIEWER) : '';

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="modal-overlay modal-animate-overlay" onClick={onClose}>
      <div className="modal-content modal-animate-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${roleColor}`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="modal-title">Manage Profile</h2>
              <p className="text-sm text-gray-400">Update your profile information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1 hover:bg-gray-700 rounded-lg flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 flex-shrink-0 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'password'
                ? 'text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            Change Password
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              {success}
            </div>
          )}

          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-400 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 bg-gray-900/80 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Role (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Role
                </label>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-2 rounded-lg text-sm font-semibold border ${roleColor}`}>
                    {user?.role || 'USER'}
                  </span>
                  <p className="text-xs text-gray-500">Role is managed by administrators</p>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2 pr-10 bg-gray-900/80 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 8 characters)"
                    className="w-full px-4 py-2 pr-10 bg-gray-900/80 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 pr-10 bg-gray-900/80 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer flex-shrink-0 border-t border-gray-700 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={activeTab === 'profile' ? handleProfileSubmit : handlePasswordSubmit}
            className="btn btn-primary"
            disabled={isLoading || authLoading}
          >
            {isLoading 
              ? (activeTab === 'profile' ? 'Saving...' : 'Changing...') 
              : (activeTab === 'profile' ? 'Save Changes' : 'Change Password')
            }
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

