import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function EntityAvatar({ name, image, fallback, className = "h-8 w-8" }) {
  // Generate initials from name if fallback not provided
  const initials =
    fallback ||
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)

  return (
    <Avatar className={className}>
      <AvatarImage src={image || `/placeholder.svg?text=${name.charAt(0)}`} alt={name} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}

