"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface DiagnosticResult {
  employee_name: string
  date: string
  hotels: string[]
  daily_rate: number
  total_assigned: number
  is_correct: boolean
  expected_per_hotel: number
}

export default function DeepDiagnosis() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [loading, setLoading] = useState(false)
  const [correcting, setCorrecting] = useState(false)

  const runDiagnosis = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc("diagnose_rate_issues")

      if (error) {
        console.error("Error en diagnóstico:", error)
        return
      }

      setResults(data || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const correctIssues = async () => {
    setCorrecting(true)
    try {
      const { error } = await supabase.rpc("fix_rate_issues")

      if (error) {
        console.error("Error corrigiendo:", error)
        return
      }

      // Volver a ejecutar diagnóstico
      await runDiagnosis()
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setCorrecting(false)
    }
  }

  useEffect(() => {
    runDiagnosis()
  }, [])

  const incorrectCases = results.filter((r) => !r.is_correct)
  const correctCases = results.filter((r) => r.is_correct)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Diagnóstico Profundo de Tarifas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runDiagnosis} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ejecutar Diagnóstico
            </Button>

            {incorrectCases.length > 0 && (
              <Button onClick={correctIssues} disabled={correcting} variant="destructive">
                {correcting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Corregir {incorrectCases.length} casos
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">{correctCases.length}</p>
                    <p className="text-sm text-muted-foreground">Casos Correctos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-red-600">{incorrectCases.length}</p>
                    <p className="text-sm text-muted-foreground">Casos Incorrectos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{results.length}</p>
                    <p className="text-sm text-muted-foreground">Total Casos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {incorrectCases.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Se encontraron {incorrectCases.length} casos con tarifas incorrectas que necesitan corrección.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.is_correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{result.employee_name}</h4>
                      <Badge variant="outline">{result.date}</Badge>
                      {result.is_correct ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Hoteles</p>
                      <p className="font-medium">{result.hotels.join(", ")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tarifa Diaria</p>
                      <p className="font-medium">${result.daily_rate.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Asignado</p>
                      <p className="font-medium">${result.total_assigned.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Esperado por Hotel</p>
                      <p className="font-medium">${result.expected_per_hotel.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
