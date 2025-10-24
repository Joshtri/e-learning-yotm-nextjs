"use client";

import { useState, useEffect } from "react";
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
  loadingMessage = "Loading data...",
  emptyMessage = "No data found",
  keyExtractor,
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px = md breakpoint
    };

    // Check on mount
    checkMobile();

    // Add event listener
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-4">
        {isLoading ? (
          // Mobile Loading State
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4 space-y-3">
                {columns.map((_, colIndex) => (
                  <div key={colIndex} className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        ) : data.length === 0 ? (
          // Mobile Empty State
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {emptyMessage}
            </CardContent>
          </Card>
        ) : (
          // Mobile Data Cards
          data.map((item, index) => (
            <Card key={keyExtractor ? keyExtractor(item) : index}>
              <CardContent className="p-4 space-y-3">
                {columns.map((column, colIndex) => {
                  const value = column.cell
                    ? column.cell(item, index)
                    : column.accessorKey
                    ? item[column.accessorKey]
                    : null;

                  // Skip rendering if value is null/undefined and not a React element
                  if (value === null || value === undefined) return null;

                  return (
                    <div key={colIndex} className="flex flex-col space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {column.header}
                      </span>
                      <div className="text-sm">{value}</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  }

  // Desktop Table View
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
