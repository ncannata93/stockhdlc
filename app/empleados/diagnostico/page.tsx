import SystemHealthCheck from "@/components/system-health-check"
import { ConnectionCheck } from "@/components/connection-check"
import DailyRateCheck from "@/components/daily-rate-check"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function DiagnosticoPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Diagnóstico del Sistema</h1>
        <Button variant="outline" asChild>
          <Link href="/empleados">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Empleados
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Diagnóstico Básico</TabsTrigger>
          <TabsTrigger value="advanced">Diagnóstico Avanzado</TabsTrigger>
          <TabsTrigger value="repair">Reparación</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid gap-4">
            <ConnectionCheck />
            <DailyRateCheck />
          </div>
        </TabsContent>
        <TabsContent value="advanced" className="space-y-4 mt-4">
          <SystemHealthCheck />
        </TabsContent>
        <TabsContent value="repair" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Herramientas de Reparación</CardTitle>
              <CardDescription>Utilice estas herramientas para reparar problemas en la base de datos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Reparación de Estructura</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Crea o repara las tablas necesarias para el funcionamiento del sistema
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/empleados/diagnostico-avanzado?script=verify-and-create-tables">
                        Ejecutar Script
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Corrección de Datos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Corrige problemas comunes en los datos como tarifas faltantes
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/empleados/diagnostico-avanzado?script=verificar-y-corregir-db">Ejecutar Script</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
