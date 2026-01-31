import { FilterState, Stock, FinancialHistory } from "./types";

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Helper to check if key is configured
export const isAIConfigured = () => {
  return API_KEY && API_KEY !== "YOUR_API_KEY";
};

// 1. AI Search: Convert Natural Language to FilterState
export const generateFiltersFromQuery = async (query: string, currentFilters: FilterState): Promise<Partial<FilterState>> => {
  if (!isAIConfigured()) {
    throw new Error("OpenAI API Key not configured");
  }

  const prompt = `
    You are a financial data assistant. Convert the user's natural language query into a JSON filter object for a stock database.
    
    Current Filter Schema:
    - search: string (for name/symbol/sector text match)
    - minPe: number (default 0)
    - maxPe: number (default 150)
    - minGrowth: number (Earnings Growth %, default -50)
    - maxDebt: number (Debt/Equity ratio, default 5)
    - categories: array of strings ["Undervalued & Growing", "High Growth", "Fairly Valued", "Risky", "Overvalued"]
    - market: "ALL" | "IN" | "GLOBAL"

    User Query: "${query}"

    Rules:
    - Return ONLY valid JSON.
    - If user mentions "Indian" or "India", set market to "IN".
    - If user mentions "Global" or "US", set market to "GLOBAL".
    - "Undervalued" usually means maxPe < 20.
    - "High Growth" usually means minGrowth > 15.
    - "Safe" or "Low Risk" usually means maxDebt < 1.0.
    - Only include fields that need changing from defaults.
  `;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using a fast model
        messages: [{ role: "system", content: "You are a JSON generator." }, { role: "user", content: prompt }],
        temperature: 0.1
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from potential markdown code blocks
    const jsonString = content.replace(/```json\n|\n```/g, "").trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("AI Filter Error:", error);
    throw error;
  }
};

// 2. AI Classification: Analyze specific stock history
export const analyzeStockWithAI = async (stock: Stock): Promise<{ insight: string; health: "Strong" | "Average" | "Risky" }> => {
  if (!isAIConfigured()) {
    throw new Error("OpenAI API Key not configured");
  }

  const historyStr = stock.history.map(h => 
    `${h.period}: Rev ${h.revenue.toFixed(0)}, Earn ${h.earnings.toFixed(0)}, Debt ${h.debt.toFixed(2)}`
  ).join("\n");

  const prompt = `
    Analyze the following quarterly financial results for ${stock.name} (${stock.symbol}).
    
    Financial Context:
    - P/E Ratio: ${stock.peRatio}
    - Debt/Equity: ${stock.debtToEquity}
    - Sector: ${stock.sector}
    
    Quarterly History:
    ${historyStr}

    Task:
    1. Determine the Health Status: "Strong", "Average", or "Risky".
    2. Write a concise 2-sentence insight explaining why, focusing on the trend of earnings and debt.
    
    Output Format (JSON):
    {
      "health": "Strong" | "Average" | "Risky",
      "insight": "Your explanation here."
    }
  `;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const jsonString = content.replace(/```json\n|\n```/g, "").trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("AI Analysis Error:", error);
    // Fallback to existing data if API fails
    return { insight: stock.aiInsight, health: stock.aiHealth };
  }
};
