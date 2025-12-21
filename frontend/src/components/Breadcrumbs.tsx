import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm mb-6" aria-label="Breadcrumb">
      <Link
        to="/events"
        className="text-gray-400 hover:text-primary-400 transition-colors flex items-center"
      >
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4 text-gray-600" />
            {isLast || !item.href ? (
              <span className={`${isLast ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="text-gray-400 hover:text-primary-400 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}



