
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
  webhookUrl: "https://hooks.slack.com/services/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",
  keywords: ["Technology","Global Economy","Science"],
  likedCategories: [],
  dislikedCategories: []
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

  const prompt = `
    You are an expert news editor for a daily digest.
    Task: Select exactly 10 distinct important global news stories from the last 24 hours.
    Balance: 70% Global Importance, 30% User Preference.
    
    User Profile:
    - Interests: ${keywordsStr}
    - Liked: ${likedStr}
    - Disliked: ${dislikedStr}

    Output Format: JSON array of objects with keys: title (Japanese), summary (Japanese), category, relevanceScore, reasonForSelection, url, source.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const text = response.text;
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    const newsItems = JSON.parse(jsonString);

    console.log(`✅ Found ${newsItems.length} articles. Sending to Slack...`);
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
    { type: "header", text: { type: "plain_text", text: `🌍 Daily Global News Digest - ${date}`, emoji: true } },
    { type: "divider" }
  ];

  news.forEach((item, index) => {
    const icon = item.relevanceScore > 80 ? "🔥" : "📰";
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${index + 1}. ${icon} ${item.title}*\n${item.summary}\n_${item.source || 'Unknown'}_ | <${item.url || '#'}|Read More>`
      }
    });
  });

  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: "Curated by AI based on global importance and your preferences." }]
  });

  await fetch(CONFIG.webhookUrl, {
    method: 'POST',
    body: JSON.stringify({ text: `Daily News Digest - ${date}`, blocks }),
    headers: { 'Content-Type': 'application/json' }
  });
}

main();
    
