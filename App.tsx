import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { NewsCard } from './components/NewsCard';
import { SettingsModal } from './components/SettingsModal';
import { fetchCuratedNews, analyzePreferences } from './services/geminiService';
import { sendToSlack, formatSlackMessage } from './services/slackService';
import { NewsItem, UserPreferences, LoadingState } from './types';
import { RefreshCw, Send, BrainCircuit, Copy, Check } from 'lucide-react';

const DEFAULT_PREFS: UserPreferences = {
  likedCategories: [],
  dislikedCategories: [],
  keywords: ['Technology', 'Global Economy', 'Science'],
  webhookUrl: ''
};

const App: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [dislikedIds, setDislikedIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load prefs from local storage
  useEffect(() => {
    const saved = localStorage.getItem('userPrefs');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  const savePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('userPrefs', JSON.stringify(newPrefs));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGenerateNews = async () => {
    setLoadingState(LoadingState.LOADING);
    try {
      const items = await fetchCuratedNews(preferences);
      setNews(items);
      setLoadingState(LoadingState.SUCCESS);
      setLikedIds(new Set());
      setDislikedIds(new Set());
    } catch (error) {
      console.error(error);
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleSlackSend = async () => {
    if (!preferences.webhookUrl) {
      setIsSettingsOpen(true);
      showToast("Please configure Slack Webhook URL first.");
      return;
    }

    const payload = formatSlackMessage(news);
    
    try {
      await sendToSlack(preferences.webhookUrl, payload);
      showToast("Sent to Slack!");
    } catch (error) {
      // Fallback for CORS issues
      showToast("Webhook trigger failed (CORS). Copied payload to clipboard!");
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    }
  };

  const handleCopyToClipboard = async () => {
    const payload = formatSlackMessage(news);
    const text = payload.blocks 
      ? payload.blocks.filter((b: any) => b.type === 'section').map((b: any) => b.text.text).join('\n\n')
      : payload.text;
      
    try {
      await navigator.clipboard.writeText(text);
      showToast("Digest copied to clipboard!");
    } catch (err) {
      showToast("Failed to copy.");
    }
  };

  const handleLike = (id: string) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        setDislikedIds(d => { const n = new Set(d); n.delete(id); return n; });
      }
      return next;
    });
  };

  const handleDislike = (id: string) => {
    setDislikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        setLikedIds(l => { const n = new Set(l); n.delete(id); return n; });
      }
      return next;
    });
  };

  // Learning mechanism: Analyze likes to update preferences
  const handleLearnPreferences = async () => {
    const likedItems = news.filter(n => likedIds.has(n.id));
    if (likedItems.length === 0) {
      showToast("Like some articles first to learn!");
      return;
    }

    showToast("Analyzing your preferences...");
    const result = await analyzePreferences(likedItems);
    
    const newKeywords = Array.from(new Set([...preferences.keywords, ...result.keywords])).slice(0, 10);
    const newCategories = Array.from(new Set([...preferences.likedCategories, ...result.categories])).slice(0, 10);

    const newPrefs = {
      ...preferences,
      keywords: newKeywords,
      likedCategories: newCategories
    };

    savePreferences(newPrefs);
    showToast("Preferences updated based on your feedback!");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Controls */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Today's Digest</h2>
            <p className="text-gray-500 text-sm mt-1">
              Top 10 stories balanced between global impact and your interests.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {news.length > 0 && (
              <>
                 <button
                  onClick={handleLearnPreferences}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                  title="Update preferences based on liked items"
                >
                  <BrainCircuit className="w-4 h-4" /> Learn
                </button>
                <button
                  onClick={handleCopyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
                <button
                  onClick={handleSlackSend}
                  className="flex items-center gap-2 px-4 py-2 bg-[#4A154B] text-white rounded-lg hover:bg-[#3b113c] transition-colors text-sm font-medium shadow-sm"
                >
                  <Send className="w-4 h-4" /> Send to Slack
                </button>
              </>
            )}
            <button
              onClick={handleGenerateNews}
              disabled={loadingState === LoadingState.LOADING}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium shadow-sm"
            >
              {loadingState === LoadingState.LOADING ? (
                <>Generating...</>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" /> {news.length === 0 ? "Generate Digest" : "Refresh News"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loadingState === LoadingState.LOADING && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        )}

        {loadingState === LoadingState.IDLE && news.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <NewspaperPlaceholder />
            <p className="text-gray-500 mt-4">Click "Generate Digest" to fetch the latest world news using AI.</p>
          </div>
        )}

        {loadingState === LoadingState.ERROR && (
          <div className="text-center py-10 bg-red-50 rounded-xl border border-red-100 text-red-600">
            An error occurred while fetching news. Please check your API Key and try again.
          </div>
        )}

        {news.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                onLike={handleLike}
                onDislike={handleDislike}
                liked={likedIds.has(item.id)}
                disliked={dislikedIds.has(item.id)}
              />
            ))}
          </div>
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onSave={savePreferences}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-fade-in-up z-50">
          <Check className="w-4 h-4 text-green-400" />
          {toastMessage}
        </div>
      )}
    </div>
  );
};

const NewspaperPlaceholder = () => (
  <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
);

export default App;
