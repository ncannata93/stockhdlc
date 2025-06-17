"use client"

import { createClient } from "@supabase/supabase-js"
import type { Employee, EmployeeAssignment, Hotel } from "./employee-types"
import { HOTELS } from "./employee-types"
import { useAuth } from "./auth-context"

// Tipos de estado de pago
export type PaymentStatus = "pendiente" | "pagado" | "vencido"

// Singleton para el cliente de Supabase
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

// Funciones para empleados
export const getEmployees = async (): Promise<Employee[]> => {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    const { data, error } = await supabase.from("employees").select("*").order("name")
    if (error) return []
    return data || []
  } catch (err) {
    return []
  }
}

export const saveEmployee = async (employee: Partial<Employee>): Promise<Employee | null> => {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    if (employee.id) {
      const { data, error } = await supabase
        .from("employees")
        .update({
          name: employee.name,
          role: employee.role,
          daily_rate: employee.daily_rate,
        })
        .eq("id", employee.id)
        .select()
        .single()

      if (error) return null
      return data
    } else {
      const { data, error } = await supabase
        .from("employees")
        .insert({
          name: employee.name,
          role: employee.role || "Mantenimiento",
          daily_rate: employee.daily_rate || 0,
        })
        .select()
        .single()

      if (error) return null
      return data
    }
  } catch (err) {
    return null
  }
}

export const deleteEmployee = async (id: number): Promise<boolean> => {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { count, error: countError } = await supabase
      .from("employee_assignments")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", id)

    if (countError || (count && count > 0)) return false

    const { error } = await supabase.from("employees").delete().eq("id", id)
    return !error
  } catch (err) {
    return false
  }
}

// Funciones para asignaciones
export const getAssignments = async (filters?: {
  employee_id?: number
  start_date?: string
  end_date?: string
}): Promise<EmployeeAssignment[]> => {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    let query = supabase
      .from("employee_assignments")
      .select(`
        *,
        employees!inner(name)
      `)
      .order("assignment_date", { ascending: false })

    if (filters?.employee_id) {
      query = query.eq("employee_id", filters.employee_id)
    }

    if (filters?.start_date && filters?.end_date) {
      query = query.gte("assignment_date", filters.start_date).lte("assignment_date", filters.end_date)
    }

    const { data, error } = await query
    if (error) return []

    return (data || []).map((item: any) => ({
      ...item,
      employee_name: item.employees?.name,
    }))
  } catch (err) {
    return []
  }
}

export const saveAssignment = async (
  assignment: Partial<EmployeeAssignment>,
  username?: string,
): Promise<EmployeeAssignment | null> => {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    let dailyRateUsed = assignment.daily_rate_used

    if (dailyRateUsed === undefined && assignment.employee_id) {
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("daily_rate")
        .eq("id", assignment.employee_id)
        .single()

      if (employeeError) return null
      dailyRateUsed = employeeData.daily_rate
    }

    if (assignment.id) {
      const { data, error } = await supabase
        .from("employee_assignments")
        .update({
          employee_id: assignment.employee_id,
          hotel_name: assignment.hotel_name,
          assignment_date: assignment.assignment_date,
          daily_rate_used: dailyRateUsed,
          notes: assignment.notes,
          created_by: username,
        })
        .eq("id", assignment.id)
        .select(`
          *,
          employees!inner(name)
        `)
        .single()

      if (error) return null
      return { ...data, employee_name: data.employees?.name }
    } else {
      const { data, error } = await supabase
        .from("employee_assignments")
        .insert({
          employee_id: assignment.employee_id,
          hotel_name: assignment.hotel_name,
          assignment_date: assignment.assignment_date,
          daily_rate_used: dailyRateUsed,
          notes: assignment.notes,
          created_by: username,
        })
        .select(`
          *,
          employees!inner(name)
        `)
        .single()

      if (error) return null
      return { ...data, employee_name: data.employees?.name }
    }
  } catch (err) {
    return null
  }
}

export const deleteAssignment = async (id: number): Promise<boolean> => {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { error } = await supabase.from("employee_assignments").delete().eq("id", id)
    return !error
  } catch (err) {
    return false
  }
}

// Funciones para semanas pagadas - SIMPLIFICADAS Y CON DEBUG
export const getPaidWeeks = async (filters?: {
  employee_id?: number
  start_date?: string
  end_date?: string
}): Promise<any[]> => {
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.log("❌ No hay cliente de Supabase")
    return []
  }

  try {
    console.log("🔄 Cargando semanas pagadas con filtros:", filters)

    let query = supabase
      .from("paid_weeks")
      .select(`
        *,
        employees!inner(name)
      `)
      .order("week_start", { ascending: false })

    if (filters?.employee_id) {
      query = query.eq("employee_id", filters.employee_id)
    }

    if (filters?.start_date && filters?.end_date) {
      query = query.gte("week_start", filters.start_date).lte("week_end", filters.end_date)
    }

    const { data, error } = await query

    if (error) {
      console.error("❌ Error en consulta paid_weeks:", error)
      return []
    }

    const result = (data || []).map((item: any) => ({
      ...item,
      employee_name: item.employees?.name,
    }))

    console.log("✅ Semanas pagadas cargadas:", result.length)
    return result
  } catch (err) {
    console.error("❌ Error inesperado en getPaidWeeks:", err)
    return []
  }
}

