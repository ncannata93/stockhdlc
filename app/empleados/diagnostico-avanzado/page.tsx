import DiagnosticoTarifas from "@/components/empleados/diagnostico-tarifas"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import DeepDiagnosis from "@/components/empleados/deep-diagnosis"

export default function DiagnosticoAvanzadoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Diagnóstico Avanzado</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/empleados">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Empleados
          </Link>
        </Button>
      </div>

      <DiagnosticoTarifas />

      <DeepDiagnosis />
    </div>
  )
}
