"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SearchBar({ value, onChange, placeholder = "Search...", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        className="pl-8 w-[200px] lg:w-[300px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