// FUNCIÓN SIMPLIFICADA: Marcar como pagada
export const markWeekAsPaid = async (
  employeeId: number,
  weekStart: string,
  weekEnd: string,
  amount: number,
  notes?: string,
): Promise<boolean> => {
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error("❌ No hay cliente de Supabase")
    return false
  }

  try {
    console.log("🔄 Marcando semana como pagada:", { employeeId, weekStart, weekEnd, amount })

    const { data, error } = await supabase.from("paid_weeks").upsert(
      {
        employee_id: employeeId,
        week_start: weekStart,
        week_end: weekEnd,
        amount,
        notes: notes || `Pago registrado el ${new Date().toLocaleDateString()}`,
        paid_date: new Date().toISOString().split("T")[0],
      },
      { onConflict: "employee_id,week_start,week_end" },
    )

    if (error) {
      console.error("❌ Error al marcar como pagada:", error)
      return false
    }

    console.log("✅ Semana marcada como pagada exitosamente:", data)
    return true
  } catch (err) {
    console.error("❌ Error inesperado al marcar como pagada:", err)
    return false
  }
}

// FUNCIÓN SIMPLIFICADA: Desmarcar como pagada
export const unmarkWeekAsPaid = async (employeeId: number, weekStart: string, weekEnd: string): Promise<boolean> => {
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error("❌ No hay cliente de Supabase")
    return false
  }

  try {
    console.log("🔄 Desmarcando semana como pagada:", { employeeId, weekStart, weekEnd })

    const { data, error } = await supabase
      .from("paid_weeks")
      .delete()
      .eq("employee_id", employeeId)
      .eq("week_start", weekStart)
      .eq("week_end", weekEnd)

    if (error) {
      console.error("❌ Error al desmarcar como pagada:", error)
      return false
    }

    console.log("✅ Semana desmarcada como pagada exitosamente:", data)
    return true
  } catch (err) {
    console.error("❌ Error inesperado al desmarcar como pagada:", err)
    return false
  }
}

// FUNCIÓN PRINCIPAL: Actualizar estado de pago con logging detallado
export const updatePaymentStatus = async (
  employeeId: number,
  weekStart: string,
  weekEnd: string,
  status: PaymentStatus,
  amount: number,
  notes?: string,
): Promise<boolean> => {
  console.log("🔄 INICIO updatePaymentStatus:", { employeeId, weekStart, weekEnd, status, amount })

  try {
    let result = false

    switch (status) {
      case "pagado":
        console.log("💰 Ejecutando markWeekAsPaid...")
        result = await markWeekAsPaid(employeeId, weekStart, weekEnd, amount, notes)
        break

      case "pendiente":
      case "vencido":
        console.log("⏰ Ejecutando unmarkWeekAsPaid...")
        result = await unmarkWeekAsPaid(employeeId, weekStart, weekEnd)
        break

      default:
        console.error("❌ Estado no válido:", status)
        return false
    }

    console.log(`${result ? "✅" : "❌"} updatePaymentStatus resultado:`, result)
    return result
  } catch (error) {
    console.error("❌ Error en updatePaymentStatus:", error)
    return false
  }
}

export const getHotels = async (): Promise<Hotel[]> => {
  return HOTELS.map((name, index) => ({
    id: index + 1,
    name: name,
  }))
}

export const addEmployeeAssignment = async (assignmentData: {
  employee_id: number
  hotel_id?: number
  hotel_name?: string
  date: string
  daily_rate: number
  notes?: string
}): Promise<EmployeeAssignment | null> => {
  console.log("🔄 Creando asignación:", assignmentData)

  let hotelName = assignmentData.hotel_name

  if (assignmentData.hotel_id && !hotelName) {
    const hotels = await getHotels()
    const hotel = hotels.find((h) => h.id === assignmentData.hotel_id)
    hotelName = hotel?.name
  }

  const result = await saveAssignment({
    employee_id: assignmentData.employee_id,
    hotel_name: hotelName,
    assignment_date: assignmentData.date,
    daily_rate_used: assignmentData.daily_rate,
    notes: assignmentData.notes,
  })

  if (result) {
    console.log("✅ Asignación creada exitosamente")
  }

  return result
}

// Hook simplificado
export const useEmployeeDB = () => {
  const { session } = useAuth()
  const username = session?.username || "sistema"

  return {
    getEmployees,
    saveEmployee,
    deleteEmployee,
    getAssignments,
    saveAssignment: (assignment: Partial<EmployeeAssignment>) => saveAssignment(assignment, username),
    addEmployeeAssignment,
    deleteAssignment,
    getPaidWeeks,
    markWeekAsPaid,
    unmarkWeekAsPaid,
    updatePaymentStatus,
    getHotels,
  }
}
