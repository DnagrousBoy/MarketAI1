import { faker } from "@faker-js/faker";
import { Stock, StockCategory, HealthStatus, FinancialHistory, MarketType } from "./types";

// Seed for consistent results during dev
faker.seed(456);

const SECTORS = [
  "Technology", "Healthcare", "Financials", "Consumer Discretionary", 
  "Industrials", "Energy", "Utilities", "Real Estate", "Materials"
];

const INDIAN_SUFFIXES = ["Ltd", "Limited", "Industries", "Ventures", "India"];
const GLOBAL_SUFFIXES = ["Inc", "Corp", "Group", "Holdings", "PLC"];

const generateHistory = (baseRevenue: number, baseEarnings: number, baseDebt: number): FinancialHistory[] => {
  const history: FinancialHistory[] = [];
  const quarters = ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025"];
  
  let currentRev = baseRevenue * 0.8; // Start a bit lower to show trend
  let currentEarn = baseEarnings * 0.8;
  let currentDebt = baseDebt;

  quarters.forEach(q => {
    // Random fluctuation
    const growthFactor = faker.number.float({ min: 0.95, max: 1.15 }); 
    currentRev *= growthFactor;
    currentEarn *= growthFactor * faker.number.float({ min: 0.9, max: 1.1 }); // Earnings more volatile
    currentDebt *= faker.number.float({ min: 0.98, max: 1.05 });

    history.push({
      period: q,
      revenue: currentRev,
      earnings: currentEarn,
      debt: currentDebt
    });
  });

  return history;
};

const generateAIAnalysis = (
  pe: number, 
  earningsGrowth: number, 
  revenueGrowth: number, 
  debt: number,
  divYield: number
): { category: StockCategory; health: HealthStatus; score: number; insight: string } => {
  let score = 50;
  
  // Scoring Logic
  if (pe < 20 && pe > 0) score += 15;
  if (pe > 50) score -= 15;
  if (earningsGrowth > 15) score += 20;
  if (earningsGrowth < 0) score -= 20;
  if (revenueGrowth > 10) score += 10;
  if (debt < 1.0) score += 15;
  if (debt > 2.0) score -= 20;
  if (divYield > 3) score += 5;

  score = Math.max(0, Math.min(100, score));

  // Categorization Logic
  let category: StockCategory = "Fairly Valued";
  let health: HealthStatus = "Average";

  if (score >= 75) health = "Strong";
  else if (score <= 40) health = "Risky";

  if (pe < 25 && earningsGrowth > 15 && debt < 1.5) {
    category = "Undervalued & Growing";
  } else if (earningsGrowth > 25 && revenueGrowth > 20) {
    category = "High Growth";
  } else if (pe > 60 || (pe < 0 && pe > -100)) { 
    category = "Overvalued";
  } else if (debt > 2.5 || earningsGrowth < -10) {
    category = "Risky";
  }

  // Insight Generation
  const insights = [];
  if (health === "Strong") insights.push("Solid fundamentals across the board");
  if (earningsGrowth > 20) insights.push("Exceptional earnings momentum");
  if (pe < 15) insights.push("Trading at a discount to industry");
  if (debt > 2.0) insights.push("High leverage concerns detected");
  if (revenueGrowth > 15) insights.push("Strong top-line expansion");
  
  const insight = insights.length > 0 
    ? insights.join(". ") + "." 
    : "Stable performance consistent with sector averages.";

  return { category, health, score, insight };
};

// Generate stocks
export const generateStocks = (count: number = 10000): Stock[] => {
  const stocks: Stock[] = [];

  for (let i = 0; i < count; i++) {
    const isIndian = Math.random() > 0.5;
    const market: MarketType = isIndian ? "IN" : "GLOBAL";
    
    // Adjust currency scale: INR is usually smaller unit value but larger counts
    const priceBase = isIndian ? faker.finance.amount({ min: 50, max: 5000, dec: 2 }) : faker.finance.amount({ min: 10, max: 1000, dec: 2 });
    const price = parseFloat(priceBase);
    
    const peRatio = parseFloat(faker.finance.amount({ min: 5, max: 150, dec: 2 }));
    const earningsGrowth = faker.number.float({ min: -20, max: 80, fractionDigits: 1 });
    const revenueGrowth = faker.number.float({ min: -10, max: 50, fractionDigits: 1 });
    const debtToEquity = faker.number.float({ min: 0, max: 5, fractionDigits: 2 });
    const dividendYield = faker.number.float({ min: 0, max: 8, fractionDigits: 2 });
    
    const analysis = generateAIAnalysis(peRatio, earningsGrowth, revenueGrowth, debtToEquity, dividendYield);

    // Generate Name
    const suffix = isIndian ? faker.helpers.arrayElement(INDIAN_SUFFIXES) : faker.helpers.arrayElement(GLOBAL_SUFFIXES);
    const companyName = `${faker.company.name().split(' ')[0]} ${suffix}`;
    
    const symbol = isIndian 
        ? (companyName.substring(0, 4).toUpperCase() + (Math.random() > 0.8 ? ".NS" : ".BO"))
        : faker.finance.currencyCode();

    // Generate History
    const baseRevenue = faker.number.int({ min: 1000000, max: 50000000 });
    const baseEarnings = baseRevenue * (faker.number.float({ min: 0.05, max: 0.25 }));
    const history = generateHistory(baseRevenue, baseEarnings, debtToEquity);

    stocks.push({
      id: faker.string.uuid(),
      symbol,
      name: companyName,
      sector: faker.helpers.arrayElement(SECTORS),
      market,
      price,
      peRatio,
      earningsGrowth,
      revenueGrowth,
      debtToEquity,
      dividendYield,
      marketCap: faker.number.int({ min: 100000000, max: 2000000000000 }),
      lastReportDate: faker.date.recent({ days: 90 }).toISOString().split('T')[0],
      aiCategory: analysis.category,
      aiHealth: analysis.health,
      aiScore: analysis.score,
      aiInsight: analysis.insight,
      history
    });
  }
  return stocks;
};
