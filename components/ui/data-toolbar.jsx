"use client";

import { SearchBar } from "./search-bar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./select";

export function DataToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filterOptions = [],
  actions,
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
      <div className="flex gap-2">
        <SearchBar
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        {filterOptions.map((filter, index) => {
          if (filter.content) {
            return <div key={index}>{filter.content}</div>;
          }

          if (filter.options && filter.onSelect) {
            return (
              <Select key={index} onValueChange={filter.onSelect}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }

          return null;
        })}
      </div>

      {actions && <div className="flex gap-2 ml-auto">{actions}</div>}
    </div>
  );
}
