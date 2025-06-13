import DiagnosticoTarifasEspecifico from "@/components/empleados/diagnostico-tarifas-especifico"

export default function DiagnosticoTarifasPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">🔍 Diagnóstico de Tarifas</h1>
        <p className="text-muted-foreground mt-2">
          Herramienta para detectar y corregir problemas de división de tarifas cuando los empleados trabajan en
          múltiples hoteles el mismo día.
        </p>
      </div>

      <DiagnosticoTarifasEspecifico />
    </div>
  )
}
