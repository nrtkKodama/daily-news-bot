import React from 'react';
import { Newspaper, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Newspaper className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Global News Curator</h1>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};
