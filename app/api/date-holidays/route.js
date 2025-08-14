// app/api/holidays/route.ts
import { NextResponse } from 'next/server'
import Holidays from 'date-holidays'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const yearParam = searchParams.get('year')
    const year = yearParam ? Number(yearParam) : new Date().getFullYear()

    const hd = new Holidays('ID') // Indonesia
    const raw = hd.getHolidays(year)

    // normalize & keep only public holidays (not observances, etc.), but you can relax the filter
    const holidays = raw
      .filter(h => !h.substitute) // drop substitute days if you don’t want duplicates
      .map(h => ({
        date: h.date,            // ISO string
        name: h.name,
        type: h.type,            // 'public', 'bank', 'observance', etc.
        regions: h.regions ?? [],
      }))

    return NextResponse.json({ success: true, year, data: holidays })
  } catch (err) {
    return NextResponse.json({ success: false, message: err?.message ?? 'Unknown error' }, { status: 500 })
  }
}