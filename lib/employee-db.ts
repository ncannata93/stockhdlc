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
    if (assignment.id) {
      // 🔒 ACTUALIZACIÓN DE ASIGNACIÓN EXISTENTE
      console.log(`🔄 ACTUALIZANDO asignación existente ID: ${assignment.id}`)

      // ⚠️ CRÍTICO: NO incluir daily_rate_used en la actualización
      // La tarifa histórica DEBE mantenerse intacta
      const updateData: any = {
        employee_id: assignment.employee_id,
        hotel_name: assignment.hotel_name,
        assignment_date: assignment.assignment_date,
        notes: assignment.notes,
        created_by: username,
      }

      // 🚫 NUNCA actualizar daily_rate_used en ediciones
      console.log(`🔒 PRESERVANDO tarifa histórica - NO se actualizará daily_rate_used`)
      console.log(`📝 Datos a actualizar:`, updateData)

      const { data, error } = await supabase
        .from("employee_assignments")
        .update(updateData)
        .eq("id", assignment.id)
        .select(`
          *,
          employees!inner(name)
        `)
        .single()

      if (error) {
        console.error("❌ Error al actualizar asignación:", error)
        return null
      }

      console.log(`✅ Asignación actualizada - Tarifa histórica preservada: $${data.daily_rate_used}`)
      return { ...data, employee_name: data.employees?.name }
    } else {
      // 🆕 NUEVA ASIGNACIÓN
      console.log(`🆕 CREANDO nueva asignación`)

      let dailyRateUsed = assignment.daily_rate_used

      // Solo obtener la tarifa actual si no se especificó una
      if (dailyRateUsed === undefined && assignment.employee_id) {
        console.log("📊 Obteniendo tarifa actual del empleado para nueva asignación")
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select("daily_rate")
          .eq("id", assignment.employee_id)
          .single()

        if (employeeError) {
          console.error("❌ Error al obtener tarifa del empleado:", employeeError)
          return null
        }
        dailyRateUsed = employeeData.daily_rate
        console.log(`💰 Tarifa histórica para nueva asignación: $${dailyRateUsed}`)
      }

      const { data, error } = await supabase
        .from("employee_assignments")
        .insert({
          employee_id: assignment.employee_id,
          hotel_name: assignment.hotel_name,
          assignment_date: assignment.assignment_date,
          daily_rate_used: dailyRateUsed, // 🔒 Tarifa histórica fija
          notes: assignment.notes,
          created_by: username,
        })
        .select(`
          *,
          employees!inner(name)
        `)
        .single()

      if (error) {
        console.error("❌ Error al crear asignación:", error)
        return null
      }

      console.log(`✅ Nueva asignación creada con tarifa histórica: $${dailyRateUsed}`)
      return { ...data, employee_name: data.employees?.name }
    }
  } catch (err) {
    console.error("❌ Error inesperado en saveAssignment:", err)
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

    let query = supabase.from("paid_weeks").select("*").order("week_start", { ascending: false })

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

    const employees = await getEmployees()
    const employeeMap = new Map(employees.map((e) => [e.id, e.name]))

    const result = (data || []).map((item: any) => ({
      ...item,
      employee_name: employeeMap.get(item.employee_id) || `ID-${item.employee_id}`,
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

// FUNCIÓN MEJORADA: Marcar como pendiente (crear registro explícito)
export const markWeekAsPending = async (
  employeeId: number,
  weekStart: string,
  weekEnd: string,
  notes?: string,
): Promise<boolean> => {
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error("❌ No hay cliente de Supabase")
    return false
  }

  try {
    console.log("🔄 Marcando semana como PENDIENTE (registro explícito):", { employeeId, weekStart, weekEnd })

    // Crear registro especial con amount=0 para indicar "explícitamente pendiente"
    const { data, error } = await supabase.from("paid_weeks").upsert(
      {
        employee_id: employeeId,
        week_start: weekStart,
        week_end: weekEnd,
        amount: 0, // ⭐ CLAVE: amount=0 indica "explícitamente pendiente"
        notes: notes || `⏰ PENDIENTE EXPLÍCITO - Marcado el ${new Date().toLocaleDateString()}`,
        paid_date: new Date().toISOString().split("T")[0],
      },
      { onConflict: "employee_id,week_start,week_end" },
    )

    if (error) {
      console.error("❌ Error al marcar como pendiente:", error)
      return false
    }

    console.log("✅ Semana marcada como PENDIENTE EXPLÍCITO exitosamente:", data)
    return true
  } catch (err) {
    console.error("❌ Error inesperado al marcar como pendiente:", err)
    return false
  }
}

// FUNCIÓN SIMPLIFICADA: Desmarcar completamente (eliminar registro)
export const unmarkWeekCompletely = async (
  employeeId: number,
  weekStart: string,
  weekEnd: string,
): Promise<boolean> => {
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error("❌ No hay cliente de Supabase")
    return false
  }

  try {
    console.log("🔄 Eliminando registro completamente:", { employeeId, weekStart, weekEnd })

    const { data, error } = await supabase
      .from("paid_weeks")
      .delete()
      .eq("employee_id", employeeId)
      .eq("week_start", weekStart)
      .eq("week_end", weekEnd)

    if (error) {
      console.error("❌ Error al eliminar registro:", error)
      return false
    }

    console.log("✅ Registro eliminado completamente:", data)
    return true
  } catch (err) {
    console.error("❌ Error inesperado al eliminar registro:", err)
    return false
  }
}

// FUNCIÓN PRINCIPAL MEJORADA: Actualizar estado de pago
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
        console.log("⏰ Ejecutando markWeekAsPending (registro explícito)...")
        result = await markWeekAsPending(employeeId, weekStart, weekEnd, notes)
        break

      case "vencido":
        console.log("⚠️ Ejecutando markWeekAsPending para vencido...")
        result = await markWeekAsPending(employeeId, weekStart, weekEnd, `⚠️ VENCIDO - ${notes}`)
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
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.log("No Supabase client, using static hotels")
    return HOTELS.map((name, index) => ({
      id: index + 1,
      name: name,
    }))
  }

  try {
    const { data, error } = await supabase
      .from("hotels")
      .select("id, name, code, active")
      .eq("active", true)
      .order("name")

    if (error) {
      console.error("Error loading hotels:", error)
      return HOTELS.map((name, index) => ({
        id: index + 1,
        name: name,
      }))
    }

    return (data || []).map((hotel: any) => ({
      id: hotel.id,
      name: hotel.name,
      code: hotel.code,
    }))
  } catch (err) {
    console.error("Error fetching hotels:", err)
    return HOTELS.map((name, index) => ({
      id: index + 1,
      name: name,
    }))
  }
}

