"use client"
import EmpleadosInicio from "@/components/empleados/inicio"

interface InicioProps {
  onTabChange?: (tab: string) => void
  refreshTrigger?: number
}

export default function Inicio({ onTabChange, refreshTrigger }: InicioProps) {
  console.log("🔍 Inicio component - refreshTrigger:", refreshTrigger)

  return <EmpleadosInicio onTabChange={onTabChange} refreshTrigger={refreshTrigger} />
}
