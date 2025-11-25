import React from 'react';
import { NewsItem } from '../types';
import { ThumbsUp, ThumbsDown, ExternalLink, Globe } from 'lucide-react';

interface NewsCardProps {
  item: NewsItem;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  liked: boolean;
  disliked: boolean;
}

export const NewsCard: React.FC<NewsCardProps> = ({ item, onLike, onDislike, liked, disliked }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-2">
          <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
            item.relevanceScore > 80 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {item.category}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Globe className="w-3 h-3" /> {item.relevanceScore}% Relevance
          </span>
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
            {item.title}
          </a>
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {item.summary}
        </p>

        <div className="text-xs text-gray-400 mb-4 italic">
           Why: {item.reasonForSelection}
        </div>
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <a 
          href={item.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 font-medium flex items-center gap-1 hover:underline"
        >
          Source <ExternalLink className="w-3 h-3" />
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onLike(item.id)}
            className={`p-1.5 rounded-full transition-colors ${
              liked ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-gray-200'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDislike(item.id)}
            className={`p-1.5 rounded-full transition-colors ${
              disliked ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-200'
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
