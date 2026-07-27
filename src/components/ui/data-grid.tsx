import * as React from "react"
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Filter,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useTranslation } from "react-i18next"

export interface ColumnDef<T> {
  header: string
  accessorKey?: keyof T
  cell?: (item: T) => React.ReactNode
  className?: string
}

export interface FilterOption {
  label: string
  value: string
}

export interface FilterDef {
  label: string
  key: string
  options: FilterOption[]
}

interface DataGridProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  searchKey?: string
  searchPlaceholder?: string
  filters?: FilterDef[]
  pageSize?: number
  className?: string
  onRowClick?: (item: T) => void
  emptyState?: React.ReactNode
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataGrid<T extends Record<string, any>>({
  data = [],
  columns = [],
  searchKey,
  searchPlaceholder,
  filters = [],
  pageSize = 10,
  className,
  onRowClick,
  emptyState
}: DataGridProps<T>) {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === "rtl"
  const [searchTerm, setSearchTerm] = React.useState("")
  const [activeFilters, setActiveFilters] = React.useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = React.useState(1)

  // Reset page when filters or search change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, activeFilters])

  const safeData = React.useMemo(() => {
    return Array.isArray(data) ? data : []
  }, [data])

  // Filter and Search Logic
  const filteredData = React.useMemo(() => {
    return safeData.filter((item) => {
      if (!item) return false

      // Search
      if (searchTerm && searchKey) {
        const rawValue = item[searchKey] ?? item["caption"] ?? item["description"] ?? item["title"] ?? item["name"] ?? item["email"] ?? ""
        const value = typeof rawValue === "string" ? rawValue : String(rawValue || "")
        if (!value.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false
        }
      }

      // Filters
      for (const filter of filters) {
        const activeValue = activeFilters[filter.key]
        if (activeValue && activeValue !== "all") {
          const itemVal = item[filter.key] ?? (filter.key === "contentType" ? item["type"] : undefined)
          if (itemVal !== activeValue) {
            return false
          }
        }
      }

      return true
    })
  }, [safeData, searchTerm, searchKey, filters, activeFilters])

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize))
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setActiveFilters({})
    setSearchTerm("")
  }

  const hasActiveFilters = searchTerm !== "" || Object.values(activeFilters).some(v => v !== "all" && v !== "")

  const renderCell = (col: ColumnDef<T>, item: T) => {
    try {
      if (col.cell) {
        return col.cell(item)
      }
      if (col.accessorKey) {
        const val = item[col.accessorKey]
        return val !== undefined && val !== null ? String(val) : "-"
      }
      return "-"
    } catch (err) {
      console.warn("Cell rendering failed:", err)
      return "-"
    }
  }

  return (
    <div className={cn("space-y-4", className)} dir={isRtl ? "rtl" : "ltr"}>
      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {searchKey && (
            <div className="relative w-full md:w-auto md:flex-1 md:max-w-sm">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4", isRtl ? "right-3" : "left-3")} />
              <Input
                placeholder={searchPlaceholder || t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn("h-10 bg-card border-border rounded-md w-full focus-visible:ring-primary/20 focus-visible:border-primary/50", isRtl ? "pr-9" : "pl-9")}
              />
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {(filters || []).map((filter) => (
              <Select
                key={filter.key}
                value={activeFilters[filter.key] || "all"}
                onValueChange={(value) => handleFilterChange(filter.key, value)}
              >
                <SelectTrigger className="w-full sm:w-[160px] h-10 bg-card border-border rounded-md focus:ring-primary/20 focus:border-primary/50">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Filter className="h-3 w-3 text-muted-foreground shrink-0" />
                    <SelectValue placeholder={filter.label} />
                  </div>
                </SelectTrigger>
                <SelectContent className="ui-dialog-shell">
                  <SelectItem value="all">{t('common.all')} {filter.label}</SelectItem>
                  {(filter.options || []).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}

            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className={cn("h-10 px-3 text-muted-foreground hover:text-foreground gap-2", isRtl ? "mr-auto md:mr-0" : "ml-auto md:ml-0")}
              >
                <X className="h-4 w-4" />
                <span className="hidden xs:inline">{t('common.clear')}</span>
              </Button>
            )}
          </div>
        </div>

        <div className="text-sm text-muted-foreground font-medium">
          {t('common.showing_results', { count: filteredData.length })}
        </div>
      </div>

      {/* Table */}
      <div className="ui-table-container">
        <Table className="ui-table-shell">
          <TableHeader className="ui-table-header">
            <TableRow className="border-border hover:bg-transparent">
              {(columns || []).map((col, idx) => (
                <TableHead 
                  key={idx} 
                  className={cn(
                    "h-12 text-[10px] font-bold text-muted-foreground uppercase tracking-widest transition-colors whitespace-nowrap",
                    isRtl ? "text-right" : "text-left",
                    col.className
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, rowIdx) => (
                <TableRow
                  key={item?.id || rowIdx}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "ui-table-row group",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {(columns || []).map((col, colIdx) => (
                    <TableCell key={colIdx} className={cn("ui-table-cell", isRtl ? "text-right" : "text-left", col.className)}>
                      {renderCell(col, item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={Math.max(1, columns.length)} className="h-64 text-center">
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="text-lg font-bold text-foreground">{t('common.no_results')}</p>
                      <p className="text-sm text-muted-foreground">{t('common.no_results_desc')}</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
          <div className={cn("text-sm text-muted-foreground font-medium order-2 sm:order-1", isRtl ? "sm:order-2" : "sm:order-1")}>
            {t('common.page_of', { current: currentPage, total: totalPages })}
          </div>
          <div className={cn("flex items-center gap-1 sm:gap-2 order-1 sm:order-2 overflow-x-auto max-w-full pb-2 sm:pb-0 no-scrollbar", isRtl ? "sm:order-1 flex-row-reverse" : "sm:order-2")}>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-md border-border shrink-0"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              {isRtl ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-md border-border shrink-0"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = currentPage
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 w-8 sm:h-9 sm:w-9 rounded-md text-[10px] sm:text-xs font-bold shrink-0",
                      currentPage === pageNum ? "shadow-lg shadow-primary/20" : "text-muted-foreground"
                    )}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-md border-border shrink-0"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-md border-border shrink-0"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              {isRtl ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
