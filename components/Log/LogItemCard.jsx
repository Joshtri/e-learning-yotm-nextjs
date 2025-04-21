"use client";

import { format } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function LogItemCard({ log }) {
  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-semibold">{log.action}</CardTitle>
          <Badge variant="outline" className="text-[11px] font-mono">
            {format(new Date(log.timestamp), "dd MMM yyyy, HH:mm")}
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Aktivitas sistem tercatat
        </CardDescription>
      </CardHeader>

      {log.metadata && (
        <CardContent className="pt-2">
          <ScrollArea className="max-h-40 rounded border text-xs bg-muted px-3 py-2">
            <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}
