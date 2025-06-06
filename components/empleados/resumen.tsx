import type React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Assignment {
  assignment_date: string
}

interface ResumenProps {
  assignments: Assignment[]
}

const Resumen: React.FC<ResumenProps> = ({ assignments }) => {
  const formatDateYMD = (dateString: string): string => {
    try {
      return format(new Date(dateString + "T00:00:00"), "yyyy-MM-dd")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid Date"
    }
  }

  const formatDateDMY = (dateString: string): string => {
    try {
      return format(new Date(dateString + "T00:00:00"), "dd/MM/yyyy", { locale: es })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid Date"
    }
  }

  return (
    <div>
      <h2>Resumen de Asignaciones</h2>
      {assignments && assignments.length > 0 ? (
        <ul>
          {assignments.map((assignment, index) => (
            <li key={index}>
              Fecha de asignación (YYYY-MM-DD): {formatDateYMD(assignment.assignment_date)}
              <br />
              Fecha de asignación (DD/MM/YYYY): {formatDateDMY(assignment.assignment_date)}
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay asignaciones disponibles.</p>
      )}
    </div>
  )
}

export default Resumen
