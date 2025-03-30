import { Card, CardContent } from "@/components/ui/card"

export function DataGrid({
  data,
  renderItem,
  keyExtractor,
  isLoading = false,
  loadingMessage = "Loading data...",
  emptyMessage = "No data found",
  columns = 3, // Default to 3 columns on large screens
}) {
  // Determine grid columns based on the columns prop
  const gridClass = `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${Math.min(columns, 2)} lg:grid-cols-${columns} gap-4`

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">{loadingMessage}</CardContent>
      </Card>
    )
  }

  if (!data.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">{emptyMessage}</CardContent>
      </Card>
    )
  }

  return (
    <div className={gridClass}>
      {data.map((item, index) => (
        <div key={keyExtractor ? keyExtractor(item) : index}>{renderItem(item, index)}</div>
      ))}
    </div>
  )
}

