import { cn } from "@/lib/utils";

export function Stack({ className, children, gap = "space-y-2", ...props }) {
  return (
    <div className={cn(gap, className)} {...props}>
      {children}
    </div>
  );
}
