// Implementación de almacenamiento local para modo offline

export interface OfflineEmployee {
  id: number
  name: string
  role: string
  daily_rate: number
  created_at: string
}

export interface OfflineAssignment {
  id: number
  employee_id: number
  hotel_name: string
  assignment_date: string
  daily_rate_used: number
  notes?: string
  created_at: string
  created_by?: string
  employee_name?: string
}

export interface OfflinePayment {
  id: number
  employee_id: number
  amount: number
  payment_date: string
  week_start: string
  week_end: string
  status: string
  notes?: string
  created_at: string
  created_by?: string
  employee_name?: string
}

// Función para generar IDs únicos
const generateId = (): number => {
  return Date.now() + Math.floor(Math.random() * 1000)
}

// Funciones para empleados
export const getOfflineEmployees = (): OfflineEmployee[] => {
  try {
    const employees = localStorage.getItem("offline_employees")
    return employees ? JSON.parse(employees) : []
  } catch (error) {
    console.error("Error al obtener empleados offline:", error)
    return []
  }
}

export const saveOfflineEmployee = (employee: Partial<OfflineEmployee>): OfflineEmployee | null => {
  try {
    const employees = getOfflineEmployees()

    if (employee.id) {
      // Actualizar empleado existente
      const index = employees.findIndex((e) => e.id === employee.id)
      if (index >= 0) {
        const updatedEmployee = {
          ...employees[index],
          ...employee,
        }
        employees[index] = updatedEmployee
        localStorage.setItem("offline_employees", JSON.stringify(employees))
        return updatedEmployee
      }
      return null
    } else {
      // Crear nuevo empleado
      const newEmployee: OfflineEmployee = {
        id: generateId(),
        name: employee.name || "",
        role: employee.role || "Mantenimiento",
        daily_rate: employee.daily_rate || 0,
        created_at: new Date().toISOString(),
      }
      employees.push(newEmployee)
      localStorage.setItem("offline_employees", JSON.stringify(employees))
      return newEmployee
    }
  } catch (error) {
    console.error("Error al guardar empleado offline:", error)
    return null
  }
}

export const deleteOfflineEmployee = (id: number): boolean => {
  try {
    const employees = getOfflineEmployees()
    const filteredEmployees = employees.filter((e) => e.id !== id)
    localStorage.setItem("offline_employees", JSON.stringify(filteredEmployees))
    return true
  } catch (error) {
    console.error("Error al eliminar empleado offline:", error)
    return false
  }
}

// Funciones para asignaciones
export const getOfflineAssignments = (filters?: {
  employee_id?: number
  start_date?: string
  end_date?: string
}): OfflineAssignment[] => {
  try {
    const assignments = localStorage.getItem("offline_assignments")
    let result: OfflineAssignment[] = assignments ? JSON.parse(assignments) : []

    // Aplicar filtros
    if (filters) {
      if (filters.employee_id) {
        result = result.filter((a) => a.employee_id === filters.employee_id)
      }
      if (filters.start_date && filters.end_date) {
        result = result.filter(
          (a) => a.assignment_date >= filters.start_date! && a.assignment_date <= filters.end_date!,
        )
      }
    }

    // Agregar nombres de empleados
    const employees = getOfflineEmployees()
    result = result.map((assignment) => {
      const employee = employees.find((e) => e.id === assignment.employee_id)
      return {
        ...assignment,
        employee_name: employee?.name || `Empleado #${assignment.employee_id}`,
      }
    })

    // Ordenar por fecha descendente
    return result.sort((a, b) => (a.assignment_date > b.assignment_date ? -1 : 1))
  } catch (error) {
    console.error("Error al obtener asignaciones offline:", error)
    return []
  }
}

export const saveOfflineAssignment = (
  assignment: Partial<OfflineAssignment>,
  username?: string,
): OfflineAssignment | null => {
  try {
    const assignments = getOfflineAssignments()
    const employees = getOfflineEmployees()

    // Si no se proporciona daily_rate_used, obtener la tarifa actual del empleado
    let dailyRateUsed = assignment.daily_rate_used
    if (!dailyRateUsed && assignment.employee_id) {
      const employee = employees.find((e) => e.id === assignment.employee_id)
      dailyRateUsed = employee?.daily_rate || 0
    }

    if (assignment.id) {
      // Actualizar asignación existente
      const index = assignments.findIndex((a) => a.id === assignment.id)
      if (index >= 0) {
        const updatedAssignment = {
          ...assignments[index],
          ...assignment,
          daily_rate_used: dailyRateUsed,
          created_by: username || assignments[index].created_by,
        }
        assignments[index] = updatedAssignment

        // Agregar nombre del empleado
        const employee = employees.find((e) => e.id === updatedAssignment.employee_id)
        updatedAssignment.employee_name = employee?.name || `Empleado #${updatedAssignment.employee_id}`

        localStorage.setItem("offline_assignments", JSON.stringify(assignments))
        return updatedAssignment
      }
      return null
    } else {
      // Crear nueva asignación
      const newAssignment: OfflineAssignment = {
        id: generateId(),
        employee_id: assignment.employee_id || 0,
        hotel_name: assignment.hotel_name || "",
        assignment_date: assignment.assignment_date || new Date().toISOString().split("T")[0],
        daily_rate_used: dailyRateUsed || 0,
        notes: assignment.notes,
        created_at: new Date().toISOString(),
        created_by: username || "sistema",
      }

      // Agregar nombre del empleado
      const employee = employees.find((e) => e.id === newAssignment.employee_id)
      newAssignment.employee_name = employee?.name || `Empleado #${newAssignment.employee_id}`

      assignments.push(newAssignment)
      localStorage.setItem("offline_assignments", JSON.stringify(assignments))
      return newAssignment
    }
  } catch (error) {
    console.error("Error al guardar asignación offline:", error)
    return null
  }
}

