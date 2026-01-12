"use client"

import EmpleadosResumen from "@/components/empleados/resumen"

interface ResumenProps {
  onStatsChange?: () => void
}

export default function Resumen({ onStatsChange }: ResumenProps) {
  console.log("🔍 Resumen component - onStatsChange:", !!onStatsChange)

  return <EmpleadosResumen onStatsChange={onStatsChange} />
}
