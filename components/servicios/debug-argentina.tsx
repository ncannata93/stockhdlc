"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Search, Database } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

interface DiagnosticResult {
  section: string
  data: any[]
  error?: string
}

export function DebugArgentina() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [loading, setLoading] = useState(false)

  const runDiagnostic = async () => {
    setLoading(true)
    setResults([])

    const supabase = getSupabaseClient()
    if (!supabase) {
      setResults([
        {
          section: "Error de Conexión",
          data: [],
          error: "No se pudo conectar a Supabase. Verifica las credenciales.",
        },
      ])
      setLoading(false)
      return
    }

    const diagnosticResults: DiagnosticResult[] = []

    try {
      // 1. Verificar hoteles
      console.log("🔍 Verificando hoteles...")
      const { data: hotels, error: hotelsError } = await supabase.from("hotels").select("*").order("name")

      diagnosticResults.push({
        section: "Hoteles Existentes",
        data: hotels || [],
        error: hotelsError?.message,
      })

      // 2. Verificar hotel Argentina específicamente
      console.log("🔍 Verificando hotel Argentina...")
      const { data: argentinaHotel, error: argentinaHotelError } = await supabase
        .from("hotels")
        .select("*")
        .ilike("name", "%argentina%")

      diagnosticResults.push({
        section: "Hotel Argentina",
        data: argentinaHotel || [],
        error: argentinaHotelError?.message,
      })

      // 3. Verificar servicios de Argentina
      console.log("🔍 Verificando servicios de Argentina...")
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select(`
          id,
          name,
          hotel_id,
          hotels!inner(id, name)
        `)
        .ilike("hotels.name", "%argentina%")

      diagnosticResults.push({
        section: "Servicios de Argentina",
        data: services || [],
        error: servicesError?.message,
      })

      // 4. Contar pagos totales
      console.log("🔍 Contando pagos totales...")
      const { count: totalPayments, error: countError } = await supabase
        .from("service_payments")
        .select("*", { count: "exact", head: true })

      diagnosticResults.push({
        section: "Total de Pagos",
        data: [{ total: totalPayments }],
        error: countError?.message,
      })

      // 5. Verificar pagos de Argentina (método directo)
      console.log("🔍 Verificando pagos de Argentina (método directo)...")
      const { data: directPayments, error: directError } = await supabase
        .from("service_payments")
        .select(`
          *,
          services(
            id, 
            name,
            hotels(id, name)
          )
        `)
        .order("payment_date", { ascending: false })
        .limit(50)

      // Filtrar manualmente los de Argentina
      const argentinaPayments = (directPayments || []).filter((payment) =>
        payment.services?.hotels?.name?.toLowerCase().includes("argentina"),
      )

      diagnosticResults.push({
        section: "Pagos de Argentina (Método Directo)",
        data: argentinaPayments,
        error: directError?.message,
      })

      // 6. Verificar pagos enero 2025 de Argentina
      console.log("🔍 Verificando pagos enero 2025...")
      const enero2025Payments = argentinaPayments.filter((payment) => payment.year === 2025 && payment.month === 1)

      diagnosticResults.push({
        section: "Argentina Enero 2025 (Filtrado)",
        data: enero2025Payments,
        error: undefined,
      })

      // 7. Verificar todos los pagos de enero 2025 (sin filtro de hotel)
      console.log("🔍 Verificando todos los pagos enero 2025...")
      const { data: allEnero2025, error: allEneroError } = await supabase
        .from("service_payments")
        .select(`
          *,
          services(
            id, 
            name,
            hotels(id, name)
          )
        `)
        .eq("year", 2025)
        .eq("month", 1)
        .order("payment_date", { ascending: false })

      diagnosticResults.push({
        section: "Todos los Pagos Enero 2025",
        data: allEnero2025 || [],
        error: allEneroError?.message,
      })

      // 8. Verificar inconsistencias de fecha
      console.log("🔍 Verificando inconsistencias de fecha...")
      const { data: inconsistent, error: inconsistentError } = await supabase
        .from("service_payments")
        .select(`
          *,
          services(
            id, 
            name,
            hotels(id, name)
          )
        `)
        .gte("payment_date", "2025-01-01")
        .lt("payment_date", "2025-02-01")
        .neq("year", 2025)

      diagnosticResults.push({
        section: "Inconsistencias de Fecha",
        data: inconsistent || [],
        error: inconsistentError?.message,
      })

      setResults(diagnosticResults)
      console.log("✅ Diagnóstico completado:", diagnosticResults)
    } catch (error) {
      console.error("❌ Error en diagnóstico:", error)
      setResults([
        {
          section: "Error General",
          data: [],
          error: error instanceof Error ? error.message : "Error desconocido",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const formatData = (data: any) => {
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-yellow-800">No se encontraron datos</p>
          </div>
        )
      }

      return data.map((item, index) => (
        <div key={index} className="bg-gray-50 p-3 rounded mb-2 border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {Object.entries(item).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="font-medium text-gray-600 w-24 flex-shrink-0">{key}:</span>
                <span className="text-gray-800 break-all">
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))
    }
    return (
      <div className="bg-gray-50 p-3 rounded">
        <pre className="text-xs overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Diagnóstico Argentina Enero 2025
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Este diagnóstico verificará por qué no aparecen los pagos de Argentina en enero 2025.
          </p>

          <Button onClick={runDiagnostic} disabled={loading} className="w-full">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Ejecutando Diagnóstico...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Ejecutar Diagnóstico
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {result.error ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Database className="h-5 w-5 text-green-500" />
                  )}
                  {result.section}
                  <span className="text-sm font-normal text-gray-500">
                    ({Array.isArray(result.data) ? result.data.length : 1} registros)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.error ? (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-red-800 font-medium">Error:</p>
                    <p className="text-red-700">{result.error}</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">{formatData(result.data)}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
