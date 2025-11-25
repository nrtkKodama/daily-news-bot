import { NewsItem, SlackPayload } from "../types";

export const formatSlackMessage = (news: NewsItem[]): SlackPayload => {
  const date = new Date().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' });
  
  // Explicitly type blocks as any[] to allow mixed block types (header, section, context)
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `🌍 Daily Global News Digest - ${date}`,
        emoji: true
      }
    },
    {
      type: "divider"
    }
  ];

  news.forEach((item, index) => {
    const icon = item.relevanceScore > 80 ? "🔥" : "📰";
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${index + 1}. ${icon} ${item.title}*\n${item.summary}\n_${item.source || 'Unknown Source'}_ | <${item.url || '#'}|Read More>`
      }
    });
  });

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "Curated by AI based on global importance and your preferences."
      }
    ]
  });

  return {
    text: `Daily News Digest - ${date}`,
    blocks: blocks
  };
};

export const sendToSlack = async (webhookUrl: string, payload: SlackPayload): Promise<boolean> => {
  try {
    // Note: Calling Slack Webhooks directly from the browser often fails due to CORS.
    // In a production app, this would hit a backend proxy.
    // We will attempt it, but if it fails, the UI should handle it gracefully (e.g. copy to clipboard).
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      mode: 'no-cors' // Use no-cors to attempt sending even if we can't read response
    });
    
    // With no-cors, we get an opaque response, so we assume success if no network error thrown.
    return true; 
  } catch (error) {
    console.error("Slack Send Error:", error);
    throw error;
  }
};