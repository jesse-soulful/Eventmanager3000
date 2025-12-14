import { useEffect, useState } from 'react';
import { Trash2, Shield, User, Eye } from 'lucide-react';
import { usersApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { User as UserType } from '@event-management/shared';

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<{ userId: string; role: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getAll();
      setUsers(response.data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'ADMIN' | 'USER' | 'VIEWER') => {
    try {
      await usersApi.update(userId, { role: newRole });
      await loadUsers();
      setEditingRole(null);
    } catch (err: any) {
      console.error('Failed to update user role:', err);
      alert(err.response?.data?.error || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await usersApi.delete(userId);
      await loadUsers();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-4 h-4" />;
      case 'USER':
        return <User className="w-4 h-4" />;
      case 'VIEWER':
        return <Eye className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'USER':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'VIEWER':
        return 'bg-gray-700 text-gray-400 border-gray-600';
      default:
        return 'bg-gray-700 text-gray-400 border-gray-600';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading users...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-200 mb-2">User Management</h2>
        <p className="text-sm text-gray-400">Manage users and their roles</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-dark-700">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800/30 divide-y divide-dark-700">
            {users.map((user) => {
              const isCurrentUser = currentUser?.id === user.id;
              const isEditing = editingRole?.userId === user.id;

              return (
                <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-200">
                      {user.name || 'No name'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <select
                        value={editingRole?.role || user.role}
                        onChange={(e) => {
                          const newRole = e.target.value as 'ADMIN' | 'USER' | 'VIEWER';
                          setEditingRole({ userId: user.id, role: newRole });
                        }}
                        onBlur={() => {
                          if (editingRole && editingRole.role !== user.role) {
                            handleRoleChange(user.id, editingRole.role as 'ADMIN' | 'USER' | 'VIEWER');
                          } else {
                            setEditingRole(null);
                          }
                        }}
                        className="text-sm border border-gray-700 bg-gray-900/50 text-gray-100 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        autoFocus
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => !isCurrentUser && setEditingRole({ userId: user.id, role: user.role })}
                        disabled={isCurrentUser}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getRoleColor(user.role)} ${
                          isCurrentUser ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'
                        }`}
                        title={isCurrentUser ? 'Cannot change your own role' : 'Click to change role'}
                      >
                        {getRoleIcon(user.role)}
                        {user.role}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.emailVerified
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}
                    >
                      {user.emailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!isCurrentUser && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="text-red-400 hover:text-red-300 inline-flex items-center gap-1 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {isCurrentUser && (
                      <span className="text-gray-500 text-xs">Current user</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No users found
        </div>
      )}
    </div>
  );
}

