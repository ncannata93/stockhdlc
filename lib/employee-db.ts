"use client"

import { createClient } from "@supabase/supabase-js"
import type { Employee, EmployeeAssignment, Hotel } from "./employee-types"
import { HOTELS } from "./employee-types"
import { useAuth } from "./auth-context"

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

// Funciones para semanas pagadas - CORREGIDAS
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

    console.log("✅ Datos raw de paid_weeks:", data)

    const result = (data || []).map((item: any) => ({
      ...item,
      employee_name: item.employees?.name,
    }))

    console.log("✅ Semanas pagadas procesadas:", result)
    return result
  } catch (err) {
    console.error("❌ Error inesperado en getPaidWeeks:", err)
    return []
  }
}

// FUNCIÓN CORREGIDA: Solo marca como pagada cuando se llama explícitamente
export const markWeekAsPaid = async (
  employeeId: number,
  weekStart: string,
  weekEnd: string,
  amount: number,
  notes?: string,
): Promise<boolean> => {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    console.log("🔄 Marcando semana como pagada:", { employeeId, weekStart, weekEnd, amount })

    const { error } = await supabase.from("paid_weeks").upsert(
      {
        employee_id: employeeId,
        week_start: weekStart,
        week_end: weekEnd,
        amount: amount,
        notes: notes || `Pago registrado el ${new Date().toLocaleDateString()}`,
        paid_date: new Date().toISOString().split("T")[0],
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

export const unmarkWeekAsPaid = async (employeeId: number, weekStart: string, weekEnd: string): Promise<boolean> => {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    console.log("🔄 INICIO - Desmarcando semana como pagada:", { employeeId, weekStart, weekEnd })

    // Primero verificar qué registros existen ANTES de eliminar
    const { data: beforeRecords, error: beforeError } = await supabase
      .from("paid_weeks")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("week_start", weekStart)
      .eq("week_end", weekEnd)

    if (beforeError) {
      console.error("❌ Error verificando registros ANTES de eliminar:", beforeError)
      return false
    }

    console.log(`📋 ANTES: ${beforeRecords?.length || 0} registro(s) encontrado(s):`, beforeRecords)

    if (!beforeRecords || beforeRecords.length === 0) {
      console.log("⚠️ No se encontró registro para desmarcar - ya está pendiente")
      return true
    }

    // Eliminar todos los registros que coincidan
    const { data: deleteData, error: deleteError } = await supabase
      .from("paid_weeks")
      .delete()
      .eq("employee_id", employeeId)
      .eq("week_start", weekStart)
      .eq("week_end", weekEnd)
      .select()

    if (deleteError) {
      console.error("❌ Error al eliminar registros:", deleteError)
      return false
    }

    console.log("🗑️ Registros eliminados:", deleteData)

    // Verificar que se eliminó correctamente DESPUÉS
    const { data: afterRecords, error: afterError } = await supabase
      .from("paid_weeks")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("week_start", weekStart)
      .eq("week_end", weekEnd)

    if (afterError) {
      console.error("❌ Error verificando registros DESPUÉS de eliminar:", afterError)
      return false
    }

    console.log(`📋 DESPUÉS: ${afterRecords?.length || 0} registro(s) restantes:`, afterRecords)

    if (afterRecords && afterRecords.length > 0) {
      console.error("❌ FALLO: Aún quedan registros después de eliminar")
      return false
    }

    console.log("✅ ÉXITO: Semana desmarcada correctamente")
    return true
  } catch (err) {
    console.error("❌ Error inesperado en unmarkWeekAsPaid:", err)
    return false
  }
}

export const getHotels = async (): Promise<Hotel[]> => {
  return HOTELS.map((name, index) => ({
    id: index + 1,
    name: name,
  }))
}

// FUNCIÓN CORREGIDA: Solo crea asignaciones, NO marca como pagada
export const addEmployeeAssignment = async (assignmentData: {
  employee_id: number
  hotel_id?: number
  hotel_name?: string
  date: string
  daily_rate: number
  notes?: string
}): Promise<EmployeeAssignment | null> => {
  console.log("🔄 Creando asignación (NO marcando como pagada):", assignmentData)

  // Si viene hotel_id, necesitamos obtener el nombre del hotel
  let hotelName = assignmentData.hotel_name

  if (assignmentData.hotel_id && !hotelName) {
    const hotels = await getHotels()
    const hotel = hotels.find((h) => h.id === assignmentData.hotel_id)
    hotelName = hotel?.name
  }

  // SOLO crear la asignación, NO marcar como pagada
  const result = await saveAssignment({
    employee_id: assignmentData.employee_id,
    hotel_name: hotelName,
    assignment_date: assignmentData.date,
    daily_rate_used: assignmentData.daily_rate,
    notes: assignmentData.notes,
  })

  if (result) {
    console.log("✅ Asignación creada exitosamente (pendiente de pago)")
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
    getHotels,
  }
}
