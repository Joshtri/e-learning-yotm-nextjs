// components/ui/status-badge.js
import { cn } from "@/lib/utils";

// Style mapping
const VARIANT_STYLES = {
  default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  success:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  warning:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  outline:
    "border border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300",
};

export function StatusBadge({ status, variants = {}, className }) {
  const config = variants[status] || {};
  const label = config.label || status;
  const variant = config.variant || "default";
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.default;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
