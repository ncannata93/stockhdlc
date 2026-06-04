import { createClient } from "@/lib/supabase/server"

export type Booking = {
  id: string
  apartment: string
  pax: number
  check_in: string
  check_out: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type CleaningSchedule = {
  id: string
  booking_id: string
  apartment: string
  date: string
  day_type: "check-in" | "check-out" | "check-in-out" | "daily"
  cleaning_type: "repaso" | "repaso-sabanas" | "completa"
  is_completed: boolean
  completed_at: string | null
  notes: string | null
  created_at: string
  pax?: number
  check_in?: string
  check_out?: string
}

function getTodayInGMT3(): string {
  const now = new Date()
  // Convertir a GMT-3 (restar 3 horas de UTC)
  const gmt3Time = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  return gmt3Time.toISOString().split("T")[0]
}

export async function getBookings() {
  const supabase = await createClient()

  const { data, error } = await supabase.from("bookings").select("*").order("check_in", { ascending: false })

  if (error) {
    console.error("Error fetching bookings:", error)
    return []
  }

  return data as Booking[]
}

export async function getCleaningSchedule(startDate?: string, endDate?: string) {
  const supabase = await createClient()

  let query = supabase
    .from("cleaning_schedule")
    .select(`
      *,
      bookings:booking_id (
        pax,
        check_in,
        check_out
      )
    `)
    .order("date", { ascending: true })
    .order("apartment", { ascending: true })

  if (startDate) {
    query = query.gte("date", startDate)
  }
  if (endDate) {
    query = query.lte("date", endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching cleaning schedule:", error)
    return []
  }

  // Transform data to include booking info at top level
  const transformed = data.map((item: any) => ({
    ...item,
    pax: item.bookings?.pax,
    check_in: item.bookings?.check_in,
    check_out: item.bookings?.check_out,
  }))

  return transformed as CleaningSchedule[]
}

export async function getTodayReport() {
  const supabase = await createClient()
  const today = getTodayInGMT3()

  const { data, error } = await supabase
    .from("cleaning_schedule")
    .select(`
      *,
      bookings:booking_id (
        pax,
        check_in,
        check_out,
        notes
      )
    `)
    .eq("date", today)
    .order("apartment", { ascending: true })
    .order("day_type", { ascending: true })

  if (error) {
    console.error("Error fetching today's report:", error)
    return []
  }

  const groupedByApartment = new Map<string, any[]>()

  data.forEach((item: any) => {
    if (!groupedByApartment.has(item.apartment)) {
      groupedByApartment.set(item.apartment, [])
    }
    groupedByApartment.get(item.apartment)!.push(item)
  })

  const merged: any[] = []

  groupedByApartment.forEach((cleanings, apartment) => {
    if (cleanings.length === 1) {
      const item = cleanings[0]
      merged.push({
        ...item,
        pax: item.bookings?.pax,
        check_in: item.bookings?.check_in,
        check_out: item.bookings?.check_out,
        booking_notes: item.bookings?.notes,
      })
    } else {
      const checkOut = cleanings.find((c) => c.day_type === "check-out")
      const checkIn = cleanings.find((c) => c.day_type === "check-in")

      if (checkOut && checkIn) {
        merged.push({
          id: checkIn.id,
          booking_id: checkIn.booking_id,
          apartment: apartment,
          date: checkIn.date,
          day_type: "check-in-out",
          cleaning_type: "completa",
          is_completed: checkIn.is_completed && checkOut.is_completed,
          completed_at: checkIn.completed_at,
          notes: checkIn.notes || checkOut.notes,
          created_at: checkIn.created_at,
          pax: checkIn.bookings?.pax,
          check_in: checkIn.bookings?.check_in,
          check_out: checkIn.bookings?.check_out,
          booking_notes: checkIn.bookings?.notes,
          _mergedIds: [checkIn.id, checkOut.id],
        })
      } else {
        cleanings.forEach((item) => {
          merged.push({
            ...item,
            pax: item.bookings?.pax,
            check_in: item.bookings?.check_in,
            check_out: item.bookings?.check_out,
            booking_notes: item.bookings?.notes,
          })
        })
      }
    }
  })

  return merged as (CleaningSchedule & { booking_notes?: string | null; _mergedIds?: string[] })[]
}

export async function getActiveAndPastBookings() {
  const supabase = await createClient()
  const today = getTodayInGMT3()

  const { data, error } = await supabase.from("bookings").select("*")

  if (error) {
    console.error("Error fetching bookings:", error)
    return { active: [], past: [] }
  }

  const bookings = data as Booking[]

  // Separar estadías activas (check_in <= today <= check_out) y pasadas (check_out < today)
  const active = bookings
    .filter((b) => b.check_in <= today && b.check_out >= today)
    .sort((a, b) => a.apartment.localeCompare(b.apartment))

  const past = bookings
    .filter((b) => b.check_out < today)
    .sort((a, b) => new Date(b.check_out).getTime() - new Date(a.check_out).getTime())

  return { active, past }
}
