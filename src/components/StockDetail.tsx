import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Stock } from '../lib/types';
import { HealthBadge, CategoryBadge } from './ui/Badge';
import { formatCurrency, formatLargeNumber } from '../lib/utils';
import { X, TrendingUp, Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
import { analyzeStockWithAI, isAIConfigured } from '../lib/openai';

interface StockDetailProps {
  stock: Stock;
  onClose: () => void;
}

export const StockDetail = ({ stock, onClose }: StockDetailProps) => {
  const [aiAnalysis, setAiAnalysis] = useState<{ insight: string; health: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDeepAnalysis = async () => {
    if (!isAIConfigured()) {
        setError("Please add VITE_OPENAI_API_KEY to .env to use this feature.");
        return;
    }
    setIsLoading(true);
    try {
        const result = await analyzeStockWithAI(stock);
        setAiAnalysis(result);
    } catch (e) {
        setError("Analysis failed. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };
  
  // Chart Options
  const earningsOption = {
    title: { text: 'Quarterly Earnings Trend', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: stock.history.map(h => h.period) },
    yAxis: { type: 'value' },
    series: [{
      data: stock.history.map(h => h.earnings),
      type: 'bar',
      itemStyle: { color: '#4f46e5' },
      name: 'Earnings'
    }],
    grid: { top: 40, bottom: 30, left: 50, right: 20 }
  };

  const revenueOption = {
    title: { text: 'Revenue Growth', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: stock.history.map(h => h.period) },
    yAxis: { type: 'value' },
    series: [{
      data: stock.history.map(h => h.revenue),
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.2 },
      itemStyle: { color: '#10b981' },
      name: 'Revenue'
    }],
    grid: { top: 40, bottom: 30, left: 50, right: 20 }
  };

  const currentInsight = aiAnalysis ? aiAnalysis.insight : stock.aiInsight;
  const currentHealth = aiAnalysis ? (aiAnalysis.health as any) : stock.aiHealth;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{stock.name}</h2>
                <span className="text-sm font-mono text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">{stock.symbol}</span>
                {stock.market === 'IN' && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">India</span>}
            </div>
            <div className="flex gap-2">
                <HealthBadge status={currentHealth} />
                <CategoryBadge category={stock.aiCategory} />
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            {/* AI Insight Section */}
            <div className={`border rounded-xl p-5 mb-8 flex gap-4 items-start transition-colors ${aiAnalysis ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`p-2 rounded-lg shrink-0 ${aiAnalysis ? 'bg-indigo-100' : 'bg-gray-200'}`}>
                    {aiAnalysis ? <Sparkles className="w-6 h-6 text-indigo-600" /> : <TrendingUp className="w-6 h-6 text-gray-600" />}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <h3 className={`font-semibold mb-1 ${aiAnalysis ? 'text-indigo-900' : 'text-gray-900'}`}>
                            {aiAnalysis ? "Real-time AI Analysis" : "Automated Analysis"}
                        </h3>
                        {!aiAnalysis && (
                            <button 
                                onClick={handleDeepAnalysis}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70"
                            >
                                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><BrainCircuit className="w-3 h-3" /> Deep Analyze</>}
                            </button>
                        )}
                    </div>
                    
                    <p className={`leading-relaxed ${aiAnalysis ? 'text-indigo-800' : 'text-gray-600'}`}>
                        {currentInsight}
                    </p>
                    {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs text-gray-500 uppercase mb-1">Current Price</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(stock.price, stock.market)}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs text-gray-500 uppercase mb-1">P/E Ratio</div>
                    <div className={`text-xl font-bold ${stock.peRatio < 20 ? 'text-green-600' : 'text-gray-900'}`}>{stock.peRatio}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs text-gray-500 uppercase mb-1">Debt/Equity</div>
                    <div className={`text-xl font-bold ${stock.debtToEquity > 2 ? 'text-red-600' : 'text-green-600'}`}>{stock.debtToEquity}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xs text-gray-500 uppercase mb-1">Market Cap</div>
                    <div className="text-xl font-bold text-gray-900">{formatLargeNumber(stock.marketCap, stock.market)}</div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <ReactECharts option={earningsOption} style={{ height: '300px' }} />
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <ReactECharts option={revenueOption} style={{ height: '300px' }} />
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};
