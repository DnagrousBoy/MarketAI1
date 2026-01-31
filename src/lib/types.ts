export type StockCategory = "Undervalued & Growing" | "Fairly Valued" | "Overvalued" | "Risky" | "High Growth";

export type HealthStatus = "Strong" | "Average" | "Risky";

export type MarketType = "IN" | "GLOBAL";

export interface FinancialHistory {
  period: string; // e.g., "Q3 2024"
  revenue: number;
  earnings: number;
  debt: number;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  market: MarketType; // New field
  price: number;
  peRatio: number;
  earningsGrowth: number; // Percentage
  revenueGrowth: number; // Percentage
  debtToEquity: number;
  dividendYield: number; // Percentage
  marketCap: number;
  lastReportDate: string;
  
  // AI Analysis Fields
  aiCategory: StockCategory;
  aiHealth: HealthStatus;
  aiScore: number; // 0-100
  aiInsight: string;

  // Historical Data for Charts
  history: FinancialHistory[];
}

export interface FilterState {
  search: string;
  minPe: number;
  maxPe: number;
  minGrowth: number;
  maxDebt: number;
  categories: StockCategory[];
  market: "ALL" | "IN" | "GLOBAL"; // New filter
}
