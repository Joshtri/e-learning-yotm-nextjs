// components/ui/section.tsx
import { cn } from "@/lib/utils";

export function Section({ className, children, ...props }) {
  return (
    <section
      className={cn("max-w-3xl mx-auto py-10 px-4", className)}
      {...props}
    >
      {children}
    </section>
  );
}