export const deleteOfflineAssignment = (id: number): boolean => {
  try {
    const assignments = getOfflineAssignments()
    const filteredAssignments = assignments.filter((a) => a.id !== id)
    localStorage.setItem("offline_assignments", JSON.stringify(filteredAssignments))
    return true
  } catch (error) {
    console.error("Error al eliminar asignación offline:", error)
    return false
  }
}

// Funciones para pagos
export const getOfflinePayments = (filters?: {
  employee_id?: number
  status?: string
  start_date?: string
  end_date?: string
}): OfflinePayment[] => {
  try {
    const payments = localStorage.getItem("offline_payments")
    let result: OfflinePayment[] = payments ? JSON.parse(payments) : []

    // Aplicar filtros
    if (filters) {
      if (filters.employee_id) {
        result = result.filter((p) => p.employee_id === filters.employee_id)
      }
      if (filters.status) {
        result = result.filter((p) => p.status === filters.status)
      }
      if (filters.start_date && filters.end_date) {
        result = result.filter((p) => p.payment_date >= filters.start_date! && p.payment_date <= filters.end_date!)
      }
    }

    // Agregar nombres de empleados
    const employees = getOfflineEmployees()
    result = result.map((payment) => {
      const employee = employees.find((e) => e.id === payment.employee_id)
      return {
        ...payment,
        employee_name: employee?.name || `Empleado #${payment.employee_id}`,
      }
    })

    // Ordenar por fecha descendente
    return result.sort((a, b) => (a.payment_date > b.payment_date ? -1 : 1))
  } catch (error) {
    console.error("Error al obtener pagos offline:", error)
    return []
  }
}

export const saveOfflinePayment = (payment: Partial<OfflinePayment>, username?: string): OfflinePayment | null => {
  try {
    const payments = getOfflinePayments()
    const employees = getOfflineEmployees()

    if (payment.id) {
      // Actualizar pago existente
      const index = payments.findIndex((p) => p.id === payment.id)
      if (index >= 0) {
        const updatedPayment = {
          ...payments[index],
          ...payment,
          created_by: username || payments[index].created_by,
        }
        payments[index] = updatedPayment

        // Agregar nombre del empleado
        const employee = employees.find((e) => e.id === updatedPayment.employee_id)
        updatedPayment.employee_name = employee?.name || `Empleado #${updatedPayment.employee_id}`

        localStorage.setItem("offline_payments", JSON.stringify(payments))
        return updatedPayment
      }
      return null
    } else {
      // Crear nuevo pago
      const newPayment: OfflinePayment = {
        id: generateId(),
        employee_id: payment.employee_id || 0,
        amount: payment.amount || 0,
        payment_date: payment.payment_date || new Date().toISOString().split("T")[0],
        week_start: payment.week_start || "",
        week_end: payment.week_end || "",
        status: payment.status || "pendiente",
        notes: payment.notes,
        created_at: new Date().toISOString(),
        created_by: username || "sistema",
      }

      // Agregar nombre del empleado
      const employee = employees.find((e) => e.id === newPayment.employee_id)
      newPayment.employee_name = employee?.name || `Empleado #${newPayment.employee_id}`

      payments.push(newPayment)
      localStorage.setItem("offline_payments", JSON.stringify(payments))
      return newPayment
    }
  } catch (error) {
    console.error("Error al guardar pago offline:", error)
    return null
  }
}

export const deleteOfflinePayment = (id: number): boolean => {
  try {
    const payments = getOfflinePayments()
    const filteredPayments = payments.filter((p) => p.id !== id)
    localStorage.setItem("offline_payments", JSON.stringify(filteredPayments))
    return true
  } catch (error) {
    console.error("Error al eliminar pago offline:", error)
    return false
  }
}

// Inicializar datos de ejemplo si no existen
export const initializeOfflineData = () => {
  try {
    // Verificar si ya hay datos
    const employees = getOfflineEmployees()
    if (employees.length === 0) {
      // Crear empleados de ejemplo
      const exampleEmployees = [
        { name: "Juan Pérez", role: "Mantenimiento", daily_rate: 50000 },
        { name: "María López", role: "Limpieza", daily_rate: 45000 },
        { name: "Carlos Rodríguez", role: "Mantenimiento", daily_rate: 52000 },
      ]

      exampleEmployees.forEach((emp) => saveOfflineEmployee(emp))
      console.log("Datos offline inicializados con éxito")
    }
  } catch (error) {
    console.error("Error al inicializar datos offline:", error)
  }
}
