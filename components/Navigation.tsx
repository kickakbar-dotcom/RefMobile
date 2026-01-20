
import React from 'react';
import { User, UserRole } from '../types';

interface NavigationProps {
  user: User | null;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ user, onLogout }) => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">RefMobile</span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
