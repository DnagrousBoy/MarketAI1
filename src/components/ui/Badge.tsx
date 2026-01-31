import { cn } from "../../lib/utils";
import { StockCategory, HealthStatus } from "../../lib/types";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}

export const Badge = ({ children, className, variant = "default" }: BadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        variant === "default" && "bg-blue-50 text-blue-700 ring-blue-700/10",
        variant === "outline" && "text-gray-600 ring-gray-500/10",
        className
      )}
    >
      {children}
    </span>
  );
};

export const HealthBadge = ({ status }: { status: HealthStatus }) => {
  const styles = {
    Strong: "bg-green-50 text-green-700 ring-green-600/20",
    Average: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
    Risky: "bg-red-50 text-red-700 ring-red-600/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
        styles[status]
      )}
    >
      {status}
    </span>
  );
};

export const CategoryBadge = ({ category }: { category: StockCategory }) => {
    const styles: Record<StockCategory, string> = {
      "Undervalued & Growing": "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
      "Fairly Valued": "bg-gray-100 text-gray-700 ring-gray-500/20",
      "Overvalued": "bg-orange-100 text-orange-800 ring-orange-600/20",
      "Risky": "bg-red-100 text-red-800 ring-red-600/20",
      "High Growth": "bg-indigo-100 text-indigo-800 ring-indigo-600/20",
    };
  
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
          styles[category]
        )}
      >
        {category}
      </span>
    );
  };
