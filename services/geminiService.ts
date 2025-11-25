import { GoogleGenAI } from "@google/genai";
import { NewsItem, UserPreferences } from "../types";

const parseNewsResponse = (text: string): NewsItem[] => {
  try {
    // Attempt to extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    const jsonString = jsonMatch ? jsonMatch[1] : text;
    
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any, index: number) => ({
        id: `news-${Date.now()}-${index}`,
        title: item.title || "No Title",
        summary: item.summary || "No Summary",
        url: item.url,
        source: item.source,
        category: item.category || "General",
        relevanceScore: item.relevanceScore || 50,
        reasonForSelection: item.reasonForSelection || "Global Importance",
        publishedDate: new Date().toISOString().split('T')[0]
      }));
    }
    return [];
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};

export const fetchCuratedNews = async (preferences: UserPreferences): Promise<NewsItem[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const likedStr = preferences.likedCategories.length > 0 ? preferences.likedCategories.join(", ") : "None";
  const dislikedStr = preferences.dislikedCategories.length > 0 ? preferences.dislikedCategories.join(", ") : "None";
  const keywordsStr = preferences.keywords.length > 0 ? preferences.keywords.join(", ") : "None";

  const prompt = `
    You are an expert news editor for a daily digest.
    
    Task:
    1. Search for the most important global news stories happening right now (last 24 hours).
    2. Select exactly 10 distinct news items.
    3. Balance the selection based on two factors:
       - **Global Importance (70% weight)**: Major geopolitical, economic, scientific, or humanitarian events that everyone should know.
       - **User Preference (30% weight)**: News that aligns with the user's interests.
    
    User Profile:
    - Interests/Keywords: ${keywordsStr}
    - Liked Categories: ${likedStr}
    - Disliked Categories: ${dislikedStr} (Try to avoid these unless critical)

    Output Format:
    Return a strictly valid JSON array of objects. Do not wrap in markdown unless necessary for code block.
    Each object must have:
    - title: string (Japanese)
    - summary: string (Japanese, concise 2-3 sentences)
    - category: string
    - relevanceScore: number (0-100, how well it matches criteria)
    - reasonForSelection: string (Short explanation why this was picked)
    - url: string (Source URL from search results if available)
    - source: string (Source name)
  `;

  try {
    // Note: We cannot use responseMimeType: 'application/json' when using googleSearch tool.
    // We must rely on the prompt to enforce JSON structure.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const newsItems = parseNewsResponse(text);
    
    // If parsing failed or empty, try a fallback heuristic or throw
    if (newsItems.length === 0) {
      console.warn("Raw response was not valid JSON array:", text);
      throw new Error("Failed to parse news format.");
    }

    return newsItems;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const analyzePreferences = async (likedItems: NewsItem[]): Promise<{ keywords: string[], categories: string[] }> => {
  if (likedItems.length === 0) return { keywords: [], categories: [] };

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contentToAnalyze = likedItems.map(item => `${item.title} (${item.category})`).join("\n");
  
  const prompt = `
    Analyze the following list of news articles the user liked.
    Extract 5 key topics/keywords and top 3 categories that represent their interests.
    Return JSON: { "keywords": string[], "categories": string[] }
    
    Articles:
    ${contentToAnalyze}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text;
    if (!text) return { keywords: [], categories: [] };
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Preference Analysis Error", error);
    return { keywords: [], categories: [] };
  }
}
