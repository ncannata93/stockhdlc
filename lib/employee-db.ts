"use client"

import { createClient } from "@supabase/supabase-js"
import type { Employee, EmployeeAssignment, EmployeePayment, Hotel } from "./employee-types"
import { HOTELS } from "./employee-types"
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
    console.log("🔍 getAssignments llamada con filtros:", filters)

    let query = supabase
      .from("employee_assignments")
      .select(`
        *,
        employees!inner(name)
      `)
      .order("assignment_date", { ascending: false })

    if (filters?.employee_id) {
      query = query.eq("employee_id", filters.employee_id)
      console.log("👤 Filtro por empleado:", filters.employee_id)
    }

    // FILTRADO ESTRICTO POR FECHAS
    if (filters?.start_date && filters?.end_date) {
      console.log("📅 Aplicando filtro de fechas:", filters.start_date, "a", filters.end_date)

      // Usar filtros SQL estrictos
      query = query.gte("assignment_date", filters.start_date).lte("assignment_date", filters.end_date)
    }

    const { data, error } = await query

    if (error) {
      console.error("❌ Error al obtener asignaciones:", error)
      return []
    }

    console.log("📊 Asignaciones obtenidas de BD:", data?.length || 0)

    // FILTRADO ADICIONAL EN JAVASCRIPT PARA ASEGURAR
    let filteredData = data || []

    if (filters?.start_date && filters?.end_date) {
      const originalCount = filteredData.length

      filteredData = filteredData.filter((assignment) => {
        const assignmentDate = assignment.assignment_date
        const isInRange = assignmentDate >= filters.start_date! && assignmentDate <= filters.end_date!

        if (!isInRange) {
          console.log(
            `❌ FILTRADO JS: Excluyendo ${assignmentDate} (fuera de ${filters.start_date} - ${filters.end_date})`,
          )
        }

        return isInRange
      })

      console.log(`🔧 Filtrado JS: ${originalCount} → ${filteredData.length} asignaciones`)
    }

    // Mostrar fechas finales
    const finalDates = [...new Set(filteredData.map((a) => a.assignment_date))].sort()
    console.log("📅 Fechas finales después de todos los filtros:", finalDates)

    // Formatear los datos para incluir el nombre del empleado
    return filteredData.map((item: any) => ({
      ...item,
      employee_name: item.employees?.name,
    }))
  } catch (err) {
    console.error("❌ Error inesperado al obtener asignaciones:", err)
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
    // IMPORTANTE: Usar la tarifa que se pasa explícitamente o obtener la tarifa actual del empleado
    let dailyRateUsed = assignment.daily_rate_used

    // Solo obtener la tarifa del empleado si no se proporciona explícitamente
    if (dailyRateUsed === undefined && assignment.employee_id) {
      console.log("Obteniendo tarifa del empleado desde la base de datos...")
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
      console.log(`Tarifa obtenida del empleado: ${dailyRateUsed}`)
    } else {
      console.log(`Usando tarifa proporcionada explícitamente: ${dailyRateUsed}`)
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
      console.log(`Verificando asignaciones existentes para el mismo día...`)

      // IMPORTANTE: Si ya se proporciona una tarifa explícita, usarla directamente
      // Esto evita problemas de concurrencia cuando se crean múltiples asignaciones simultáneamente
      if (assignment.daily_rate_used !== undefined) {
        console.log(`Usando tarifa proporcionada explícitamente: ${assignment.daily_rate_used}`)

        const { data, error } = await supabase
          .from("employee_assignments")
          .insert({
            employee_id: assignment.employee_id,
            hotel_name: assignment.hotel_name,
            assignment_date: assignment.assignment_date,
            daily_rate_used: assignment.daily_rate_used,
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

        console.log(`Asignación creada exitosamente con tarifa explícita: ${data.daily_rate_used}`)

        return {
          ...data,
          employee_name: data.employees?.name,
        }
      }

      // RESTO DE LA LÓGICA ORIGINAL para cuando no se proporciona tarifa explícita
      // 1. Verificar si ya existen asignaciones para este empleado en la misma fecha
      const { data: existingAssignments, error: existingError } = await supabase
        .from("employee_assignments")
        .select("*")
        .eq("employee_id", assignment.employee_id)
        .eq("assignment_date", assignment.assignment_date)

      if (existingError) {
        console.error("Error al verificar asignaciones existentes:", existingError)
        return null
      }

      // 2. Si ya existen asignaciones, recalcular la tarifa dividida
      let finalDailyRate = dailyRateUsed
      let notesText = assignment.notes || ""

      if (existingAssignments && existingAssignments.length > 0) {
        console.log(`¡Encontradas ${existingAssignments.length} asignaciones existentes para el mismo día!`)

        // Obtener la tarifa completa del empleado
        const { data: employeeData, error: employeeError } = await supabase
          .from("employees")
          .select("daily_rate")
          .eq("id", assignment.employee_id)
          .single()

        if (employeeError) {
          console.error("Error al obtener tarifa del empleado:", employeeError)
          return null
        }

        const fullDailyRate = employeeData.daily_rate

        // Calcular la nueva tarifa dividida (tarifa completa / (asignaciones existentes + 1 nueva))
        const totalAssignments = existingAssignments.length + 1
        finalDailyRate = Math.round(fullDailyRate / totalAssignments)

        console.log(`Recalculando tarifas: $${fullDailyRate} ÷ ${totalAssignments} = $${finalDailyRate} por hotel`)

        // CORRECCIÓN: Actualizar las asignaciones existentes con la nueva tarifa
        const updatePromises = existingAssignments.map(async (existingAssignment) => {
          const { error: updateError } = await supabase
            .from("employee_assignments")
            .update({
              daily_rate_used: finalDailyRate,
              notes: existingAssignment.notes
                ? `${existingAssignment.notes} | Tarifa recalculada automáticamente el ${new Date().toISOString().split("T")[0]}`
                : `Tarifa recalculada automáticamente el ${new Date().toISOString().split("T")[0]}`,
            })
            .eq("id", existingAssignment.id)

          if (updateError) {
            console.error("Error al actualizar asignación existente:", updateError)
            throw updateError
          }

          console.log(`✅ Actualizada asignación en ${existingAssignment.hotel_name}: tarifa → $${finalDailyRate}`)
          return true
        })

        // Esperar a que todas las actualizaciones se completen
        await Promise.all(updatePromises)

        notesText = notesText
          ? `${notesText} | Tarifa dividida entre ${totalAssignments} hoteles el ${new Date().toISOString().split("T")[0]}`
          : `Tarifa dividida entre ${totalAssignments} hoteles el ${new Date().toISOString().split("T")[0]}`
      }

      // 3. Crear la nueva asignación con la tarifa recalculada
      console.log(`Creando asignación con tarifa recalculada: ${finalDailyRate} para hotel: ${assignment.hotel_name}`)

      const { data, error } = await supabase
        .from("employee_assignments")
        .insert({
          employee_id: assignment.employee_id,
          hotel_name: assignment.hotel_name,
          assignment_date: assignment.assignment_date,
          daily_rate_used: finalDailyRate,
          notes: notesText,
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

      console.log(`Asignación creada exitosamente con tarifa: ${data.daily_rate_used}`)

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
  console.log("💾 INICIANDO savePayment")
  console.log("📝 Datos recibidos:", payment)
  console.log("👤 Usuario:", username)

  // VERIFICAR CONEXIÓN A SUPABASE
  const supabase = getSupabaseClient()
  if (!supabase) {
    console.error("❌ No hay cliente de Supabase disponible")
    console.error("❌ Variables de entorno:")
    console.error("- SUPABASE_URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.error("- SUPABASE_KEY:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    return null
  }

  console.log("✅ Cliente de Supabase inicializado correctamente")

  // VERIFICAR QUE LA TABLA EXISTE
  try {
    console.log("🔍 Verificando que la tabla employee_payments existe...")
    const { data: tableCheck, error: tableError } = await supabase.from("employee_payments").select("id").limit(1)

    if (tableError) {
      console.error("❌ Error al verificar tabla employee_payments:", tableError)
      console.error("❌ Esto indica que la tabla no existe o no hay permisos")
      return null
    }

    console.log("✅ Tabla employee_payments verificada correctamente")
  } catch (err) {
    console.error("❌ Error inesperado al verificar tabla:", err)
    return null
  }

  try {
    if (payment.id) {
      console.log("🔄 Actualizando pago existente con ID:", payment.id)
      console.log("📤 Enviando UPDATE a Supabase...")

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

      console.log("📥 Respuesta de Supabase UPDATE:", { data, error })

      if (error) {
        console.error("❌ Error al actualizar pago en Supabase:", error)
        return null
      }

      console.log("✅ Pago actualizado exitosamente en Supabase:", data)
      return {
        ...data,
        employee_name: data.employees?.name,
      }
    } else {
      console.log("➕ Creando nuevo pago")
      console.log("📤 Enviando INSERT a Supabase...")

      const insertData = {
        employee_id: payment.employee_id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        week_start: payment.week_start,
        week_end: payment.week_end,
        status: payment.status || "pendiente",
        notes: payment.notes,
        created_by: username,
      }

      console.log("📤 Datos a insertar en Supabase:", insertData)

      const { data, error } = await supabase
        .from("employee_payments")
        .insert(insertData)
        .select(`
          *,
          employees!inner(name)
        `)
        .single()

      console.log("📥 Respuesta de Supabase INSERT:", { data, error })

      if (error) {
        console.error("❌ Error al crear pago en Supabase:", error)
        console.error("❌ Detalles del error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        return null
      }

      console.log("✅ Pago creado exitosamente en Supabase:", data)
      return {
        ...data,
        employee_name: data.employees?.name,
      }
    }
  } catch (err) {
    console.error("❌ Error inesperado al guardar pago:", err)
    console.error("❌ Stack trace:", err instanceof Error ? err.stack : "No stack available")
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

// Función para obtener TODOS los hoteles disponibles (no solo los que tienen asignaciones)
export const getHotels = async (): Promise<Hotel[]> => {
  console.log("🏨 Obteniendo lista completa de hoteles...")

  try {
    // Usar la lista predefinida de hoteles y convertirla a objetos
    const hotels: Hotel[] = HOTELS.map((name, index) => ({
      id: index + 1,
      name: name,
    }))

    console.log("🏨 Hoteles disponibles:", hotels.length)
    console.log(
      "📋 Lista de hoteles:",
      hotels.map((h) => h.name),
    )

    return hotels
  } catch (err) {
    console.error("❌ Error inesperado al obtener hoteles:", err)
    return []
  }
}

// Alias para saveAssignment para compatibilidad
export const addEmployeeAssignment = async (assignmentData: {
  employee_id: number
  hotel_id?: number
  hotel_name?: string
  date: string
  daily_rate: number
  notes?: string
}): Promise<EmployeeAssignment | null> => {
  // Si viene hotel_id, necesitamos obtener el nombre del hotel
  let hotelName = assignmentData.hotel_name

  if (assignmentData.hotel_id && !hotelName) {
    const hotels = await getHotels()
    const hotel = hotels.find((h) => h.id === assignmentData.hotel_id)
    hotelName = hotel?.name
  }

  return saveAssignment({
    employee_id: assignmentData.employee_id,
    hotel_name: hotelName,
    assignment_date: assignmentData.date,
    daily_rate_used: assignmentData.daily_rate,
    notes: assignmentData.notes,
  })
}

// Hook personalizado para usar las funciones de base de datos con el usuario actual
export const useEmployeeDB = () => {
  const { session } = useAuth()
  const username = session?.username || "sistema"

  console.log("🔧 useEmployeeDB inicializado con usuario:", username)

  const wrappedSavePayment = (payment: Partial<EmployeePayment>) => {
    console.log("🎯 wrappedSavePayment llamado con:", payment)
    console.log("👤 Username para savePayment:", username)
    return savePayment(payment, username)
  }

  return {
    getEmployees,
    saveEmployee,
    deleteEmployee,
    getAssignments,
    saveAssignment: (assignment: Partial<EmployeeAssignment>) => saveAssignment(assignment, username),
    addEmployeeAssignment,
    deleteAssignment,
    getPayments,
    savePayment: wrappedSavePayment,
    deletePayment,
    getHotels,
  }
}
