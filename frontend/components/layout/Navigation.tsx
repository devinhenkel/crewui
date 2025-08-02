'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Users, ListTodo, GitBranch, Play } from 'lucide-react';

const navigation = [
  { name: 'Agents', href: '/agents', icon: Users, color: 'blue' },
  { name: 'Tasks', href: '/tasks', icon: ListTodo, color: 'green' },
  { name: 'Processes', href: '/processes', icon: GitBranch, color: 'purple' },
  { name: 'Executions', href: '/executions', icon: Play, color: 'orange' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              CrewAI Platform
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const colorClasses = {
                  blue: isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50',
                  green: isActive ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:text-green-700 hover:bg-green-50',
                  purple: isActive ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:text-purple-700 hover:bg-purple-50',
                  orange: isActive ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:text-orange-700 hover:bg-orange-50',
                };
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      colorClasses[item.color as keyof typeof colorClasses]
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 