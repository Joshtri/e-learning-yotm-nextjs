// app/holidays/page.jsx
'use client'

import { useEffect, useMemo, useState } from 'react'

export default function IndonesiaHolidaysPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-11
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const ymISO = (y, m, d = 1) => new Date(y, m, d).toISOString().slice(0, 10)

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/date-holidays?year=${year}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.message || 'Failed to load holidays')
        setHolidays(json.data)
        setError(null)
      } catch (e) {
        setError(e?.message ?? 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchHolidays()
  }, [year])

  const firstDayOfMonth = new Date(year, month, 1)
  const startWeekday = (firstDayOfMonth.getDay() + 6) % 7 // Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const grid = useMemo(() => {
    const cells = []
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, isToday: false, isHoliday: false })
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      const iso = date.toISOString().slice(0, 10)
      const h = holidays.find(h => (h.date || '').startsWith(iso))
      cells.push({
        date,
        isToday: sameDate(date, today),
        isHoliday: Boolean(h),
        holidayName: h?.name,
      })
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, isToday: false, isHoliday: false })
    return cells
  }, [year, month, daysInMonth, startWeekday, holidays])

  const monthHolidays = useMemo(() => {
    const start = ymISO(year, month, 1)
    const end = ymISO(year, month + 1, 0)
    return holidays
      .filter(h => h.date >= start && h.date <= end)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [holidays, year, month])

  function sameDate(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }

  function prevMonth() {
    const d = new Date(year, month - 1, 1)
    setYear(d.getFullYear()); setMonth(d.getMonth())
  }
  function nextMonth() {
    const d = new Date(year, month + 1, 1)
    setYear(d.getFullYear()); setMonth(d.getMonth())
  }

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const WEEKDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Indonesia Public Holidays</h1>
          <p className="text-sm text-neutral-500">Source: date-holidays</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="px-3 py-2 rounded-lg border hover:bg-neutral-50">Prev</button>
          <div className="px-3 py-2 rounded-lg font-medium border bg-white">
            {MONTHS[month]} {year}
          </div>
          <button onClick={nextMonth} className="px-3 py-2 rounded-lg border hover:bg-neutral-50">Next</button>
        </div>
      </header>

      {error && (
        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">{error}</div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="grid grid-cols-7 text-center text-sm text-neutral-600">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-2 font-medium">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {loading ? (
              [...Array(42)].map((_, idx) => (
                <div key={idx} className="aspect-square rounded-lg bg-neutral-100 animate-pulse" />
              ))
            ) : (
              grid.map((cell, idx) => (
                <div
                  key={idx}
                  className={`aspect-square rounded-xl border p-2 text-sm relative select-none ${
                    cell.date ? 'bg-white' : 'bg-neutral-50'
                  } ${cell.isHoliday ? 'border-rose-300 bg-rose-50' : ''} ${cell.isToday ? 'ring-2 ring-blue-400' : ''}`}
                  title={cell.holidayName}
                >
                  {cell.date && (
                    <div className="absolute top-1 left-1 text-xs text-neutral-500">
                      {cell.date.getDate()}
                    </div>
                  )}
                  {cell.isHoliday && (
                    <div className="absolute inset-x-1 bottom-1 text-[11px] font-medium truncate text-rose-700">
                      {cell.holidayName}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <aside className="md:col-span-1">
          <div className="p-4 rounded-xl border bg-white">
            <h2 className="text-lg font-semibold mb-3">Holidays this month</h2>
            {loading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-5 rounded bg-neutral-100 animate-pulse" />
                ))}
              </div>
            ) : monthHolidays.length === 0 ? (
              <p className="text-sm text-neutral-500">No holidays in {MONTHS[month]} {year}.</p>
            ) : (
              <ul className="space-y-2">
                {monthHolidays.map(h => (
                  <li key={h.date} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-rose-500" />
                    <div>
                      <div className="text-sm font-medium">{h.name}</div>
                      <div className="text-xs text-neutral-500">{new Date(h.date).toLocaleDateString()}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>
    </main>
  )
}
