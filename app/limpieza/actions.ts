"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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

export async function addBooking(data: {
  apartment: string
  pax: number
  checkIn: string
  checkOut: string
  notes?: string
}) {
  const supabase = await createClient()

  const { data: insertedData, error } = await supabase
    .from("bookings")
    .insert({
      apartment: data.apartment,
      pax: data.pax,
      check_in: data.checkIn,
      check_out: data.checkOut,
      notes: data.notes || null,
    })
    .select()

  if (error) {
    console.error("Error adding booking:", error)
    throw new Error(error.message)
  }

  revalidatePath("/limpieza")
}

export async function deleteBooking(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("bookings").delete().eq("id", id)

  if (error) {
    console.error("Error deleting booking:", error)
    throw new Error(error.message)
  }

  revalidatePath("/limpieza")
}

export async function toggleCleaningComplete(id: string, isCompleted: boolean, mergedIds?: string[]) {
  const supabase = await createClient()

  // If this is a merged cleaning, update all related records
  const idsToUpdate = mergedIds && mergedIds.length > 0 ? mergedIds : [id]

  const completedAt = isCompleted ? new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() : null

  const { error } = await supabase
    .from("cleaning_schedule")
    .update({
      is_completed: isCompleted,
      completed_at: completedAt,
    })
    .in("id", idsToUpdate)

  if (error) {
    console.error("Error updating cleaning status:", error)
    throw new Error(error.message)
  }

  revalidatePath("/limpieza")
}
