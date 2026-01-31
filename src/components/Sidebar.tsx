import React, { useState } from 'react';
import { FilterState, StockCategory } from '../lib/types';
import { SlidersHorizontal, Search, RefreshCw, TrendingUp, Globe, Sparkles, Loader2 } from 'lucide-react';
import { generateFiltersFromQuery, isAIConfigured } from '../lib/openai';

interface SidebarProps {
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    totalCount: number;
    filteredCount: number;
}

export const Sidebar = ({ filters, setFilters, totalCount, filteredCount }: SidebarProps) => {
    const [aiQuery, setAiQuery] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");

    const handleAiSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiQuery.trim()) return;
        
        if (!isAIConfigured()) {
            setAiError("Please add VITE_OPENAI_API_KEY to .env");
            return;
        }

        setIsAiLoading(true);
        setAiError("");

        try {
            const newFilters = await generateFiltersFromQuery(aiQuery, filters);
            setFilters(prev => ({ ...prev, ...newFilters }));
        } catch (err) {
            setAiError("Failed to interpret query. Try again.");
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const handleCategoryChange = (category: StockCategory) => {
        setFilters(prev => {
            const exists = prev.categories.includes(category);
            return {
                ...prev,
                categories: exists 
                    ? prev.categories.filter(c => c !== category)
                    : [...prev.categories, category]
            };
        });
    };

    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen overflow-y-auto sticky top-0">
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                    <div className="bg-blue-600 p-1.5 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Market<span className="text-blue-600">AI</span></h1>
                </div>
                <p className="text-xs text-gray-500 mt-1">Analyzing {totalCount.toLocaleString()} companies</p>
            </div>

            <div className="p-6 space-y-8 flex-1">
                {/* AI Natural Language Search */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100">
                    <label className="text-sm font-bold text-indigo-900 flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" /> Ask AI to Find
                    </label>
                    <form onSubmit={handleAiSearch}>
                        <textarea 
                            className="w-full text-xs p-3 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-2"
                            rows={3}
                            placeholder='e.g., "Find me safe Indian companies with high growth"'
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                        />
                        <button 
                            type="submit"
                            disabled={isAiLoading}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                        >
                            {isAiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply AI Filter"}
                        </button>
                    </form>
                    {aiError && <p className="text-[10px] text-red-500 mt-2">{aiError}</p>}
                </div>

                {/* Market Scope */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Globe className="w-4 h-4" /> Market Scope
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        <button 
                            onClick={() => setFilters(prev => ({ ...prev, market: 'ALL' }))}
                            className={`px-3 py-2 text-xs font-medium rounded-lg border ${filters.market === 'ALL' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setFilters(prev => ({ ...prev, market: 'IN' }))}
                            className={`px-3 py-2 text-xs font-medium rounded-lg border flex items-center justify-center gap-1 ${filters.market === 'IN' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            India
                        </button>
                        <button 
                            onClick={() => setFilters(prev => ({ ...prev, market: 'GLOBAL' }))}
                            className={`px-3 py-2 text-xs font-medium rounded-lg border ${filters.market === 'GLOBAL' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            Global
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Search className="w-4 h-4" /> Manual Search
                    </label>
                    <input 
                        type="text" 
                        placeholder="Symbol, Name, or Sector..." 
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>

                {/* AI Categories */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4" /> Categories
                    </label>
                    <div className="space-y-2">
                        {["Undervalued & Growing", "High Growth", "Fairly Valued", "Risky", "Overvalued"].map((cat) => (
                            <label key={cat} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                                <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={filters.categories.includes(cat as StockCategory)}
                                    onChange={() => handleCategoryChange(cat as StockCategory)}
                                />
                                {cat}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Metrics Filters */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <label className="text-sm font-semibold text-gray-900">Max P/E Ratio</label>
                            <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{filters.maxPe}</span>
                        </div>
                        <input 
                            type="range" 
                            min="5" max="150" step="1"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            value={filters.maxPe}
                            onChange={(e) => setFilters(prev => ({ ...prev, maxPe: parseInt(e.target.value) }))}
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <label className="text-sm font-semibold text-gray-900">Min Earnings Growth</label>
                            <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{filters.minGrowth}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="-20" max="50" step="1"
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            value={filters.minGrowth}
                            onChange={(e) => setFilters(prev => ({ ...prev, minGrowth: parseInt(e.target.value) }))}
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
                <button 
                    onClick={() => {
                        setAiQuery("");
                        setFilters({
                            search: "",
                            minPe: 0,
                            maxPe: 150,
                            minGrowth: -50,
                            maxDebt: 5,
                            categories: [],
                            market: "ALL"
                        });
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" /> Reset Filters
                </button>
            </div>
        </div>
    );
};
