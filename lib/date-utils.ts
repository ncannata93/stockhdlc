import { format } from "date-fns"
import { es } from "date-fns/locale"

/**
 * Convierte una fecha string a un objeto Date sin problemas de zona horaria
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns Date object
 */
export const parseDate = (dateString: string): Date => {
  // Añadir tiempo para evitar problemas de zona horaria
  return new Date(dateString + "T00:00:00")
}

/**
 * Formatea una fecha string para mostrar en la UI
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @param formatString - Formato deseado (por defecto dd/MM/yyyy)
 * @returns Fecha formateada
 */
export const formatDateString = (dateString: string, formatString = "dd/MM/yyyy"): string => {
  const date = parseDate(dateString)
  return format(date, formatString, { locale: es })
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 * @returns Fecha actual en formato string
 */
export const getCurrentDateString = (): string => {
  const now = new Date()
  return format(now, "yyyy-MM-dd")
}

/**
 * Compara dos fechas string sin problemas de zona horaria
 * @param date1 - Primera fecha en formato YYYY-MM-DD
 * @param date2 - Segunda fecha en formato YYYY-MM-DD
 * @returns true si las fechas son iguales
 */
export const isSameDate = (date1: string, date2: string): boolean => {
  return date1 === date2
}
