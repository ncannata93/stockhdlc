import { startOfWeek } from "date-fns"

/**
 * Calcula el inicio y fin de semana para una fecha dada
 * IMPORTANTE: Esta función debe ser usada por TODOS los componentes
 * para garantizar consistencia en los cálculos
 */
export const getWeekRange = (date: Date | string): { weekStart: string; weekEnd: string } => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date

    // 🔧 LÓGICA UNIFICADA: Lunes como inicio de semana
    const weekStart = startOfWeek(dateObj, { weekStartsOn: 1 }) // 1 = Lunes
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // Lunes + 6 días = Domingo

    const weekStartStr = weekStart.toISOString().split("T")[0]
    const weekEndStr = weekEnd.toISOString().split("T")[0]

    console.log(
      `📅 getWeekRange - Fecha: ${dateObj.toISOString().split("T")[0]} → Semana: ${weekStartStr} - ${weekEndStr}`,
    )

    return {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
    }
  } catch (error) {
    console.error("Error en getWeekRange:", error)
    return {
      weekStart: "",
      weekEnd: "",
    }
  }
}

/**
 * Verifica si una semana calculada tiene solapamiento significativo con semanas pagadas
 * IMPORTANTE: Esta función debe ser usada por TODOS los componentes
 */
export const hasSignificantWeekOverlap = (
  weekStart: string,
  weekEnd: string,
  paidWeeks: any[],
  employeeId: number,
): boolean => {
  try {
    if (!weekStart || !weekEnd || !Array.isArray(paidWeeks) || !employeeId) return false

    const employeePaidWeeks = paidWeeks.filter((pw) => pw.employee_id === employeeId)

    console.log(`🔍 hasSignificantWeekOverlap - Empleado ${employeeId}:`)
    console.log(`   Semana calculada: ${weekStart} - ${weekEnd}`)
    console.log(`   Registros pagados: ${employeePaidWeeks.length}`)

    // PASO 1: Buscar registro EXACTO
    const exactMatch = employeePaidWeeks.find((pw) => pw.week_start === weekStart && pw.week_end === weekEnd)
    if (exactMatch) {
      console.log(`🎯 Registro EXACTO encontrado: $${exactMatch.amount}`)
      return exactMatch.amount > 0
    }

    // PASO 2: Buscar solapamientos significativos
    const significantOverlaps = employeePaidWeeks.filter((pw) => {
      if (pw.amount === 0) return false // Ignorar pendientes explícitos

      const hasOverlap = weekStart <= pw.week_end && weekEnd >= pw.week_start
      if (hasOverlap) {
        const overlapStart = weekStart > pw.week_start ? weekStart : pw.week_start
        const overlapEnd = weekEnd < pw.week_end ? weekEnd : pw.week_end
        const startDate = new Date(overlapStart)
        const endDate = new Date(overlapEnd)
        const overlapDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

        console.log(`🔍 Solapamiento: ${pw.week_start} - ${pw.week_end} (${overlapDays} días, $${pw.amount})`)
        return overlapDays > 0
      }
      return false
    })

    const hasSignificantOverlap = significantOverlaps.length > 0
    console.log(`${hasSignificantOverlap ? "✅" : "❌"} Resultado: ${hasSignificantOverlap ? "PAGADA" : "PENDIENTE"}`)

    return hasSignificantOverlap
  } catch (error) {
    console.error("Error en hasSignificantWeekOverlap:", error)
    return false
  }
}
