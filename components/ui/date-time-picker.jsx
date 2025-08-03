'use client'

import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

export function DateTimePicker({ value, onChange }) {
  return (
    <div className="relative w-full">
      <DatePicker
        selected={value}
        onChange={onChange}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        dateFormat="Pp"
        placeholderText="Pilih tanggal & waktu"
        className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {/* <CalendarIcon className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" /> */}
    </div>
  )
}
