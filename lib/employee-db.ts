"use client"

import { createClient } from "@supabase/supabase-js"
import type { Employee, EmployeeAssignment, EmployeePayment } from "./employee-types"
import { useAuth } from "./auth-context"

// Singleton para el cliente de Supabase
let supabaseClient: ReturnType<typeof createClient> | null = null

// Función para obtener el cliente de Supabase
export const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  if (!supabaseUrl || !supabaseKey) {
    console.error("Faltan credenciales de Supabase")
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

    if (error) {
      console.error("Error al obtener empleados:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("Error inesperado al obtener empleados:", err)
    return []
  }
}

export const saveEmployee = async (employee: Partial<Employee>): Promise<Employee | null> => {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    if (employee.id) {
      // Actualizar empleado existente
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

      if (error) {
        console.error("Error al actualizar empleado:", error)
        return null
      }

      return data
    } else {
      // Crear nuevo empleado
      const { data, error } = await supabase
        .from("employees")
        .insert({
          name: employee.name,
          role: employee.role || "Mantenimiento",
          daily_rate: employee.daily_rate || 0,
        })
        .select()
        .single()

      if (error) {
        console.error("Error al crear empleado:", error)
        return null
      }

      return data
    }
  } catch (err) {
    console.error("Error inesperado al guardar empleado:", err)
    return null
  }
}

export const deleteEmployee = async (id: number): Promise<boolean> => {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    // Verificar si tiene asignaciones
    const { count, error: countError } = await supabase
      .from("employee_assignments")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", id)

    if (countError) {
      console.error("Error al verificar asignaciones:", countError)
      return false
    }

    if (count && count > 0) {
      console.error("No se puede eliminar un empleado con asignaciones")
      return false
    }

    const { error } = await supabase.from("employees").delete().eq("id", id)

    if (error) {
      console.error("Error al eliminar empleado:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Error inesperado al eliminar empleado:", err)
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

    if (error) {
      console.error("Error al obtener asignaciones:", error)
      return []
    }

    // Formatear los datos para incluir el nombre del empleado
    return (data || []).map((item: any) => ({
      ...item,
      employee_name: item.employees?.name,
    }))
  } catch (err) {
    console.error("Error inesperado al obtener asignaciones:", err)
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
    // Obtener la tarifa diaria del empleado si no se proporciona
    let dailyRateUsed = assignment.daily_rate_used
    if (!dailyRateUsed && assignment.employee_id) {
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("daily_rate")
        .eq("id", assignment.employee_id)
        .single()

      if (employeeError) {
        console.error("Error al obtener tarifa del empleado:", employeeError)
        return null
      }

      dailyRateUsed = employeeData.daily_rate
    }

    if (assignment.id) {
      // Actualizar asignación existente
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

      if (error) {
        console.error("Error al actualizar asignación:", error)
        return null
      }

      return {
        ...data,
        employee_name: data.employees?.name,
      }
    } else {
      // Crear nueva asignación
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

      if (error) {
        console.error("Error al crear asignación:", error)
        return null
      }

      return {
        ...data,
        employee_name: data.employees?.name,
      }
    }
  } catch (err) {
    console.error("Error inesperado al guardar asignación:", err)
    return null
  }
}

export const deleteAssignment = async (id: number): Promise<boolean> => {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { error } = await supabase.from("employee_assignments").delete().eq("id", id)

    if (error) {
      console.error("Error al eliminar asignación:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Error inesperado al eliminar asignación:", err)
    return false
  }
}

// Funciones para pagos
export const getPayments = async (filters?: {
  employee_id?: number
  status?: string
  start_date?: string
  end_date?: string
}): Promise<EmployeePayment[]> => {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  try {
    let query = supabase
      .from("employee_payments")
      .select(`
        *,
        employees!inner(name)
      `)
      .order("payment_date", { ascending: false })

    if (filters?.employee_id) {
      query = query.eq("employee_id", filters.employee_id)
    }

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.start_date && filters?.end_date) {
      query = query.gte("payment_date", filters.start_date).lte("payment_date", filters.end_date)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error al obtener pagos:", error)
      return []
    }

    // Formatear los datos para incluir el nombre del empleado
    return (data || []).map((item: any) => ({
      ...item,
      employee_name: item.employees?.name,
    }))
  } catch (err) {
    console.error("Error inesperado al obtener pagos:", err)
    return []
  }
}

export const savePayment = async (
  payment: Partial<EmployeePayment>,
  username?: string,
): Promise<EmployeePayment | null> => {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    if (payment.id) {
      // Actualizar pago existente
      const { data, error } = await supabase
        .from("employee_payments")
        .update({
          employee_id: payment.employee_id,
          amount: payment.amount,
          payment_date: payment.payment_date,
          week_start: payment.week_start,
          week_end: payment.week_end,
          status: payment.status,
          notes: payment.notes,
          created_by: username,
        })
        .eq("id", payment.id)
        .select(`
          *,
          employees!inner(name)
        `)
        .single()

      if (error) {
        console.error("Error al actualizar pago:", error)
        return null
      }

      return {
        ...data,
        employee_name: data.employees?.name,
      }
    } else {
      // Crear nuevo pago
      const { data, error } = await supabase
        .from("employee_payments")
        .insert({
          employee_id: payment.employee_id,
          amount: payment.amount,
          payment_date: payment.payment_date,
          week_start: payment.week_start,
          week_end: payment.week_end,
          status: payment.status || "pendiente",
          notes: payment.notes,
          created_by: username,
        })
        .select(`
          *,
          employees!inner(name)
        `)
        .single()

      if (error) {
        console.error("Error al crear pago:", error)
        return null
      }

      return {
        ...data,
        employee_name: data.employees?.name,
      }
    }
  } catch (err) {
    console.error("Error inesperado al guardar pago:", err)
    return null
  }
}

export const deletePayment = async (id: number): Promise<boolean> => {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  try {
    const { error } = await supabase.from("employee_payments").delete().eq("id", id)

    if (error) {
      console.error("Error al eliminar pago:", error)
      return false
    }

    return true
  } catch (err) {
    console.error("Error inesperado al eliminar pago:", err)
    return false
  }
}

// Hook personalizado para usar las funciones de base de datos con el usuario actual
export const useEmployeeDB = () => {
  const { session } = useAuth()
  const username = session?.username || "sistema"

  return {
    getEmployees,
    saveEmployee,
    deleteEmployee,
    getAssignments,
    saveAssignment: (assignment: Partial<EmployeeAssignment>) => saveAssignment(assignment, username),
    deleteAssignment,
    getPayments,
    savePayment: (payment: Partial<EmployeePayment>) => savePayment(payment, username),
    deletePayment,
  }
}
