import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, DollarSign, Menu, Settings, Package, Users, Building2 } from 'lucide-react';
import { useState } from 'react';
import { GLOBAL_MODULES, MODULE_DISPLAY_NAMES, MODULE_COLORS } from '@event-management/shared';
import type { ModuleType } from '@event-management/shared';
import { UserMenu } from './UserMenu';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const eventId = location.pathname.includes('/events/') && location.pathname.split('/').length >= 3 
    ? location.pathname.split('/')[2] 
    : null;

  const globalModuleIcons: Record<ModuleType, typeof Package> = {
    VENDORS_SUPPLIERS: Building2,
    MATERIALS_STOCK: Package,
    STAFF_POOL: Users,
    // Event-scoped modules (not used in navigation)
    ARTISTS: Calendar,
    PRODUCTION: Calendar,
    FOOD_BEVERAGE: Calendar,
    COMMUNICATION_MARKETING: Calendar,
    SPONSORS: Calendar,
  };

  const navigation = [
    { name: 'Events', href: '/events', icon: Calendar },
    ...GLOBAL_MODULES.map(moduleType => ({
      name: MODULE_DISPLAY_NAMES[moduleType],
      href: `/${moduleType.toLowerCase().replace(/_/g, '-')}`,
      icon: globalModuleIcons[moduleType],
    })),
    { name: 'Finance Board', href: eventId ? `/events/${eventId}/finance` : '/finance', icon: DollarSign },
    { name: 'Manage Metadata', href: '/manage-metadata', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Top Navigation */}
      <nav className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-50 shadow-2xl shadow-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/events" className="text-2xl font-bold gradient-text hover:opacity-80 transition-opacity flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-primary-400" />
                  Event Management 3000
                </Link>
              </div>
              <div className="hidden md:ml-8 md:flex md:space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href || 
                    (item.href !== '#' && location.pathname.startsWith(item.href));
                  
                  if (item.disabled) return null;
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-600/20 text-primary-300 border border-primary-500/40 shadow-md shadow-primary-500/10'
                          : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/60 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-primary-400' : ''}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserMenu />
              <div className="md:hidden">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800/60 transition-colors"
                  aria-label="Toggle menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {sidebarOpen && (
          <div className="md:hidden border-t border-gray-800/50 bg-gray-900/98 backdrop-blur-xl">
            <div className="pt-2 pb-3 space-y-1 px-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href || 
                  (item.href !== '#' && location.pathname.startsWith(item.href));
                if (item.disabled) return null;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center pl-3 pr-4 py-3 rounded-lg border-l-4 text-base font-medium transition-all ${
                      isActive
                        ? 'text-primary-300 bg-primary-600/10 border-primary-500'
                        : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/60 border-transparent'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary-400' : ''}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

