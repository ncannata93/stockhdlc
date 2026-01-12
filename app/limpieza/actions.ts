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

export async function updateBooking(
  id: string,
  data: {
    apartment: string
    pax: number
    checkIn: string
    checkOut: string
    notes?: string
  },
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("bookings")
    .update({
      apartment: data.apartment,
      pax: data.pax,
      check_in: data.checkIn,
      check_out: data.checkOut,
      notes: data.notes || null,
      updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Error updating booking:", error)
    throw new Error(error.message)
  }

  revalidatePath("/limpieza")
  revalidatePath("/limpieza/admin")
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

export async function postponeSheetChange(id: string) {
  const supabase = await createClient()

  // Obtener el registro actual
  const { data: currentRecord, error: fetchError } = await supabase
    .from("cleaning_schedule")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !currentRecord) {
    console.error("Error fetching cleaning record:", fetchError)
    throw new Error("No se pudo encontrar el registro de limpieza")
  }

  // Verificar que sea un repaso-sabanas
  if (currentRecord.cleaning_type !== "repaso-sabanas") {
    throw new Error("Solo se pueden postergar cambios de sábanas")
  }

  // Calcular fecha del día siguiente en GMT-3
  const currentDate = new Date(currentRecord.date + "T00:00:00")
  const nextDay = new Date(currentDate)
  nextDay.setDate(nextDay.getDate() + 1)
  const nextDayStr = nextDay.toISOString().split("T")[0]

  // Verificar si ya existe una limpieza para ese apartamento el día siguiente
  const { data: existingCleaning } = await supabase
    .from("cleaning_schedule")
    .select("*")
    .eq("apartment", currentRecord.apartment)
    .eq("date", nextDayStr)
    .single()

  if (existingCleaning) {
    // Si existe y es repaso simple, actualizar a repaso-sabanas
    if (existingCleaning.cleaning_type === "repaso") {
      const { error: updateError } = await supabase
        .from("cleaning_schedule")
        .update({
          cleaning_type: "repaso-sabanas",
          notes: `Cambio de sábanas postergado del ${currentDate.toLocaleDateString("es-AR")}`,
        })
        .eq("id", existingCleaning.id)

      if (updateError) {
        console.error("Error updating next day cleaning:", updateError)
        throw new Error("Error al actualizar la limpieza del día siguiente")
      }
    } else {
      // Si ya es repaso-sabanas o completa, solo agregar nota
      const currentNotes = existingCleaning.notes || ""
      const newNotes = currentNotes
        ? `${currentNotes} | Cambio de sábanas postergado del ${currentDate.toLocaleDateString("es-AR")}`
        : `Cambio de sábanas postergado del ${currentDate.toLocaleDateString("es-AR")}`

      const { error: updateError } = await supabase
        .from("cleaning_schedule")
        .update({ notes: newNotes })
        .eq("id", existingCleaning.id)

      if (updateError) {
        console.error("Error updating notes:", updateError)
        throw new Error("Error al actualizar las notas")
      }
    }
  } else {
    // Si no existe limpieza para el día siguiente, crear una nueva
    const { error: insertError } = await supabase.from("cleaning_schedule").insert({
      booking_id: currentRecord.booking_id,
      apartment: currentRecord.apartment,
      date: nextDayStr,
      day_type: "daily",
      cleaning_type: "repaso-sabanas",
      notes: `Cambio de sábanas postergado del ${currentDate.toLocaleDateString("es-AR")}`,
      is_completed: false,
    })

    if (insertError) {
      console.error("Error creating next day cleaning:", insertError)
      throw new Error("Error al crear la limpieza del día siguiente")
    }
  }

  // Cambiar el registro actual a repaso simple
  const { error: updateCurrentError } = await supabase
    .from("cleaning_schedule")
    .update({
      cleaning_type: "repaso",
      notes: `Cambio de sábanas postergado para el ${nextDay.toLocaleDateString("es-AR")}`,
    })
    .eq("id", id)

  if (updateCurrentError) {
    console.error("Error updating current cleaning:", updateCurrentError)
    throw new Error("Error al actualizar la limpieza actual")
  }

  revalidatePath("/limpieza")
}
