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

// 🎯 FUNCIÓN SÚPER SIMPLE: Marcar semana como pendiente - NUEVA LÓGICA
export const markWeekAsPending = async (employeeId: number, weekStart: string, weekEnd: string): Promise<boolean> => {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    console.log(`⏰ MARCANDO COMO PENDIENTE:`, { employeeId, weekStart, weekEnd })

    // En lugar de eliminar, actualizar amount a 0 (igual que servicios)
    const { error } = await supabase.from("paid_weeks").upsert(
      {
        employee_id: employeeId,
        week_start: weekStart,
        week_end: weekEnd,
        amount: 0, // 🎯 CLAVE: amount = 0 significa pendiente
        paid_date: new Date().toISOString().split("T")[0],
        notes: `Estado cambiado a pendiente el ${new Date().toLocaleDateString()}`,
      },
      {
        onConflict: "employee_id,week_start,week_end",
      },
    )

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

// 🎯 FUNCIÓN SÚPER SIMPLE: Verificar si una semana está pagada - LÓGICA MEJORADA
export const isWeekPaid = (employeeId: number, weekStart: string, weekEnd: string, paidWeeks: any[]): boolean => {
  try {
    console.log(`🔍 VERIFICANDO PAGO - Empleado ${employeeId}, Semana: ${weekStart} - ${weekEnd}`)

    // Buscar registros que contengan las fechas de la semana
    const relevantRecords = paidWeeks.filter((pw) => {
      if (pw.employee_id !== employeeId) return false

      // Convertir fechas a strings para comparación
      const paidStart = new Date(pw.week_start).toISOString().split("T")[0]
      const paidEnd = new Date(pw.week_end).toISOString().split("T")[0]

      // Verificar si hay solapamiento
      const hasOverlap = weekStart <= paidEnd && weekEnd >= paidStart

      if (hasOverlap) {
        console.log(`🔍 REGISTRO ENCONTRADO: ${paidStart} - ${paidEnd} (Amount: $${pw.amount})`)
      }

      return hasOverlap
    })

    // Un registro está pagado si tiene amount > 0
    const paidRecord = relevantRecords.find((record) => Number(record.amount) > 0)
    const isPaid = !!paidRecord

    if (paidRecord) {
      console.log(`✅ SEMANA PAGADA: $${paidRecord.amount}`)
    } else if (relevantRecords.length > 0) {
      console.log(`⏰ SEMANA PENDIENTE: Registro existe pero amount = 0`)
    } else {
      console.log(`❌ NO HAY REGISTROS PARA ESTA SEMANA`)
    }

    console.log(`${isPaid ? "✅" : "❌"} RESULTADO FINAL: ${isPaid ? "PAGADA" : "PENDIENTE"}`)

    return isPaid
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
