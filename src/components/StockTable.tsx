import React, { useRef, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Stock } from "../lib/types";
import { formatCurrency, formatPercent, formatNumber, cn } from "../lib/utils";
import { HealthBadge, CategoryBadge } from "./ui/Badge";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight } from "lucide-react";

interface StockTableProps {
  data: Stock[];
  onStockClick: (stock: Stock) => void;
}

export const StockTable = ({ data, onStockClick }: StockTableProps) => {
  // Default sort: Health (Strong -> Average -> Risky)
  // We use a custom sorting function or pre-sort data, but react-table handles it better if we define a custom sortType
  const [sorting, setSorting] = useState<SortingState>([
    { id: "healthRank", desc: false } // Ascending: 1 (Strong), 2 (Average), 3 (Risky)
  ]);
  
  const parentRef = useRef<HTMLDivElement>(null);

  const columns = useMemo<ColumnDef<Stock>[]>(
    () => [
      {
        accessorFn: (row) => {
            // Map health to a number for sorting: Strong=1, Average=2, Risky=3
            if (row.aiHealth === "Strong") return 1;
            if (row.aiHealth === "Average") return 2;
            return 3;
        },
        id: "healthRank",
        header: "Quality Rank",
        cell: (info) => {
            const val = info.getValue() as number;
            const label = val === 1 ? "Strong" : val === 2 ? "Average" : "Risky";
            return <HealthBadge status={label as any} />;
        },
        size: 100,
      },
      {
        accessorKey: "symbol",
        header: "Company",
        cell: (info) => (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{info.getValue() as string}</span>
                {info.row.original.market === 'IN' && <span className="text-[10px] bg-orange-100 text-orange-800 px-1 rounded">IN</span>}
            </div>
            <span className="text-xs text-gray-500 truncate max-w-[150px]">{info.row.original.name}</span>
          </div>
        ),
        size: 180,
      },
      {
        accessorKey: "aiCategory",
        header: "Category",
        cell: (info) => <CategoryBadge category={info.getValue() as any} />,
        size: 160,
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: (info) => <span className="font-mono text-sm">{formatCurrency(info.getValue() as number, info.row.original.market)}</span>,
      },
      {
        accessorKey: "peRatio",
        header: ({ column }) => (
          <div className="flex items-center cursor-pointer hover:text-gray-900" onClick={column.getToggleSortingHandler()}>
            P/E
            {{
              asc: <ArrowUp className="ml-1 h-3 w-3" />,
              desc: <ArrowDown className="ml-1 h-3 w-3" />,
            }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />}
          </div>
        ),
        cell: (info) => {
            const val = info.getValue() as number;
            return <span className={cn("font-mono", val > 50 ? "text-red-600" : val < 15 ? "text-green-600" : "")}>{formatNumber(val)}</span>;
        },
      },
      {
        accessorKey: "earningsGrowth",
        header: ({ column }) => (
            <div className="flex items-center cursor-pointer hover:text-gray-900" onClick={column.getToggleSortingHandler()}>
              Earn. Growth
              {{
                asc: <ArrowUp className="ml-1 h-3 w-3" />,
                desc: <ArrowDown className="ml-1 h-3 w-3" />,
              }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />}
            </div>
          ),
        cell: (info) => {
          const val = info.getValue() as number;
          return (
            <span className={cn("font-mono font-medium", val > 0 ? "text-green-600" : "text-red-600")}>
              {val > 0 ? "+" : ""}{formatPercent(val)}
            </span>
          );
        },
      },
      {
        accessorKey: "revenueGrowth",
        header: ({ column }) => (
            <div className="flex items-center cursor-pointer hover:text-gray-900" onClick={column.getToggleSortingHandler()}>
              Rev. Growth
              {{
                asc: <ArrowUp className="ml-1 h-3 w-3" />,
                desc: <ArrowDown className="ml-1 h-3 w-3" />,
              }[column.getIsSorted() as string] ?? <ArrowUpDown className="ml-1 h-3 w-3 text-gray-400" />}
            </div>
          ),
        cell: (info) => {
            const val = info.getValue() as number;
            return (
              <span className={cn("font-mono", val > 0 ? "text-green-600" : "text-red-600")}>
                {val > 0 ? "+" : ""}{formatPercent(val)}
              </span>
            );
          },
      },
      {
        accessorKey: "debtToEquity",
        header: "Debt/Eq",
        cell: (info) => {
            const val = info.getValue() as number;
            return <span className={cn("font-mono", val > 2 ? "text-red-600" : "text-gray-700")}>{formatNumber(val)}</span>;
        },
      },
      {
        id: "actions",
        header: "",
        cell: () => <ChevronRight className="w-4 h-4 text-gray-300" />,
        size: 40
      }
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableMultiSort: true, // Allow sorting by Health AND then by P/E
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, 
    overscan: 20,
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
      <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-[auto_1fr] overflow-hidden pr-4">
          <div className="w-full" style={{ width: '100%' }}>
            {table.getHeaderGroups().map((headerGroup) => (
                <div key={headerGroup.id} className="flex w-full min-w-[1000px]">
                {headerGroup.headers.map((header) => (
                    <div
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap flex items-center select-none"
                    style={{ width: header.getSize() }}
                    >
                    {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                ))}
                </div>
            ))}
          </div>
      </div>

      <div
        ref={parentRef}
        className="overflow-auto flex-1 w-full"
        style={{ height: "600px" }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
            minWidth: "1000px"
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={row.id}
                onClick={() => onStockClick(row.original)}
                className="absolute top-0 left-0 w-full flex border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors group"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className="px-4 py-3 text-sm text-gray-700 flex items-center whitespace-nowrap overflow-hidden"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {rows.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-10">
                <p>No stocks match your criteria.</p>
            </div>
        )}
      </div>
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
          <span>Showing {rows.length.toLocaleString()} companies</span>
          <span>Sorted by: Quality First (Strong → Risky)</span>
      </div>
    </div>
  );
};
