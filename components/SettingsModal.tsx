import React, { useState, useEffect } from 'react';
import { UserPreferences } from '../types';
import { X, Save, Download, Terminal, FileJson, FileCode } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSave: (prefs: UserPreferences) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, preferences, onSave }) => {
  const [webhook, setWebhook] = useState(preferences.webhookUrl);
  const [keywords, setKeywords] = useState(preferences.keywords.join(', '));
  const [liked, setLiked] = useState(preferences.likedCategories.join(', '));
  const [disliked, setDisliked] = useState(preferences.dislikedCategories.join(', '));

  useEffect(() => {
    if (isOpen) {
      setWebhook(preferences.webhookUrl);
      setKeywords(preferences.keywords.join(', '));
      setLiked(preferences.likedCategories.join(', '));
      setDisliked(preferences.dislikedCategories.join(', '));
    }
  }, [isOpen, preferences]);

  const handleSave = () => {
    onSave({
      webhookUrl: webhook,
      keywords: keywords.split(',').map(s => s.trim()).filter(s => s),
      likedCategories: liked.split(',').map(s => s.trim()).filter(s => s),
      dislikedCategories: disliked.split(',').map(s => s.trim()).filter(s => s),
    });
    onClose();
  };

  const handleDownloadScript = () => {
    const scriptContent = `
/**
 * Global News Curator - Automation Script
 * 
 * 実行方法:
 * 1. Node.js (v18以上) をインストール
 * 2. 必要なパッケージをインストール: npm install
 * 3. 環境変数を設定して実行: 
 *    export API_KEY="あなたのGemini_API_KEY"
 *    node daily-news-bot.js
 */

import { GoogleGenAI } from "@google/genai";

// 設定（アプリから引き継いだ設定）
const CONFIG = {
  webhookUrl: "${webhook || 'ここにWebhook_URLを設定'}",
  keywords: ${JSON.stringify(keywords.split(',').map(s => s.trim()).filter(s => s))},
  likedCategories: ${JSON.stringify(liked.split(',').map(s => s.trim()).filter(s => s))},
  dislikedCategories: ${JSON.stringify(disliked.split(',').map(s => s.trim()).filter(s => s))}
};

async function main() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("Error: API_KEY environment variable is missing.");
    process.exit(1);
  }

  if (!CONFIG.webhookUrl || CONFIG.webhookUrl.includes("hooks.slack.com") === false) {
    console.error("Error: Valid Slack Webhook URL is required.");
    process.exit(1);
  }

  console.log("🌍 Fetching curated news...");
  const ai = new GoogleGenAI({ apiKey });
  
  const likedStr = CONFIG.likedCategories.length > 0 ? CONFIG.likedCategories.join(", ") : "None";
  const dislikedStr = CONFIG.dislikedCategories.length > 0 ? CONFIG.dislikedCategories.join(", ") : "None";
  const keywordsStr = CONFIG.keywords.length > 0 ? CONFIG.keywords.join(", ") : "None";

  const prompt = \`
    You are an expert news editor for a daily digest.
    Task: Select exactly 10 distinct important global news stories from the last 24 hours.
    Balance: 70% Global Importance, 30% User Preference.
    
    User Profile:
    - Interests: \${keywordsStr}
    - Liked: \${likedStr}
    - Disliked: \${dislikedStr}

    Output Format: JSON array of objects with keys: title (Japanese), summary (Japanese), category, relevanceScore, reasonForSelection, url, source.
  \`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const text = response.text;
    const jsonMatch = text.match(/\`\`\`json\\n([\\s\\S]*?)\\n\`\`\`/) || text.match(/\`\`\`([\\s\\S]*?)\`\`\`/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    const newsItems = JSON.parse(jsonString);

    console.log(\`✅ Found \${newsItems.length} articles. Sending to Slack...\`);
    await sendToSlack(newsItems);
    console.log("🚀 Done!");

  } catch (error) {
    console.error("Execution failed:", error);
    process.exit(1);
  }
}

async function sendToSlack(news) {
  const date = new Date().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' });
  
  const blocks = [
    { type: "header", text: { type: "plain_text", text: \`🌍 Daily Global News Digest - \${date}\`, emoji: true } },
    { type: "divider" }
  ];

  news.forEach((item, index) => {
    const icon = item.relevanceScore > 80 ? "🔥" : "📰";
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: \`*\${index + 1}. \${icon} \${item.title}*\\n\${item.summary}\\n_\${item.source || 'Unknown'}_ | <\${item.url || '#'}|Read More>\`
      }
    });
  });

  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: "Curated by AI based on global importance and your preferences." }]
  });

  await fetch(CONFIG.webhookUrl, {
    method: 'POST',
    body: JSON.stringify({ text: \`Daily News Digest - \${date}\`, blocks }),
    headers: { 'Content-Type': 'application/json' }
  });
}

main();
    `;
    downloadFile(scriptContent, 'daily-news-bot.js', 'text/javascript');
  };

  const handleDownloadPackageJson = () => {
    const packageJson = {
      "name": "daily-news-bot",
      "version": "1.0.0",
      "type": "module",
      "description": "Automated Daily News Curator",
      "main": "daily-news-bot.js",
      "scripts": {
        "start": "node daily-news-bot.js"
      },
      "dependencies": {
        "@google/genai": "^1.0.0"
      },
      "engines": {
        "node": ">=20.0.0"
      }
    };
    downloadFile(JSON.stringify(packageJson, null, 2), 'package.json', 'application/json');
  };

  const handleDownloadWorkflow = () => {
    const workflowContent = `name: Daily Global News

on:
  schedule:
    # 毎日 日本時間 朝7:00 (UTC 22:00) に実行
    - cron: '0 22 * * *'
  # 手動実行用
  workflow_dispatch:

jobs:
  run-bot:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Debug - List files
        run: ls -la

      - name: Run News Bot
        env:
          API_KEY: \${{ secrets.API_KEY }}
        run: node daily-news-bot.js
`;
    downloadFile(workflowContent, 'daily-news.yml', 'text/yaml');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* General Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Preferences</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slack Webhook URL</label>
              <input
                type="text"
                value={webhook}
                onChange={(e) => setWebhook(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interests (Keywords)</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="AI, Space, Economy, Climate..."
                className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Liked Categories</label>
              <input
                type="text"
                value={liked}
                onChange={(e) => setLiked(e.target.value)}
                className="w-full rounded-lg border-gray-300 border p-2 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Disliked Categories</label>
              <input
                type="text"
                value={disliked}
                onChange={(e) => setDisliked(e.target.value)}
                className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Automation Section */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-5 h-5 text-gray-700" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Automation Setup</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 mb-3">
                1. Download all 3 files below.<br/>
                2. Upload <b>package.json</b> and <b>daily-news-bot.js</b> to the <span className="font-bold text-red-600">ROOT</span> of your GitHub repo.<br/>
                3. Place <b>daily-news.yml</b> inside <code>.github/workflows/</code> folder in the repo.
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <button 
                    onClick={handleDownloadScript}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-900 transition-colors text-xs font-medium"
                    >
                    <Download className="w-4 h-4" /> daily-news-bot.js
                    </button>
                    <button 
                    onClick={handleDownloadPackageJson}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
                    >
                    <FileJson className="w-4 h-4" /> package.json
                    </button>
                </div>
                <button 
                  onClick={handleDownloadWorkflow}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-100 text-indigo-800 px-3 py-2 rounded-lg hover:bg-indigo-200 transition-colors text-xs font-medium"
                >
                  <FileCode className="w-4 h-4" /> daily-news.yml (Workflow)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};