import React from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  DocumentTextIcon,
  ClockIcon,
  CreditCardIcon,
  ChartBarIcon,
  ArrowRightIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../stores/authStore';

const DashboardPage: React.FC = () => {
  const { user, getUserDisplayName } = useAuthStore();

  const stats = [
    {
      name: 'Total Notes Generated',
      value: '24',
      icon: DocumentTextIcon,
      change: '+12%',
      changeType: 'increase',
    },
    {
      name: 'Credits Remaining',
      value: user?.credits?.toString() || '0',
      icon: CreditCardIcon,
      change: '-5',
      changeType: 'decrease',
    },
    {
      name: 'Time Saved',
      value: '4.2 hrs',
      icon: ClockIcon,
      change: '+2.1 hrs',
      changeType: 'increase',
    },
    {
      name: 'This Week',
      value: '8',
      icon: ChartBarIcon,
      change: '+3',
      changeType: 'increase',
    },
  ];

  const quickActions = [
    {
      name: 'Generate New Note',
      description: 'Create a new AI-powered note',
      href: '/generate',
      icon: PlusIcon,
      color: 'bg-primary-600 hover:bg-primary-700',
    },
    {
      name: 'View Notes History',
      description: 'Browse your previous notes',
      href: '/notes',
      icon: DocumentTextIcon,
      color: 'bg-secondary-600 hover:bg-secondary-700',
    },
    {
      name: 'Complete Setup',
      description: 'Finish configuring your account',
      href: '/setup',
      icon: CogIcon,
      color: 'bg-warning-600 hover:bg-warning-700',
      show: !user?.hasCompletedSetup,
    },
  ];

  const recentNotes = [
    {
      id: '1',
      title: 'Daily Progress Note - Client A',
      date: '2025-01-27',
      time: '2:30 PM',
      type: 'Progress Note',
    },
    {
      id: '2',
      title: 'Weekly Summary - Client B',
      date: '2025-01-26',
      time: '4:15 PM',
      type: 'Summary',
    },
    {
      id: '3',
      title: 'Assessment Note - Client C',
      date: '2025-01-25',
      time: '10:45 AM',
      type: 'Assessment',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {getUserDisplayName()}!
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Here's what's happening with your notes today.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user?.tier === 'premium' ? 'bg-purple-100 text-purple-800' :
              user?.tier === 'paid' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {user?.tier || 'free'} plan
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.filter(action => action.show !== false).map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div>
                <span className={`rounded-lg inline-flex p-3 text-white ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">
                  {action.name}
                  <span className="absolute inset-0" />
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {action.description}
                </p>
              </div>
              <span className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400">
                <ArrowRightIcon className="h-6 w-6" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Notes */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Notes</h2>
            <Link
              to="/notes"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {recentNotes.map((note) => (
            <div key={note.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {note.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {note.type} • {note.date} at {note.time}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button className="text-sm text-primary-600 hover:text-primary-500">
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {recentNotes.length === 0 && (
          <div className="px-6 py-8 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notes yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first note.
            </p>
            <div className="mt-6">
              <Link
                to="/generate"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Generate Note
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Setup Reminder */}
      {!user?.hasCompletedSetup && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <CogIcon className="h-5 w-5 text-warning-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-warning-800">
                Complete your setup
              </h3>
              <div className="mt-2 text-sm text-warning-700">
                <p>
                  To get the most out of SwiftNotes, please complete your account setup 
                  by adding your writing style and ISP tasks.
                </p>
              </div>
              <div className="mt-4">
                <div className="-mx-2 -my-1.5 flex">
                  <Link
                    to="/setup"
                    className="bg-warning-50 px-2 py-1.5 rounded-md text-sm font-medium text-warning-800 hover:bg-warning-100"
                  >
                    Complete setup
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
