import { Badge } from "@/components/ui/badge"

export function StatusBadge({ status, variants = {}, defaultVariant = "outline" }) {
  // Get the variant for this status, or use default
  const variant = variants[status] || defaultVariant

  // Get the label for this status, or use the status itself
  const label = variants[status]?.label || status

  return <Badge variant={variant}>{label}</Badge>
}

