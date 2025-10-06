import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DataTable({
  data,
  columns,
  isLoading = false,
  loadingMessage = "Loading data...", // No longer visually used, but kept for compatibility
  emptyMessage = "No data found",
  keyExtractor,
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((column, cellIndex) => (
                        <TableCell key={cellIndex} className={column.className}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : data.length === 0
                ? <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center py-10 text-muted-foreground"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                : data.map((item, index) => (
                    <TableRow key={keyExtractor ? keyExtractor(item) : index}>
                      {columns.map((column, columnIndex) => (
                        <TableCell
                          key={columnIndex}
                          className={column.className}
                        >
                          {column.cell
                            ? column.cell(item, index)
                            : column.accessorKey
                            ? item[column.accessorKey]
                            : null}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
