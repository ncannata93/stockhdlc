// Datos de empleados para el sistema
export interface EmpleadoData {
  id: string
  nombre: string
  activo: boolean
  fechaIngreso: string
  tarifa?: number
}

export const empleados: EmpleadoData[] = [
  {
    id: "1",
    nombre: "Tucu",
    activo: true,
    fechaIngreso: "2025-01-01",
    tarifa: 50000,
  },
  {
    id: "2",
    nombre: "Diego",
    activo: true,
    fechaIngreso: "2025-01-01",
    tarifa: 50000,
  },
  {
    id: "3",
    nombre: "David",
    activo: true,
    fechaIngreso: "2025-01-01",
    tarifa: 50000,
  },
  {
    id: "4",
    nombre: "Freire",
    activo: true,
    fechaIngreso: "2025-01-01",
    tarifa: 50000,
  },
]

// Función helper para obtener empleado por nombre
export const getEmpleadoByName = (nombre: string): EmpleadoData | undefined => {
  return empleados.find((emp) => emp.nombre.toLowerCase() === nombre.toLowerCase())
}

// Función helper para obtener todos los empleados activos
export const getEmpleadosActivos = (): EmpleadoData[] => {
  return empleados.filter((emp) => emp.activo)
}

// Exportar por defecto también por compatibilidad
export default empleados
