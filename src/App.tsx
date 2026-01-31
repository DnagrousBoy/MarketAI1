import React, { useState, useMemo, useEffect } from "react";
import { generateStocks } from "./lib/data";
import { StockTable } from "./components/StockTable";
import { Sidebar } from "./components/Sidebar";
import { StockDetail } from "./components/StockDetail";
import { FilterState, Stock } from "./lib/types";
import { Download, Share2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";

function App() {
  // Generate data once on mount
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  useEffect(() => {
    // Simulate async loading of large dataset
    const timer = setTimeout(() => {
        const data = generateStocks(10000);
        setAllStocks(data);
        setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    minPe: 0,
    maxPe: 150,
    minGrowth: -50,
    maxDebt: 5,
    categories: [],
    market: "ALL"
  });

  // Filter Logic
  const filteredStocks = useMemo(() => {
    return allStocks.filter(stock => {
        // Market Scope
        if (filters.market !== "ALL" && stock.market !== filters.market) return false;

        // Search
        if (filters.search) {
            const query = filters.search.toLowerCase();
            const matches = 
                stock.symbol.toLowerCase().includes(query) || 
                stock.name.toLowerCase().includes(query) ||
                stock.sector.toLowerCase().includes(query);
            if (!matches) return false;
        }

        // Categories
        if (filters.categories.length > 0) {
            if (!filters.categories.includes(stock.aiCategory)) return false;
        }

        // Numeric Filters
        if (stock.peRatio > filters.maxPe) return false;
        if (stock.earningsGrowth < filters.minGrowth) return false;
        if (stock.debtToEquity > filters.maxDebt) return false;

        return true;
    });
  }, [allStocks, filters]);

  const exportData = () => {
    const headers = ["Symbol", "Name", "Market", "Category", "Price", "P/E", "Earn Growth", "Rev Growth", "Debt/Eq", "Insight"];
    const csvContent = [
        headers.join(","),
        ...filteredStocks.slice(0, 1000).map(s => [
            s.symbol, 
            `"${s.name}"`, 
            s.market,
            s.aiCategory, 
            s.price, 
            s.peRatio, 
            s.earningsGrowth, 
            s.revenueGrowth, 
            s.debtToEquity, 
            `"${s.aiInsight}"`
        ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "market_analysis_export.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium animate-pulse">Initializing AI Analysis Engine...</p>
            <p className="text-xs text-gray-400">Processing 10,000+ Market Records</p>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      <Sidebar 
        filters={filters} 
        setFilters={setFilters} 
        totalCount={allStocks.length}
        filteredCount={filteredStocks.length}
      />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0 z-10">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Quarterly Analysis Dashboard</h2>
                <p className="text-xs text-gray-500">Real-time AI evaluation of {filteredStocks.length.toLocaleString()} matches</p>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={exportData}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <Download className="w-4 h-4" /> Export CSV
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                    <Share2 className="w-4 h-4" /> Share Report
                </button>
            </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6 flex-shrink-0">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">Strong Companies</div>
                    <div className="text-2xl font-bold text-emerald-600">
                        {filteredStocks.filter(s => s.aiHealth === "Strong").length.toLocaleString()}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">Avg Growth (QoQ)</div>
                    <div className="text-2xl font-bold text-indigo-600">
                        {(filteredStocks.reduce((acc, curr) => acc + curr.earningsGrowth, 0) / (filteredStocks.length || 1)).toFixed(1)}%
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">Avg P/E Ratio</div>
                    <div className="text-2xl font-bold text-gray-800">
                        {(filteredStocks.reduce((acc, curr) => acc + curr.peRatio, 0) / (filteredStocks.length || 1)).toFixed(1)}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">Market Scope</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {filters.market === 'ALL' ? 'Global + India' : filters.market === 'IN' ? 'India Only' : 'Global Only'}
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 min-h-0">
                <StockTable 
                    data={filteredStocks} 
                    onStockClick={setSelectedStock}
                />
            </div>
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
            {selectedStock && (
                <StockDetail 
                    stock={selectedStock} 
                    onClose={() => setSelectedStock(null)} 
                />
            )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
