import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../lib/auth';
import { ProfileModal } from './ProfileModal';

export function UserMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  if (!user) {
    return null;
  }

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    USER: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    VIEWER: 'bg-gray-700 text-gray-400 border-gray-600',
  };

  const roleColor = roleColors[user.role] || roleColors.VIEWER;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800/60 transition-colors border border-gray-700/50"
      >
        <div className="flex items-center gap-2">
          {user.image ? (
            <img
              src={user.image.startsWith('/api') ? user.image : `/api${user.image}`}
              alt={user.name || 'Profile'}
              className="w-8 h-8 rounded-full object-cover border-2"
              style={{ borderColor: roleColor.includes('purple') ? 'rgba(168, 85, 247, 0.3)' : roleColor.includes('blue') ? 'rgba(59, 130, 246, 0.3)' : 'rgba(107, 114, 128, 0.5)' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${roleColor} ${user.image ? 'hidden' : ''}`}>
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-gray-200">{user.name || user.email}</div>
            <div className="text-xs text-gray-500">{user.role}</div>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 hidden md:block text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl bg-gray-800 border border-gray-700/50 backdrop-blur-xl z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-700/50">
              <div className="flex items-center gap-3 mb-2">
                {user.image ? (
                  <img
                    src={user.image.startsWith('/api') ? user.image : `/api${user.image}`}
                    alt={user.name || 'Profile'}
                    className="w-12 h-12 rounded-full object-cover border-2"
                    style={{ borderColor: roleColor.includes('purple') ? 'rgba(168, 85, 247, 0.3)' : roleColor.includes('blue') ? 'rgba(59, 130, 246, 0.3)' : 'rgba(107, 114, 128, 0.5)' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${roleColor}`}>
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{user.name || 'User'}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
              <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${roleColor}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={() => {
                setShowProfileModal(true);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2 transition-colors rounded-lg"
            >
              <Settings className="w-4 h-4" />
              Manage Profile
            </button>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 flex items-center gap-2 transition-colors rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}

      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUpdate={() => {
            // Refresh the page to update user data in context
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

