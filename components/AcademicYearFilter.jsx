// components/filters/AcademicYearFilter.tsx
"use client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function AcademicYearFilter({ academicYears, selectedId, onChange }) {
  return (
    <Select value={selectedId || ""} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Pilih Tahun Ajaran" />
      </SelectTrigger>
      <SelectContent>
        {academicYears.map((year) => (
          <SelectItem key={year.id} value={year.id}>
            {year.tahunMulai}/{year.tahunSelesai}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