export const createHotel = async (hotelData: {
  name: string
  code?: string
}): Promise<{ id: string; name: string; code: string } | null> => {
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error("No Supabase client available")
    return null
  }

  try {
    const generateId = (name: string): string => {
      return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
        .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    }

    const id = generateId(hotelData.name)
    const code = hotelData.code || hotelData.name.substring(0, 3).toUpperCase()

    console.log("[v0] Creating hotel with ID:", id)

    const { data, error } = await supabase
      .from("hotels")
      .insert({
        id: id, // Explicitly provide the ID
        name: hotelData.name,
        code: code,
        active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating hotel:", error)
      return null
    }

    console.log("Hotel created successfully:", data)
    return data
  } catch (err) {
    console.error("Error creating hotel:", err)
    return null
  }
}

// 🔒 FUNCIÓN SEGURA: Crear asignación SIN modificar tarifas existentes
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

  // 🔒 CREAR NUEVA ASIGNACIÓN (sin ID = nueva)
  const result = await saveAssignment({
    employee_id: assignmentData.employee_id,
    hotel_name: hotelName,
    assignment_date: assignmentData.date,
    daily_rate_used: assignmentData.daily_rate,
    notes: assignmentData.notes,
    // 🚫 NO incluir ID = nueva asignación
  })

  if (result) {
    console.log("✅ Asignación creada exitosamente")
  }

  return result
}

// 🔒 FUNCIÓN SEGURA: Editar asignación SIN cambiar tarifa histórica
export const updateEmployeeAssignment = async (
  assignmentId: number,
  updateData: {
    employee_id?: number
    hotel_name?: string
    assignment_date?: string
    notes?: string
  },
): Promise<EmployeeAssignment | null> => {
  console.log(`🔄 EDITANDO asignación ID: ${assignmentId}`, updateData)

  // 🔒 ACTUALIZAR ASIGNACIÓN EXISTENTE (con ID = edición)
  const result = await saveAssignment({
    id: assignmentId, // 🔑 ID presente = edición
    employee_id: updateData.employee_id,
    hotel_name: updateData.hotel_name,
    assignment_date: updateData.assignment_date,
    notes: updateData.notes,
    // 🚫 NO incluir daily_rate_used = preservar tarifa histórica
  })

  if (result) {
    console.log("✅ Asignación editada exitosamente - Tarifa histórica preservada")
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
    updateEmployeeAssignment,
    deleteAssignment,
    getPaidWeeks,
    markWeekAsPaid,
    markWeekAsPending,
    unmarkWeekCompletely,
    updatePaymentStatus,
    getHotels,
    createHotel, // Add createHotel to hook
  }
}
