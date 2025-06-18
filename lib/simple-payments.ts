"use client"

import { createClient } from "@supabase/supabase-js"

// Cliente Supabase singleton
let supabaseClient: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey)
  return supabaseClient
}

// 🎯 FUNCIÓN SÚPER SIMPLE: Marcar semana como pagada
export const markWeekAsPaid = async (
  employeeId: number,
  weekStart: string,
  weekEnd: string,
  amount: number,
): Promise<boolean> => {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    console.log(`💰 MARCANDO COMO PAGADA:`, { employeeId, weekStart, weekEnd, amount })

    const { error } = await supabase.from("paid_weeks").upsert(
      {
        employee_id: employeeId,
        week_start: weekStart,
        week_end: weekEnd,
        amount: amount,
        paid_date: new Date().toISOString().split("T")[0],
        notes: `Pagado el ${new Date().toLocaleDateString()}`,
      },
      {
        onConflict: "employee_id,week_start,week_end",
      },
    )

    if (error) {
      console.error("❌ Error al marcar como pagada:", error)
      return false
    }

    console.log("✅ Semana marcada como pagada exitosamente")
    return true
  } catch (err) {
    console.error("❌ Error inesperado:", err)
    return false
  }
}

// 🎯 FUNCIÓN SÚPER SIMPLE: Marcar semana como pendiente
export const markWeekAsPending = async (employeeId: number, weekStart: string, weekEnd: string): Promise<boolean> => {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    console.log(`⏰ MARCANDO COMO PENDIENTE:`, { employeeId, weekStart, weekEnd })

    const { error } = await supabase
      .from("paid_weeks")
      .delete()
      .eq("employee_id", employeeId)
      .eq("week_start", weekStart)
      .eq("week_end", weekEnd)

    if (error) {
      console.error("❌ Error al marcar como pendiente:", error)
      return false
    }

    console.log("✅ Semana marcada como pendiente exitosamente")
    return true
  } catch (err) {
    console.error("❌ Error inesperado:", err)
    return false
  }
}

// 🎯 FUNCIÓN SÚPER SIMPLE: Verificar si una semana está pagada
export const isWeekPaid = (employeeId: number, weekStart: string, weekEnd: string, paidWeeks: any[]): boolean => {
  try {
    // Buscar registro exacto
    const exactMatch = paidWeeks.find(
      (pw) => pw.employee_id === employeeId && pw.week_start === weekStart && pw.week_end === weekEnd && pw.amount > 0,
    )

    return !!exactMatch
  } catch (error) {
    console.error("Error checking if week is paid:", error)
    return false
  }
}

// 🎯 FUNCIÓN SÚPER SIMPLE: Obtener semanas pagadas
export const getPaidWeeksSimple = async (): Promise<any[]> => {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase.from("paid_weeks").select("*").order("week_start", { ascending: false })

    if (error) {
      console.error("❌ Error obteniendo semanas pagadas:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("❌ Error inesperado:", err)
    return []
  }
}
