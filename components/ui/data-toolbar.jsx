"use client"

import { SearchBar } from "./search-bar"
import { FilterDropdown } from "./filter-dropdown"

export function DataToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filterOptions,
  onFilterSelect,
  filterLabel,
  actions,
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
      <div className="flex gap-2">
        <SearchBar value={searchValue} onChange={onSearchChange} placeholder={searchPlaceholder} />
        {filterOptions && onFilterSelect && (
          <FilterDropdown options={filterOptions} onSelect={onFilterSelect} label={filterLabel} />
        )}
      </div>
      {actions && <div className="flex gap-2 ml-auto">{actions}</div>}
    </div>
  )
}

