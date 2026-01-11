import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

/**
 * Convierte una fecha string a un objeto Date sin problemas de zona horaria
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns Date object o null si la fecha es inválida
 */
export const parseDate = (dateString: string | Date | null | undefined): Date | null => {
  if (!dateString) return null

  try {
    if (dateString instanceof Date) return dateString

    // Asegurarse de que la fecha tenga el formato correcto
    if (typeof dateString === "string") {
      // Si ya tiene tiempo, usar parseISO
      if (dateString.includes("T")) {
        return parseISO(dateString)
      }
      // Si no tiene tiempo, añadir T00:00:00
      return new Date(`${dateString}T00:00:00`)
    }

    return null
  } catch (error) {
    console.error("Error parsing date:", dateString, error)
    return null
  }
}

/**
 * Formatea una fecha para mostrar en la interfaz de usuario
 * @param date - Fecha en formato YYYY-MM-DD, Date object o null/undefined
 * @param formatString - Formato deseado (por defecto dd/MM/yyyy)
 * @returns Fecha formateada o string vacío si la fecha es inválida
 */
export const formatDateString = (date: string | Date | null | undefined, formatString = "dd/MM/yyyy"): string => {
  try {
    const parsedDate = parseDate(date)
    if (!parsedDate) return ""

    return format(parsedDate, formatString, { locale: es })
  } catch (error) {
    console.error("Error formatting date:", date, error)
    return ""
  }
}

/**
 * Formatea una fecha para mostrar en la interfaz de usuario
 * @param date - Fecha en formato YYYY-MM-DD, Date object o null/undefined
 * @returns Fecha formateada para mostrar (dd/MM/yyyy) o string vacío si la fecha es inválida
 */
export const formatDateForDisplay = (date: string | Date | null | undefined): string => {
  return formatDateString(date, "dd/MM/yyyy")
}

/**
 * Formatea una fecha para usar en inputs de tipo date
 * @param date - Fecha en formato YYYY-MM-DD, Date object o null/undefined
 * @returns Fecha en formato YYYY-MM-DD o string vacío si la fecha es inválida
 */
export const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (date instanceof Date) {
    try {
      return format(date, "yyyy-MM-dd")
    } catch (error) {
      console.error("Error formatting date for input:", date, error)
      return ""
    }
  }

  if (typeof date === "string") {
    // Si parece ser una fecha válida en formato YYYY-MM-DD, devolverla directamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }

    // Intentar convertir y formatear
    try {
      const parsedDate = parseDate(date)
      if (!parsedDate) return ""
      return format(parsedDate, "yyyy-MM-dd")
    } catch (error) {
      console.error("Error formatting string date for input:", date, error)
      return ""
    }
  }

  return ""
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 * @returns Fecha actual en formato string
 */
export const getCurrentDateString = (): string => {
  try {
    const now = new Date()
    return format(now, "yyyy-MM-dd")
  } catch (error) {
    console.error("Error getting current date:", error)
    return ""
  }
}

/**
 * Compara dos fechas string sin problemas de zona horaria
 * @param date1 - Primera fecha en formato YYYY-MM-DD
 * @param date2 - Segunda fecha en formato YYYY-MM-DD
 * @returns true si las fechas son iguales, false si no lo son o alguna es inválida
 */
export const isSameDate = (date1: string | null | undefined, date2: string | null | undefined): boolean => {
  if (!date1 || !date2) return false
  return date1 === date2
}

/**
 * Obtiene el inicio de la semana para una fecha dada
 * @param date - Fecha en formato YYYY-MM-DD o Date object
 * @returns Fecha de inicio de semana en formato YYYY-MM-DD o string vacío si la fecha es inválida
 */
export const getWeekStart = (date: string | Date | null | undefined): string => {
  try {
    const parsedDate = parseDate(date)
    if (!parsedDate) return ""

    const day = parsedDate.getDay()
    const diff = parsedDate.getDate() - day + (day === 0 ? -6 : 1) // Lunes como primer día
    const weekStart = new Date(parsedDate)
    weekStart.setDate(diff)
    return format(weekStart, "yyyy-MM-dd")
  } catch (error) {
    console.error("Error getting week start:", date, error)
    return ""
  }
}

/**
 * Obtiene el fin de la semana para una fecha dada
 * @param date - Fecha en formato YYYY-MM-DD o Date object
 * @returns Fecha de fin de semana en formato YYYY-MM-DD o string vacío si la fecha es inválida
 */
export const getWeekEnd = (date: string | Date | null | undefined): string => {
  try {
    const weekStart = getWeekStart(date)
    if (!weekStart) return ""

    const parsedWeekStart = parseDate(weekStart)
    if (!parsedWeekStart) return ""

    const weekEnd = new Date(parsedWeekStart)
    weekEnd.setDate(parsedWeekStart.getDate() + 6)
    return format(weekEnd, "yyyy-MM-dd")
  } catch (error) {
    console.error("Error getting week end:", date, error)
    return ""
  }
}

/**
 * Verifica si una fecha está dentro de un rango específico (inclusivo)
 * @param date - Fecha a verificar en formato YYYY-MM-DD
 * @param startDate - Fecha de inicio del rango en formato YYYY-MM-DD
 * @param endDate - Fecha de fin del rango en formato YYYY-MM-DD
 * @returns true si la fecha está dentro del rango, false si no
 */
export const isDateInRange = (
  date: string | null | undefined,
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): boolean => {
  if (!date || !startDate || !endDate) return false

  try {
    // Comparación directa de strings en formato YYYY-MM-DD
    return date >= startDate && date <= endDate
  } catch (error) {
    console.error("Error checking date range:", { date, startDate, endDate }, error)
    return false
  }
}

/**
 * Obtiene el rango de fechas de una semana específica
 * @param weekStart - Fecha de inicio de semana en formato YYYY-MM-DD
 * @returns Objeto con fechas de inicio y fin de la semana
 */
export const getWeekRange = (weekStart: string): { start: string; end: string } => {
  try {
    const start = parseDate(weekStart)
    if (!start) throw new Error("Invalid week start date")

    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    return {
      start: format(start, "yyyy-MM-dd"),
      end: format(end, "yyyy-MM-dd"),
    }
  } catch (error) {
    console.error("Error getting week range:", weekStart, error)
    return { start: "", end: "" }
  }
}

/**
 * Valida que una fecha esté en formato YYYY-MM-DD
 * @param dateString - Fecha a validar
 * @returns true si el formato es válido, false si no
 */
export const isValidDateFormat = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString)
}
