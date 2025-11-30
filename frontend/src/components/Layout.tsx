import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, DollarSign, Menu, Settings } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const eventId = location.pathname.includes('/events/') && location.pathname.split('/').length >= 3 
    ? location.pathname.split('/')[2] 
    : null;

  const navigation = [
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Finance Board', href: eventId ? `/events/${eventId}/finance` : '#', icon: DollarSign, disabled: !eventId },
    { name: 'Manage Metadata', href: '/manage-metadata', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/events" className="text-2xl font-bold gradient-text hover:opacity-80 transition-opacity">
                  Event Management 3000
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href || 
                    (item.href !== '#' && location.pathname.startsWith(item.href));
                  
                  if (item.disabled) return null;
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 border-2 border-primary-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {sidebarOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                if (item.disabled) return null;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
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

