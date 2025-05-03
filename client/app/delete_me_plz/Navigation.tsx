import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { isAdmin } from '@/lib/api';

// Regular user navigation
function UserNavigation({ pathname }: { pathname: string }) {
  return (
    <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
      <Link
        href="/"
        className={`${
          pathname === '/'
            ? 'border-indigo-500 text-gray-900'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
      >
        Home
      </Link>
      <Link
        href="/recipes"
        className={`${
          pathname === '/recipes'
            ? 'border-indigo-500 text-gray-900'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
      >
        Recipes
      </Link>
    </div>
  );
}

// Admin navigation
function AdminNavigation({ pathname }: { pathname: string }) {
  return (
    <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
      <Link
        href="/"
        className={`${
          pathname === '/'
            ? 'border-indigo-500 text-gray-900'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
      >
        Home
      </Link>
      <Link
        href="/recipes"
        className={`${
          pathname === '/recipes'
            ? 'border-indigo-500 text-gray-900'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
      >
        Recipes
      </Link>
      <Link
        href="/admin"
        className={`${
          pathname === '/admin'
            ? 'border-indigo-500 text-gray-900'
            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
      >
        Admin
      </Link>
    </div>
  );
}

// Main Navigation component
export default function Navigation() {
  const pathname = usePathname();
  const [isUserAdmin, setIsUserAdmin] = useState<boolean>(false);

  useEffect(() => {
    // Check admin status from localStorage
    const checkAdmin = async () => {
      const admin = await isAdmin();
      setIsUserAdmin(admin);
    };
    checkAdmin();
  }, []);

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                Coffee Assistant
              </Link>
            </div>
            {isUserAdmin ? (
              <AdminNavigation pathname={pathname} />
            ) : (
              <UserNavigation pathname={pathname} />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 